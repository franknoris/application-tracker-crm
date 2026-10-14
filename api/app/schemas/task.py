from __future__ import annotations

from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class TaskBase(BaseModel):
    application_id: int | None = None
    title: str = Field(min_length=1, max_length=255)
    due_date: date | None = None
    done: bool = False


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    application_id: int | None = None
    title: str | None = Field(default=None, min_length=1, max_length=255)
    due_date: date | None = None
    done: bool | None = None


class TaskRead(TaskBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
