from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from ..models import Stage


class ApplicationBase(BaseModel):
    organization_id: int
    program_name: str = Field(min_length=1, max_length=255)
    stage: Stage = Stage.RESEARCHING
    deadline: datetime | None = None
    deadline_timezone: str | None = None
    priority: str | None = None
    funding_notes: str | None = None
    notes: str | None = None


class ApplicationCreate(ApplicationBase):
    pass


class ApplicationUpdate(BaseModel):
    organization_id: int | None = None
    program_name: str | None = Field(default=None, min_length=1, max_length=255)
    stage: Stage | None = None
    deadline: datetime | None = None
    deadline_timezone: str | None = None
    priority: str | None = None
    funding_notes: str | None = None
    notes: str | None = None


class ApplicationRead(ApplicationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
