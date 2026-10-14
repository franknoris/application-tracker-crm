from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db import Base, utcnow

if TYPE_CHECKING:
    from .application import Application
    from .contact import Contact
    from .interaction import Interaction
    from .organization import Organization
    from .task import Task


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    organizations: Mapped[list[Organization]] = relationship(back_populates="user", cascade="all, delete-orphan")
    contacts: Mapped[list[Contact]] = relationship(back_populates="user", cascade="all, delete-orphan")
    applications: Mapped[list[Application]] = relationship(back_populates="user", cascade="all, delete-orphan")
    interactions: Mapped[list[Interaction]] = relationship(back_populates="user", cascade="all, delete-orphan")
    tasks: Mapped[list[Task]] = relationship(back_populates="user", cascade="all, delete-orphan")
