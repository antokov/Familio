from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator, model_validator


def _drop_tzinfo(value: Optional[datetime]) -> Optional[datetime]:
    """Termine werden im ganzen System als naive "Wanduhrzeit" behandelt (kein
    DB-Repository-Layer mit echter TZ-Konvertierung; die WebApp schickt z.B.
    "2026-08-10T17:00:00" ohne Offset und meint damit lokale Zeit). SQLite speichert
    das unverändert naiv, aber PostgreSQL (Prod) taggt `timestamptz`-Spalten beim
    Lesen mit der Session-Zeitzone — dadurch interpretiert das Frontend den Wert
    beim erneuten Parsen als UTC und rechnet ihn in Lokalzeit um, was den Termin um
    den UTC-Offset (1-2h) verschiebt. Fix: tzinfo wird an beiden Schema-Grenzen
    (Input und Output) konsequent entfernt, damit die Uhrzeit-Ziffern unverändert
    durchgereicht werden, unabhängig vom DB-Backend."""
    return value.replace(tzinfo=None) if value is not None and value.tzinfo is not None else value


class AttendeeSchema(BaseModel):
    initials: str = Field(..., max_length=2)
    color: str = Field(..., pattern=r"^#[0-9A-Fa-f]{6}$")


class EventCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    start_dt: datetime
    end_dt: datetime
    attendees: list[AttendeeSchema] = Field(default_factory=list)
    all_day: bool = False

    _strip_tz = field_validator("start_dt", "end_dt")(_drop_tzinfo)

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
    all_day: Optional[bool] = None

    _strip_tz = field_validator("start_dt", "end_dt")(_drop_tzinfo)


class EventResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    start_dt: datetime
    end_dt: datetime
    attendees: list[AttendeeSchema]
    all_day: bool
    created_at: datetime

    model_config = {"from_attributes": True}

    _strip_tz = field_validator("start_dt", "end_dt")(_drop_tzinfo)
