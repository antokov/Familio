import logging
from datetime import date, datetime, timedelta

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.config import settings
from app.database import async_session_factory
from app.models.event import CalendarEvent

logger = logging.getLogger(__name__)

# ASSUMPTION: "server-local" per arch-decision.md — no per-user/family timezone
# concept exists, so `date.today()` (server wall-clock) is the reference point,
# matching how the rest of the calendar already treats naive datetimes.


async def send_tomorrow_events_notification(
    session_factory: async_sessionmaker = async_session_factory,
) -> None:
    """Publishes a push notification (via ntfy) listing tomorrow's calendar
    events, if any. No-ops (logs only) if ntfy is not configured or there are
    no events tomorrow - never raises, so a scheduler misconfiguration or a
    transient network error can't take down future scheduled runs."""
    if not settings.ntfy_url:
        logger.info("Notifications: ntfy_url not configured, skipping daily send.")
        return

    tomorrow = date.today() + timedelta(days=1)
    range_start = datetime(tomorrow.year, tomorrow.month, tomorrow.day)
    range_end = range_start + timedelta(days=1)

    async with session_factory() as session:
        stmt = (
            select(CalendarEvent)
            .where(CalendarEvent.end_dt >= range_start)
            .where(CalendarEvent.start_dt < range_end)
            .order_by(CalendarEvent.start_dt)
        )
        result = await session.execute(stmt)
        events = list(result.scalars().all())

    if not events:
        logger.info("Notifications: no events tomorrow (%s), skipping send.", tomorrow)
        return

    lines = [
        f"{event.title} - Ganztägig" if event.all_day else f"{event.title} - {event.start_dt:%H:%M}"
        for event in events
    ]
    body = "\n".join(lines)
    title = f"Termine morgen ({tomorrow:%d.%m.%Y})"

    url = f"{settings.ntfy_url.rstrip('/')}/{settings.ntfy_topic}"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                content=body.encode("utf-8"),
                # ntfy accepts raw UTF-8 header values (deviating from strict
                # HTTP/1.1 ASCII headers) - German umlauts are within Latin-1
                # so httpx's default header encoding handles them fine too.
                headers={"Title": title, "Click": "familio://calendar"},
                timeout=10.0,
            )
            response.raise_for_status()
    except httpx.HTTPError as exc:
        logger.warning("Notifications: failed to publish to ntfy at %s: %s", url, exc)
