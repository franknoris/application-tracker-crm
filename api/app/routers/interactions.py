from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db, utcnow
from ..deps import get_current_user
from ..models import Interaction, User
from ..schemas.interaction import InteractionCreate, InteractionRead, InteractionUpdate

router = APIRouter(prefix="/interactions", tags=["interactions"])


def _get_owned_interaction(db: Session, interaction_id: int, user_id: int) -> Interaction:
    interaction = db.scalar(select(Interaction).where(Interaction.id == interaction_id, Interaction.user_id == user_id))
    if interaction is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interaction not found")
    return interaction


@router.get("", response_model=list[InteractionRead])
def list_interactions(
    application_id: int | None = None,
    contact_id: int | None = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Interaction]:
    stmt = select(Interaction).where(Interaction.user_id == user.id)
    if application_id is not None:
        stmt = stmt.where(Interaction.application_id == application_id)
    if contact_id is not None:
        stmt = stmt.where(Interaction.contact_id == contact_id)
    stmt = stmt.order_by(Interaction.occurred_at.desc()).offset(skip).limit(limit)
    return list(db.scalars(stmt).all())


@router.post("", response_model=InteractionRead, status_code=status.HTTP_201_CREATED)
def create_interaction(
    payload: InteractionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Interaction:
    data = payload.model_dump()
    if data.get("occurred_at") is None:
        data["occurred_at"] = utcnow()
    interaction = Interaction(user_id=user.id, **data)
    db.add(interaction)
    db.commit()
    db.refresh(interaction)
    return interaction


@router.get("/{interaction_id}", response_model=InteractionRead)
def get_interaction(
    interaction_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Interaction:
    return _get_owned_interaction(db, interaction_id, user.id)


@router.patch("/{interaction_id}", response_model=InteractionRead)
def update_interaction(
    interaction_id: int,
    payload: InteractionUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Interaction:
    interaction = _get_owned_interaction(db, interaction_id, user.id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(interaction, field, value)
    db.commit()
    db.refresh(interaction)
    return interaction


@router.delete("/{interaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_interaction(
    interaction_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    interaction = _get_owned_interaction(db, interaction_id, user.id)
    db.delete(interaction)
    db.commit()
