from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from ..models import Channel


class InteractionBase(BaseModel):
    application_id: int | None = None
    contact_id: int | None = None
    channel: Channel
    summary: str = Field(min_length=1)
    occurred_at: datetime | None = None


class InteractionCreate(InteractionBase):
    pass


class InteractionUpdate(BaseModel):
    application_id: int | None = None
    contact_id: int | None = None
    channel: Channel | None = None
    summary: str | None = Field(default=None, min_length=1)
    occurred_at: datetime | None = None


class InteractionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    application_id: int | None
    contact_id: int | None
    channel: Channel
    summary: str
    occurred_at: datetime
