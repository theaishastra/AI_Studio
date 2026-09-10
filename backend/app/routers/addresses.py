from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import Address, User
from ..schemas import AddressIn, AddressOut

router = APIRouter(prefix="/api/addresses", tags=["addresses"])


@router.get("", response_model=list[AddressOut])
def list_addresses(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(Address)
        .filter(Address.user_id == user.id)
        .order_by(Address.is_default.desc(), Address.created_at.desc())
        .all()
    )


def _unset_other_defaults(db: Session, user_id: str, exclude_id: str | None = None):
    query = db.query(Address).filter(Address.user_id == user_id)
    if exclude_id:
        query = query.filter(Address.id != exclude_id)
    query.update({"is_default": False})


@router.post("", response_model=AddressOut, status_code=status.HTTP_201_CREATED)
def create_address(body: AddressIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if body.is_default:
        _unset_other_defaults(db, user.id)
    address = Address(user_id=user.id, **body.model_dump())
    db.add(address)
    db.commit()
    db.refresh(address)
    return address


@router.put("/{address_id}", response_model=AddressOut)
def update_address(address_id: str, body: AddressIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    address = db.query(Address).filter(Address.id == address_id, Address.user_id == user.id).first()
    if not address:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Address not found")
    if body.is_default:
        _unset_other_defaults(db, user.id, exclude_id=address_id)
    for key, value in body.model_dump().items():
        setattr(address, key, value)
    db.commit()
    db.refresh(address)
    return address


@router.delete("/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_address(address_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    address = db.query(Address).filter(Address.id == address_id, Address.user_id == user.id).first()
    if not address:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Address not found")
    db.delete(address)
    db.commit()
