from __future__ import annotations

import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db import Base, utcnow

if TYPE_CHECKING:
    from .interaction import Interaction
    from .organization import Organization
    from .task import Task
    from .user import User


class Stage(str, enum.Enum):
    RESEARCHING = "researching"
    CONTACTED = "contacted"
    APPLYING = "applying"
    SUBMITTED = "submitted"
    INTERVIEW = "interview"
    OFFER = "offer"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class Application(Base):
    __tablename__ = "applications"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"), index=True)
    program_name: Mapped[str] = mapped_column(String(255))
    stage: Mapped[Stage] = mapped_column(
        Enum(Stage, native_enum=False, length=20), default=Stage.RESEARCHING, index=True
    )
    deadline: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    deadline_timezone: Mapped[str | None] = mapped_column(String(64))
    priority: Mapped[str | None] = mapped_column(String(20))
    funding_notes: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)

    user: Mapped[User] = relationship(back_populates="applications")
    organization: Mapped[Organization] = relationship(back_populates="applications")
    interactions: Mapped[list[Interaction]] = relationship(back_populates="application")
    tasks: Mapped[list[Task]] = relationship(back_populates="application")
