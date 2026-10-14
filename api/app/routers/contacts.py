from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import Contact, Organization, User
from ..schemas.contact import ContactCreate, ContactRead, ContactUpdate

router = APIRouter(prefix="/contacts", tags=["contacts"])


def _validate_organization(db: Session, organization_id: int, user_id: int) -> None:
    org = db.scalar(select(Organization).where(Organization.id == organization_id, Organization.user_id == user_id))
    if org is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")


def _get_owned_contact(db: Session, contact_id: int, user_id: int) -> Contact:
    contact = db.scalar(select(Contact).where(Contact.id == contact_id, Contact.user_id == user_id))
    if contact is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
    return contact


@router.get("", response_model=list[ContactRead])
def list_contacts(
    search: str | None = None,
    organization_id: int | None = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Contact]:
    stmt = select(Contact).where(Contact.user_id == user.id)
    if search:
        stmt = stmt.where(Contact.name.ilike(f"%{search}%") | Contact.email.ilike(f"%{search}%"))
    if organization_id is not None:
        stmt = stmt.where(Contact.organization_id == organization_id)
    stmt = stmt.order_by(Contact.name).offset(skip).limit(limit)
    return list(db.scalars(stmt).all())


@router.post("", response_model=ContactRead, status_code=status.HTTP_201_CREATED)
def create_contact(
    payload: ContactCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Contact:
    data = payload.model_dump()
    if data.get("organization_id") is not None:
        _validate_organization(db, data["organization_id"], user.id)
    contact = Contact(user_id=user.id, **data)
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


@router.get("/{contact_id}", response_model=ContactRead)
def get_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Contact:
    return _get_owned_contact(db, contact_id, user.id)


@router.patch("/{contact_id}", response_model=ContactRead)
def update_contact(
    contact_id: int,
    payload: ContactUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Contact:
    contact = _get_owned_contact(db, contact_id, user.id)
    data = payload.model_dump(exclude_unset=True)
    if data.get("organization_id") is not None:
        _validate_organization(db, data["organization_id"], user.id)
    for field, value in data.items():
        setattr(contact, field, value)
    db.commit()
    db.refresh(contact)
    return contact


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    contact = _get_owned_contact(db, contact_id, user.id)
    db.delete(contact)
    db.commit()
