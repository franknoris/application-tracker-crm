from __future__ import annotations

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ContactBase(BaseModel):
    organization_id: int | None = None
    name: str = Field(min_length=1, max_length=255)
    role: str | None = None
    email: EmailStr | None = None
    notes: str | None = None


class ContactCreate(ContactBase):
    pass


class ContactUpdate(BaseModel):
    organization_id: int | None = None
    name: str | None = Field(default=None, min_length=1, max_length=255)
    role: str | None = None
    email: EmailStr | None = None
    notes: str | None = None


class ContactRead(ContactBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
