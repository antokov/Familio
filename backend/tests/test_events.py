from httpx import AsyncClient


SAMPLE_EVENT = {
    "title": "Familienessen",
    "start_dt": "2025-07-01T18:00:00Z",
    "end_dt": "2025-07-01T20:00:00Z",
    "attendees": [
        {"initials": "A", "color": "#5B6AF0"},
        {"initials": "M", "color": "#F0805B"},
    ],
}


async def create_sample_event(client: AsyncClient, **overrides) -> dict:
    payload = SAMPLE_EVENT | overrides
    resp = await client.post("/api/events", json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()


class TestListEvents:
    async def test_empty_list(self, client: AsyncClient):
        resp = await client.get("/api/events?from=2025-07-01&to=2025-07-31")
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_returns_events_in_range(self, client: AsyncClient):
        await create_sample_event(client)
        resp = await client.get("/api/events?from=2025-07-01&to=2025-07-31")
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    async def test_excludes_events_outside_range(self, client: AsyncClient):
        await create_sample_event(client)
        resp = await client.get("/api/events?from=2025-08-01&to=2025-08-31")
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_missing_from_param_returns_422(self, client: AsyncClient):
        resp = await client.get("/api/events?to=2025-07-31")
        assert resp.status_code == 422

    async def test_missing_to_param_returns_422(self, client: AsyncClient):
        resp = await client.get("/api/events?from=2025-07-01")
        assert resp.status_code == 422


class TestCreateEvent:
    async def test_create_minimal(self, client: AsyncClient):
        payload = {
            "title": "Meeting",
            "start_dt": "2025-07-01T09:00:00Z",
            "end_dt": "2025-07-01T10:00:00Z",
        }
        resp = await client.post("/api/events", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "Meeting"
        assert data["attendees"] == []
        assert "id" in data
        assert "created_at" in data

    async def test_create_with_attendees(self, client: AsyncClient):
        event = await create_sample_event(client)
        assert len(event["attendees"]) == 2
        assert event["attendees"][0]["initials"] == "A"

    async def test_create_empty_title_rejected(self, client: AsyncClient):
        payload = {**SAMPLE_EVENT, "title": ""}
        resp = await client.post("/api/events", json=payload)
        assert resp.status_code == 422

    async def test_create_end_before_start_rejected(self, client: AsyncClient):
        payload = {
            "title": "Invalid",
            "start_dt": "2025-07-01T10:00:00Z",
            "end_dt": "2025-07-01T09:00:00Z",
        }
        resp = await client.post("/api/events", json=payload)
        assert resp.status_code == 422

    async def test_create_end_equal_start_rejected(self, client: AsyncClient):
        payload = {
            "title": "Invalid",
            "start_dt": "2025-07-01T10:00:00Z",
            "end_dt": "2025-07-01T10:00:00Z",
        }
        resp = await client.post("/api/events", json=payload)
        assert resp.status_code == 422

    async def test_create_with_description(self, client: AsyncClient):
        payload = {**SAMPLE_EVENT, "description": "Bitte pünktlich sein"}
        resp = await client.post("/api/events", json=payload)
        assert resp.status_code == 201
        assert resp.json()["description"] == "Bitte pünktlich sein"

    async def test_invalid_attendee_color_rejected(self, client: AsyncClient):
        payload = {**SAMPLE_EVENT, "attendees": [{"initials": "A", "color": "blue"}]}
        resp = await client.post("/api/events", json=payload)
        assert resp.status_code == 422


class TestGetEvent:
    async def test_get_existing(self, client: AsyncClient):
        event = await create_sample_event(client)
        resp = await client.get(f"/api/events/{event['id']}")
        assert resp.status_code == 200
        assert resp.json()["id"] == event["id"]

    async def test_get_nonexistent_returns_404(self, client: AsyncClient):
        resp = await client.get("/api/events/nonexistent-id")
        assert resp.status_code == 404


class TestUpdateEvent:
    async def test_update_title(self, client: AsyncClient):
        event = await create_sample_event(client)
        resp = await client.put(f"/api/events/{event['id']}", json={"title": "Geänderter Titel"})
        assert resp.status_code == 200
        assert resp.json()["title"] == "Geänderter Titel"
        assert resp.json()["start_dt"] == event["start_dt"]

    async def test_update_attendees(self, client: AsyncClient):
        event = await create_sample_event(client)
        new_attendees = [{"initials": "L", "color": "#4CAF82"}]
        resp = await client.put(f"/api/events/{event['id']}", json={"attendees": new_attendees})
        assert resp.status_code == 200
        assert resp.json()["attendees"] == new_attendees

    async def test_update_end_before_start_rejected(self, client: AsyncClient):
        event = await create_sample_event(client)
        resp = await client.put(
            f"/api/events/{event['id']}",
            json={"end_dt": "2025-07-01T17:00:00Z"},
        )
        assert resp.status_code == 422

    async def test_update_nonexistent_returns_404(self, client: AsyncClient):
        resp = await client.put("/api/events/nonexistent-id", json={"title": "X"})
        assert resp.status_code == 404

    async def test_update_empty_title_rejected(self, client: AsyncClient):
        event = await create_sample_event(client)
        resp = await client.put(f"/api/events/{event['id']}", json={"title": ""})
        assert resp.status_code == 422


class TestDeleteEvent:
    async def test_delete_existing(self, client: AsyncClient):
        event = await create_sample_event(client)
        resp = await client.delete(f"/api/events/{event['id']}")
        assert resp.status_code == 204

        get_resp = await client.get(f"/api/events/{event['id']}")
        assert get_resp.status_code == 404

    async def test_delete_nonexistent_returns_404(self, client: AsyncClient):
        resp = await client.delete("/api/events/nonexistent-id")
        assert resp.status_code == 404
