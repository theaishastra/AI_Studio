from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..config import get_settings
from ..database import get_db
from ..deps import audit, get_current_user
from ..models import OtpCode, RefreshToken, User
from ..schemas import (
    LoginIn, OtpRequest, OtpVerify, RefreshRequest, Token, TokenPair, UserOut, UserUpdate,
)
from ..security import (
    create_access_token, decode_token, generate_otp, hash_otp, hash_refresh_token,
    new_refresh_token, verify_password,
)
from ..services.email_service import send_otp_email

router = APIRouter(prefix="/api/auth", tags=["auth"])
settings = get_settings()

OTP_TTL_MINUTES = 5
OTP_MAX_ATTEMPTS = 5


@router.post("/login", response_model=Token)
def login(body: LoginIn, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email.lower().strip()).first()
    if not user or not user.is_active or not user.password_hash or not verify_password(body.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    user.last_login = datetime.now(timezone.utc)
    audit(db, user, "admin_login", "user", user.id, request=request)
    db.commit()
    return Token(access_token=create_access_token(user.id, user.role))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.patch("/me", response_model=UserOut)
def update_me(body: UserUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if body.phone and body.phone != user.phone:
        clash = db.query(User).filter(User.phone == body.phone, User.id != user.id).first()
        if clash:
            raise HTTPException(status.HTTP_409_CONFLICT, "Phone number already in use")
        user.phone = body.phone
    if body.name is not None:
        user.name = body.name
    db.commit()
    db.refresh(user)
    return user


# ---------------------------------------------------------------- customer OTP login

def _issue_tokens(db: Session, user: User) -> TokenPair:
    access = create_access_token(user.id, user.role)
    refresh = new_refresh_token()
    db.add(RefreshToken(
        user_id=user.id,
        token_hash=hash_refresh_token(refresh),
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_days),
    ))
    return TokenPair(access_token=access, refresh_token=refresh)


@router.post("/otp/request")
def request_otp(body: OtpRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    email = body.email.lower().strip()
    db.query(OtpCode).filter(OtpCode.email == email, OtpCode.used == False).update({"used": True})

    code = generate_otp()
    db.add(OtpCode(
        email=email,
        code_hash=hash_otp(email, code),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=OTP_TTL_MINUTES),
    ))

    response = {"message": "OTP sent to your email", "ttl_minutes": OTP_TTL_MINUTES}
    if settings.debug_otp:
        response["debug_otp"] = code
    else:
        if not settings.smtp_configured:
            raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Email delivery is not configured")
        background_tasks.add_task(send_otp_email, email, code, OTP_TTL_MINUTES)

    db.commit()
    return response


@router.post("/otp/verify", response_model=TokenPair)
def verify_otp(body: OtpVerify, request: Request, db: Session = Depends(get_db)):
    email = body.email.lower().strip()
    otp = (
        db.query(OtpCode)
        .filter(OtpCode.email == email, OtpCode.used == False)
        .order_by(OtpCode.created_at.desc())
        .first()
    )
    if not otp or otp.expires_at < datetime.now(timezone.utc) or otp.attempts >= OTP_MAX_ATTEMPTS:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired OTP")
    if otp.code_hash != hash_otp(email, body.code):
        otp.attempts += 1
        db.commit()
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired OTP")

    otp.used = True

    user = db.query(User).filter(User.email == email).first()
    action = "login"
    if not user:
        user = User(email=email, name=body.name, role="customer")
        db.add(user)
        try:
            db.flush()
            action = "signup"
        except IntegrityError:
            # A second request for the same brand-new signup (e.g. a double-submit
            # from the frontend) can race this one - it lost, so fall back to the
            # user the other request just created instead of a raw 500.
            db.rollback()
            user = db.query(User).filter(User.email == email).first()
            if not user:
                raise
    elif body.name and not user.name:
        user.name = body.name

    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account disabled")

    user.last_login = datetime.now(timezone.utc)
    audit(db, user, action, "user", user.id, request=request)
    tokens = _issue_tokens(db, user)
    db.commit()
    return tokens


@router.post("/refresh", response_model=TokenPair)
def refresh_token(body: RefreshRequest, db: Session = Depends(get_db)):
    token_hash = hash_refresh_token(body.refresh_token)
    row = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
    if not row or row.revoked or row.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired refresh token")
    user = db.get(User, row.user_id)
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found or disabled")
    row.revoked = True
    tokens = _issue_tokens(db, user)
    db.commit()
    return tokens


@router.post("/logout")
def logout(body: RefreshRequest, request: Request, db: Session = Depends(get_db)):
    token_hash = hash_refresh_token(body.refresh_token)
    row = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
    if row:
        row.revoked = True
        audit(db, db.get(User, row.user_id), "logout", "user", row.user_id, request=request)
    db.commit()
    return {"message": "Logged out"}
