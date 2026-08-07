from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field

RecurrenceType = Literal["none", "daily", "weekly", "monthly", "yearly"]


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    due_date: Optional[date] = None
    assignee_initials: Optional[str] = Field(None, max_length=2)
    assignee_color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")
    recurrence: RecurrenceType = "none"
    completed: bool = False


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    due_date: Optional[date] = None
    assignee_initials: Optional[str] = Field(None, max_length=2)
    assignee_color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")
    recurrence: Optional[RecurrenceType] = None
    completed: Optional[bool] = None


class TaskResponse(BaseModel):
    id: str
    title: str
    due_date: Optional[date]
    assignee_initials: Optional[str]
    assignee_color: Optional[str]
    recurrence: str
    completed: bool
    completed_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}
