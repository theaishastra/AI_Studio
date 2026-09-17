import logging

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..config import get_settings
from ..database import get_db
from ..models import ContactMessage
from ..schemas import ContactIn, ContactOut
from ..services.email_service import EmailSendError, send_email

router = APIRouter(prefix="/api/contact", tags=["contact"])
settings = get_settings()
logger = logging.getLogger("contact")


@router.post("", response_model=ContactOut, status_code=status.HTTP_201_CREATED)
def create_contact_message(body: ContactIn, db: Session = Depends(get_db)):
    message = ContactMessage(**body.model_dump())
    db.add(message)
    db.commit()
    db.refresh(message)

    # Best-effort notification only - the enquiry is already saved above, so a
    # down/unconfigured SMTP server must not fail the request the visitor is
    # waiting on.
    try:
        send_email(
            settings.admin_email,
            f"New enquiry: {message.subject}",
            f"""
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
              <h2 style="color:#7a1e2c;">New Contact Enquiry</h2>
              <p><strong>Name:</strong> {message.name}</p>
              <p><strong>Phone:</strong> {message.phone}</p>
              <p><strong>Email:</strong> {message.email}</p>
              <p><strong>Topic:</strong> {message.topic or '-'}</p>
              <p><strong>Subject:</strong> {message.subject}</p>
              <p><strong>Message:</strong><br>{message.message}</p>
            </div>
            """,
        )
    except EmailSendError as exc:
        logger.warning("Failed to email admin about contact message %s: %s", message.id, exc)

    return message
