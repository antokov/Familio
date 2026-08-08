import base64
import json
from datetime import date as date_cls, datetime, time
from pathlib import Path

import anthropic

from app.config import settings
from app.schemas.document import ExtractedEvent

SUPPORTED_CONTENT_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
}

_EVENT_SCHEMA = {
    "type": "object",
    "properties": {
        "events": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "date": {"type": "string", "description": "ISO 8601, YYYY-MM-DD"},
                    "start_time": {
                        "anyOf": [{"type": "string"}, {"type": "null"}],
                        "description": "HH:MM (24h), null wenn keine Uhrzeit im Dokument steht",
                    },
                    "end_time": {
                        "anyOf": [{"type": "string"}, {"type": "null"}],
                        "description": "HH:MM (24h), null wenn keine Uhrzeit im Dokument steht",
                    },
                },
                "required": ["title", "date", "start_time", "end_time"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["events"],
    "additionalProperties": False,
}

_PROMPT = (
    "Du bekommst ein Dokument (z. B. einen Kita- oder Schul-Quartalsplan, Vereins- oder "
    "Familientermin-Plan). Extrahiere alle konkreten Termine (Veranstaltungen, Ferien, "
    "Elternabende, Ausflüge, Feste etc.) mit Datum. Ignoriere allgemeine Informationstexte "
    "ohne konkretes Datum. Wenn im Dokument keine Jahreszahl bei einem Termin steht, leite "
    "sie aus dem Kontext ab (z. B. Deckblatt, Zeitraum-Angabe wie 'Schuljahr 2025/26'). "
    "Wenn zu einem Termin keine Uhrzeit angegeben ist, lass start_time und end_time auf "
    "null statt eine Uhrzeit zu erfinden. Gib für jeden Termin einen kurzen, klaren Titel an."
)


class DocumentExtractionError(Exception):
    def __init__(self, status_code: int, detail: str) -> None:
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)


def _combine(date_str: str, start_time: str | None, end_time: str | None) -> tuple[datetime, datetime]:
    """Baut Start-/End-Datetime. Fehlt eine Uhrzeit (oder ist sie ungültig), wird der
    Termin ganztägig behandelt (00:00-23:59) statt eine Uhrzeit zu raten."""
    day = date_cls.fromisoformat(date_str)
    if start_time and end_time:
        try:
            start = datetime.combine(day, time.fromisoformat(start_time))
            end = datetime.combine(day, time.fromisoformat(end_time))
            if end > start:
                return start, end
        except ValueError:
            pass
    return datetime.combine(day, time(0, 0)), datetime.combine(day, time(23, 59))


async def extract_events(file_path: Path, content_type: str) -> list[ExtractedEvent]:
    if content_type not in SUPPORTED_CONTENT_TYPES:
        raise DocumentExtractionError(
            415, f"Termine-Extraktion wird für '{content_type}' nicht unterstützt (nur PDF/Bild)."
        )
    if not settings.anthropic_api_key:
        raise DocumentExtractionError(503, "Termine-Extraktion ist nicht konfiguriert (kein API-Key hinterlegt).")

    data = base64.standard_b64encode(file_path.read_bytes()).decode("utf-8")
    block_type = "document" if content_type == "application/pdf" else "image"

    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    try:
        response = await client.messages.create(
            model=settings.anthropic_model,
            max_tokens=16000,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": block_type,
                            "source": {"type": "base64", "media_type": content_type, "data": data},
                        },
                        {"type": "text", "text": _PROMPT},
                    ],
                }
            ],
            output_config={"format": {"type": "json_schema", "schema": _EVENT_SCHEMA}},
        )
    except anthropic.APIStatusError as exc:
        raise DocumentExtractionError(502, f"Claude API Fehler: {exc.message}") from exc
    except anthropic.APIConnectionError as exc:
        raise DocumentExtractionError(502, "Claude API ist nicht erreichbar.") from exc

    if response.stop_reason == "refusal":
        raise DocumentExtractionError(502, "Die Dokumentenanalyse wurde von der KI abgelehnt.")

    text = next((block.text for block in response.content if block.type == "text"), None)
    if text is None:
        raise DocumentExtractionError(502, "Unerwartete Antwort von der Claude API.")

    payload = json.loads(text)
    events: list[ExtractedEvent] = []
    for raw in payload.get("events", []):
        start_dt, end_dt = _combine(raw["date"], raw.get("start_time"), raw.get("end_time"))
        events.append(ExtractedEvent(title=raw["title"], start_dt=start_dt, end_dt=end_dt))
    return events
