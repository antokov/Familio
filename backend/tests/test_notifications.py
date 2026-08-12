from datetime import datetime, timedelta, date
from unittest.mock import AsyncMock, patch

import httpx
import pytest
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.config import settings
from app.database import Base
from app.models.event import CalendarEvent
from app.services.notifications import send_tomorrow_events_notification

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture
async def session_factory():
    engine = create_async_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield factory
    await engine.dispose()


@pytest.fixture(autouse=True)
def _configure_ntfy(monkeypatch):
    monkeypatch.setattr(settings, "ntfy_url", "http://ntfy.local")
    monkeypatch.setattr(settings, "ntfy_topic", "familio-events")


async def _add_event(session_factory, **overrides):
    tomorrow = date.today() + timedelta(days=1)
    defaults = {
        "title": "Elternabend",
        "start_dt": datetime(tomorrow.year, tomorrow.month, tomorrow.day, 18, 0),
        "end_dt": datetime(tomorrow.year, tomorrow.month, tomorrow.day, 19, 0),
        "attendees": [],
        "all_day": False,
    }
    defaults.update(overrides)
    async with session_factory() as session:
        session.add(CalendarEvent(**defaults))
        await session.commit()


class TestSendTomorrowEventsNotification:
    async def test_no_events_skips_send(self, session_factory):
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            await send_tomorrow_events_notification(session_factory=session_factory)
        mock_post.assert_not_called()

    async def test_events_tomorrow_publishes_to_ntfy(self, session_factory):
        await _add_event(session_factory)
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value.raise_for_status = lambda: None
            await send_tomorrow_events_notification(session_factory=session_factory)

        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        assert args[0] == "http://ntfy.local/familio-events"
        assert b"Elternabend - 18:00" in kwargs["content"]
        assert kwargs["headers"]["Click"] == "familio://calendar"

    async def test_all_day_event_shown_as_ganztaegig(self, session_factory):
        tomorrow = date.today() + timedelta(days=1)
        await _add_event(
            session_factory,
            title="Ferien",
            start_dt=datetime(tomorrow.year, tomorrow.month, tomorrow.day, 0, 0),
            end_dt=datetime(tomorrow.year, tomorrow.month, tomorrow.day, 23, 59),
            all_day=True,
        )
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value.raise_for_status = lambda: None
            await send_tomorrow_events_notification(session_factory=session_factory)

        _, kwargs = mock_post.call_args
        assert b"Ferien - Ganzt\xc3\xa4gig" in kwargs["content"]

    async def test_multi_day_all_day_event_spanning_tomorrow_is_included(self, session_factory):
        today = date.today()
        tomorrow = today + timedelta(days=1)
        day_after = today + timedelta(days=2)
        await _add_event(
            session_factory,
            title="Ferien",
            start_dt=datetime(today.year, today.month, today.day, 0, 0),
            end_dt=datetime(day_after.year, day_after.month, day_after.day, 23, 59),
            all_day=True,
        )
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value.raise_for_status = lambda: None
            await send_tomorrow_events_notification(session_factory=session_factory)

        mock_post.assert_called_once()

    async def test_event_outside_tomorrow_is_excluded(self, session_factory):
        today = date.today()
        await _add_event(
            session_factory,
            start_dt=datetime(today.year, today.month, today.day, 18, 0),
            end_dt=datetime(today.year, today.month, today.day, 19, 0),
        )
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            await send_tomorrow_events_notification(session_factory=session_factory)
        mock_post.assert_not_called()

    async def test_ntfy_not_configured_skips_send(self, session_factory, monkeypatch):
        monkeypatch.setattr(settings, "ntfy_url", None)
        await _add_event(session_factory)
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            await send_tomorrow_events_notification(session_factory=session_factory)
        mock_post.assert_not_called()

    async def test_ntfy_send_failure_does_not_raise(self, session_factory):
        await _add_event(session_factory)
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.side_effect = httpx.ConnectError("boom")
            await send_tomorrow_events_notification(session_factory=session_factory)

    async def test_event_starting_exactly_day_after_tomorrow_is_excluded(self, session_factory):
        day_after = date.today() + timedelta(days=2)
        await _add_event(
            session_factory,
            start_dt=datetime(day_after.year, day_after.month, day_after.day, 0, 0),
            end_dt=datetime(day_after.year, day_after.month, day_after.day, 1, 0),
        )
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            await send_tomorrow_events_notification(session_factory=session_factory)
        mock_post.assert_not_called()

    async def test_multiple_events_tomorrow_are_all_listed(self, session_factory):
        await _add_event(session_factory, title="Elternabend")
        await _add_event(session_factory, title="Zahnarzt")
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value.raise_for_status = lambda: None
            await send_tomorrow_events_notification(session_factory=session_factory)

        _, kwargs = mock_post.call_args
        assert b"Elternabend" in kwargs["content"]
        assert b"Zahnarzt" in kwargs["content"]

    async def test_custom_ntfy_topic_is_used_in_url(self, session_factory, monkeypatch):
        monkeypatch.setattr(settings, "ntfy_topic", "our-family-topic")
        await _add_event(session_factory)
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value.raise_for_status = lambda: None
            await send_tomorrow_events_notification(session_factory=session_factory)

        args, _ = mock_post.call_args
        assert args[0] == "http://ntfy.local/our-family-topic"


def test_ntfy_settings_default_to_disabled_url_and_shared_topic_name():
    # ASSUMPTION check: fresh Settings() (no env vars) must default to "not
    # configured" (ntfy_url=None) so the feature is inert until deployed.
    from app.config import Settings

    fresh = Settings(_env_file=None)
    assert fresh.ntfy_url is None
    assert fresh.ntfy_topic == "familio-events"
