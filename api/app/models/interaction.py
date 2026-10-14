from __future__ import annotations

import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db import Base

if TYPE_CHECKING:
    from .application import Application
    from .contact import Contact
    from .user import User


class Channel(str, enum.Enum):
    EMAIL = "email"
    PORTAL = "portal"
    WHATSAPP = "whatsapp"
    CALL = "call"
    MEETING = "meeting"
    OTHER = "other"


class Interaction(Base):
    __tablename__ = "interactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    application_id: Mapped[int | None] = mapped_column(
        ForeignKey("applications.id", ondelete="CASCADE"), index=True
    )
    contact_id: Mapped[int | None] = mapped_column(ForeignKey("contacts.id", ondelete="SET NULL"), index=True)
    channel: Mapped[Channel] = mapped_column(Enum(Channel, native_enum=False, length=20))
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    summary: Mapped[str] = mapped_column(Text)

    user: Mapped[User] = relationship(back_populates="interactions")
    application: Mapped[Application | None] = relationship(back_populates="interactions")
    contact: Mapped[Contact | None] = relationship(back_populates="interactions")
