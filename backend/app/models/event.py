import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.database import Base


class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    start_dt: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_dt: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    attendees: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    all_day: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
