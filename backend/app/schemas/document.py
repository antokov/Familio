from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class DocumentUpdate(BaseModel):
    family_member_id: Optional[str] = None


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


class ExtractEventsResponse(BaseModel):
    events: list[ExtractedEvent]
