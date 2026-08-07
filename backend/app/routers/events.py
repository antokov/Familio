from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.event import CalendarEvent
from app.schemas.event import EventCreate, EventResponse, EventUpdate

router = APIRouter(prefix="/api/events", tags=["events"])


@router.get("", response_model=list[EventResponse])
async def list_events(
    from_date: date = Query(alias="from"),
    to_date: date = Query(alias="to"),
    db: AsyncSession = Depends(get_db),
) -> list[CalendarEvent]:
    from_dt = datetime(from_date.year, from_date.month, from_date.day, tzinfo=timezone.utc)
    to_dt = datetime(to_date.year, to_date.month, to_date.day, tzinfo=timezone.utc) + timedelta(days=1)

    stmt = (
        select(CalendarEvent)
        .where(CalendarEvent.start_dt >= from_dt)
        .where(CalendarEvent.start_dt < to_dt)
        .order_by(CalendarEvent.start_dt)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.post("", response_model=EventResponse, status_code=201)
async def create_event(data: EventCreate, db: AsyncSession = Depends(get_db)) -> CalendarEvent:
    payload = data.model_dump()
    payload["attendees"] = [a.model_dump() for a in data.attendees]
    event = CalendarEvent(**payload)
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(event_id: str, db: AsyncSession = Depends(get_db)) -> CalendarEvent:
    event = await db.get(CalendarEvent, event_id)
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: str, data: EventUpdate, db: AsyncSession = Depends(get_db)
) -> CalendarEvent:
    event = await db.get(CalendarEvent, event_id)
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    updates = data.model_dump(exclude_unset=True)
    if "attendees" in updates:
        updates["attendees"] = [a.model_dump() for a in data.attendees]  # type: ignore[union-attr]
    # Validate end > start after applying updates
    # Strip timezone for comparison: SQLite stores naive datetimes
    def _naive(dt: datetime) -> datetime:
        return dt.replace(tzinfo=None) if dt.tzinfo else dt

    new_start = _naive(updates.get("start_dt", event.start_dt))
    new_end = _naive(updates.get("end_dt", event.end_dt))
    if new_end <= new_start:
        raise HTTPException(status_code=422, detail="end_dt must be after start_dt")
    for field, value in updates.items():
        setattr(event, field, value)
    await db.commit()
    await db.refresh(event)
    return event


@router.delete("/{event_id}", status_code=204)
async def delete_event(event_id: str, db: AsyncSession = Depends(get_db)) -> None:
    event = await db.get(CalendarEvent, event_id)
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    await db.delete(event)
    await db.commit()
