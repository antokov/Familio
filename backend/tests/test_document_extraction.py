import json

import pytest
from httpx import AsyncClient

from app.config import settings
from app.routers import documents as documents_router
from app.schemas.document import ExtractedEvent
from app.services import document_extraction
from app.services.document_extraction import DocumentExtractionError, extract_events


@pytest.fixture(autouse=True)
def _use_tmp_upload_dir(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path))


async def upload_file(
    client: AsyncClient,
    filename: str = "test.pdf",
    content: bytes = b"%PDF-1.4 test",
    content_type: str = "application/pdf",
) -> dict:
    resp = await client.post("/api/documents", files={"file": (filename, content, content_type)})
    assert resp.status_code == 201
    return resp.json()


class TestExtractEventsEndpoint:
    async def test_returns_extracted_events(self, client: AsyncClient, monkeypatch):
        doc = await upload_file(client)

        async def fake_extract_events(file_path, content_type):
            return [
                ExtractedEvent(
                    title="Elternabend",
                    start_dt="2026-03-15T00:00:00",
                    end_dt="2026-03-15T23:59:00",
                )
            ]

        monkeypatch.setattr(documents_router, "extract_events", fake_extract_events)

        resp = await client.post(f"/api/documents/{doc['id']}/extract-events")
        assert resp.status_code == 200
        body = resp.json()
        assert len(body["events"]) == 1
        assert body["events"][0]["title"] == "Elternabend"

    async def test_document_not_found_returns_404(self, client: AsyncClient):
        resp = await client.post("/api/documents/does-not-exist/extract-events")
        assert resp.status_code == 404

    async def test_service_error_is_mapped_to_http_response(self, client: AsyncClient, monkeypatch):
        doc = await upload_file(client)

        async def fake_extract_events(file_path, content_type):
            raise DocumentExtractionError(415, "Format nicht unterstützt")

        monkeypatch.setattr(documents_router, "extract_events", fake_extract_events)

        resp = await client.post(f"/api/documents/{doc['id']}/extract-events")
        assert resp.status_code == 415
        assert resp.json()["detail"] == "Format nicht unterstützt"

    async def test_missing_api_key_returns_503(self, client: AsyncClient, monkeypatch):
        monkeypatch.setattr(settings, "anthropic_api_key", None)
        doc = await upload_file(client)

        resp = await client.post(f"/api/documents/{doc['id']}/extract-events")
        assert resp.status_code == 503

    async def test_unsupported_content_type_returns_415(self, client: AsyncClient):
        doc = await upload_file(
            client,
            filename="plan.docx",
            content=b"docx-bytes",
            content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )

        resp = await client.post(f"/api/documents/{doc['id']}/extract-events")
        assert resp.status_code == 415


class TestCombine:
    def test_uses_given_times(self):
        start, end = document_extraction._combine("2026-03-15", "14:00", "15:30")
        assert start.isoformat() == "2026-03-15T14:00:00"
        assert end.isoformat() == "2026-03-15T15:30:00"

    def test_falls_back_to_all_day_when_time_missing(self):
        start, end = document_extraction._combine("2026-03-15", None, None)
        assert (start.hour, start.minute) == (0, 0)
        assert (end.hour, end.minute) == (23, 59)

    def test_falls_back_to_all_day_when_end_before_start(self):
        start, end = document_extraction._combine("2026-03-15", "15:00", "14:00")
        assert (start.hour, start.minute) == (0, 0)
        assert (end.hour, end.minute) == (23, 59)


def _fake_client_factory(payload: dict, stop_reason: str = "end_turn"):
    class _Block:
        type = "text"
        text = json.dumps(payload)

    class _Response:
        pass

    response = _Response()
    response.stop_reason = stop_reason
    response.content = [_Block()]

    class _Messages:
        async def create(self, **kwargs):
            return response

    class _FakeClient:
        def __init__(self, **kwargs):
            self.messages = _Messages()

    return _FakeClient


class TestExtractEventsService:
    async def test_parses_response_into_events(self, tmp_path, monkeypatch):
        monkeypatch.setattr(settings, "anthropic_api_key", "sk-test-dummy")
        payload = {
            "events": [
                {"title": "Sommerfest", "date": "2026-06-20", "start_time": "10:00", "end_time": "14:00"},
                {"title": "Ferienbeginn", "date": "2026-07-27", "start_time": None, "end_time": None},
            ]
        }
        monkeypatch.setattr(document_extraction.anthropic, "AsyncAnthropic", _fake_client_factory(payload))

        pdf_path = tmp_path / "plan.pdf"
        pdf_path.write_bytes(b"%PDF-1.4 test")

        events = await extract_events(pdf_path, "application/pdf")

        assert len(events) == 2
        assert events[0].title == "Sommerfest"
        assert events[0].start_dt.hour == 10
        assert events[1].title == "Ferienbeginn"
        assert events[1].start_dt.hour == 0
        assert events[1].end_dt.hour == 23

    async def test_no_events_found_returns_empty_list(self, tmp_path, monkeypatch):
        monkeypatch.setattr(settings, "anthropic_api_key", "sk-test-dummy")
        monkeypatch.setattr(
            document_extraction.anthropic, "AsyncAnthropic", _fake_client_factory({"events": []})
        )

        pdf_path = tmp_path / "plan.pdf"
        pdf_path.write_bytes(b"%PDF-1.4 test")

        events = await extract_events(pdf_path, "application/pdf")
        assert events == []

    async def test_refusal_raises_extraction_error(self, tmp_path, monkeypatch):
        monkeypatch.setattr(settings, "anthropic_api_key", "sk-test-dummy")
        monkeypatch.setattr(
            document_extraction.anthropic,
            "AsyncAnthropic",
            _fake_client_factory({"events": []}, stop_reason="refusal"),
        )

        pdf_path = tmp_path / "plan.pdf"
        pdf_path.write_bytes(b"%PDF-1.4 test")

        with pytest.raises(DocumentExtractionError) as exc_info:
            await extract_events(pdf_path, "application/pdf")
        assert exc_info.value.status_code == 502

    async def test_missing_api_key_raises_503(self, tmp_path, monkeypatch):
        monkeypatch.setattr(settings, "anthropic_api_key", None)
        pdf_path = tmp_path / "plan.pdf"
        pdf_path.write_bytes(b"%PDF-1.4 test")

        with pytest.raises(DocumentExtractionError) as exc_info:
            await extract_events(pdf_path, "application/pdf")
        assert exc_info.value.status_code == 503

    async def test_unsupported_content_type_raises_415(self, tmp_path, monkeypatch):
        monkeypatch.setattr(settings, "anthropic_api_key", "sk-test-dummy")
        docx_path = tmp_path / "plan.docx"
        docx_path.write_bytes(b"docx-bytes")

        with pytest.raises(DocumentExtractionError) as exc_info:
            await extract_events(
                docx_path,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        assert exc_info.value.status_code == 415
