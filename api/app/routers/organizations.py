from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import Organization, User
from ..schemas.organization import OrganizationCreate, OrganizationRead, OrganizationUpdate

router = APIRouter(prefix="/organizations", tags=["organizations"])


def _get_owned_org(db: Session, org_id: int, user_id: int) -> Organization:
    org = db.scalar(select(Organization).where(Organization.id == org_id, Organization.user_id == user_id))
    if org is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    return org


@router.get("", response_model=list[OrganizationRead])
def list_organizations(
    search: str | None = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Organization]:
    stmt = select(Organization).where(Organization.user_id == user.id)
    if search:
        stmt = stmt.where(Organization.name.ilike(f"%{search}%"))
    stmt = stmt.order_by(Organization.name).offset(skip).limit(limit)
    return list(db.scalars(stmt).all())


@router.post("", response_model=OrganizationRead, status_code=status.HTTP_201_CREATED)
def create_organization(
    payload: OrganizationCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Organization:
    org = Organization(user_id=user.id, **payload.model_dump())
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


@router.get("/{organization_id}", response_model=OrganizationRead)
def get_organization(
    organization_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Organization:
    return _get_owned_org(db, organization_id, user.id)


@router.patch("/{organization_id}", response_model=OrganizationRead)
def update_organization(
    organization_id: int,
    payload: OrganizationUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Organization:
    org = _get_owned_org(db, organization_id, user.id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(org, field, value)
    db.commit()
    db.refresh(org)
    return org


@router.delete("/{organization_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_organization(
    organization_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    org = _get_owned_org(db, organization_id, user.id)
    db.delete(org)
    db.commit()
