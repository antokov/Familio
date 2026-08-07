from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, model_validator


class AttendeeSchema(BaseModel):
    initials: str = Field(..., max_length=2)
    color: str = Field(..., pattern=r"^#[0-9A-Fa-f]{6}$")


class EventCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    start_dt: datetime
    end_dt: datetime
    attendees: list[AttendeeSchema] = Field(default_factory=list)

    @model_validator(mode="after")
    def end_after_start(self) -> "EventCreate":
        if self.end_dt <= self.start_dt:
            raise ValueError("end_dt must be after start_dt")
        return self


class EventUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    start_dt: Optional[datetime] = None
    end_dt: Optional[datetime] = None
    attendees: Optional[list[AttendeeSchema]] = None


class EventResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    start_dt: datetime
    end_dt: datetime
    attendees: list[AttendeeSchema]
    created_at: datetime

    model_config = {"from_attributes": True}
