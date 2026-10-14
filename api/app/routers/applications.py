from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import Application, Organization, Stage, User
from ..schemas.application import ApplicationCreate, ApplicationRead, ApplicationUpdate
from ..services.applications import is_valid_transition

router = APIRouter(prefix="/applications", tags=["applications"])


def _validate_organization(db: Session, organization_id: int, user_id: int) -> None:
    org = db.scalar(select(Organization).where(Organization.id == organization_id, Organization.user_id == user_id))
    if org is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")


def _get_owned_application(db: Session, application_id: int, user_id: int) -> Application:
    app = db.scalar(select(Application).where(Application.id == application_id, Application.user_id == user_id))
    if app is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return app


@router.get("", response_model=list[ApplicationRead])
def list_applications(
    stage: Stage | None = None,
    organization_id: int | None = None,
    deadline_before: datetime | None = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Application]:
    stmt = select(Application).where(Application.user_id == user.id)
    if stage is not None:
        stmt = stmt.where(Application.stage == stage)
    if organization_id is not None:
        stmt = stmt.where(Application.organization_id == organization_id)
    if deadline_before is not None:
        stmt = stmt.where(Application.deadline <= deadline_before)
    stmt = stmt.order_by(Application.deadline).offset(skip).limit(limit)
    return list(db.scalars(stmt).all())


@router.get("/upcoming", response_model=list[ApplicationRead])
def upcoming_applications(
    days: int = 7,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Application]:
    now = datetime.now(timezone.utc)
    horizon = now + timedelta(days=days)
    stmt = (
        select(Application)
        .where(Application.user_id == user.id)
        .where(Application.deadline.isnot(None))
        .where(Application.deadline >= now)
        .where(Application.deadline <= horizon)
        .order_by(Application.deadline)
    )
    return list(db.scalars(stmt).all())


@router.post("", response_model=ApplicationRead, status_code=status.HTTP_201_CREATED)
def create_application(
    payload: ApplicationCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Application:
    _validate_organization(db, payload.organization_id, user.id)
    app = Application(user_id=user.id, **payload.model_dump())
    db.add(app)
    db.commit()
    db.refresh(app)
    return app


@router.get("/{application_id}", response_model=ApplicationRead)
def get_application(
    application_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Application:
    return _get_owned_application(db, application_id, user.id)


@router.patch("/{application_id}", response_model=ApplicationRead)
def update_application(
    application_id: int,
    payload: ApplicationUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Application:
    app = _get_owned_application(db, application_id, user.id)
    data = payload.model_dump(exclude_unset=True)

    if data.get("organization_id") is not None:
        _validate_organization(db, data["organization_id"], user.id)

    if data.get("stage") is not None and data["stage"] != app.stage:
        if not is_valid_transition(app.stage, data["stage"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot move from {app.stage.value} to {data['stage'].value}",
            )

    for field, value in data.items():
        setattr(app, field, value)
    db.commit()
    db.refresh(app)
    return app


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    application_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    app = _get_owned_application(db, application_id, user.id)
    db.delete(app)
    db.commit()
