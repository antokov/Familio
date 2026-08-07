from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class FamilyMemberCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    initials: str = Field(..., min_length=1, max_length=2)
    color: str = Field(..., pattern=r"^#[0-9A-Fa-f]{6}$")


class FamilyMemberUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    initials: Optional[str] = Field(None, min_length=1, max_length=2)
    color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")


class FamilyMemberResponse(BaseModel):
    id: str
    name: str
    initials: str
    color: str
    online: bool
    created_at: datetime

    model_config = {"from_attributes": True}
