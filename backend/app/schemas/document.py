from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.schemas.event import AttendeeSchema


class DocumentUpdate(BaseModel):
    family_member_id: Optional[str] = None
    filename: Optional[str] = Field(None, min_length=1, max_length=255)

    @field_validator("filename")
    @classmethod
    def _strip_and_reject_blank_filename(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("filename must not be blank")
        return trimmed


class DocumentResponse(BaseModel):
    id: str
    filename: str
    content_type: str
    size_bytes: int
    family_member_id: Optional[str]
    uploaded_at: datetime

    model_config = {"from_attributes": True}


class ExtractedEvent(BaseModel):
    title: str
    start_dt: datetime
    end_dt: datetime
    all_day: bool = False
    attendees: list[AttendeeSchema] = Field(default_factory=list)


class ExtractEventsResponse(BaseModel):
    events: list[ExtractedEvent]
