import pytest
from httpx import AsyncClient

from app.config import settings


@pytest.fixture(autouse=True)
def _use_tmp_upload_dir(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path))


async def create_member(client: AsyncClient, **overrides) -> dict:
    payload = {"name": "Anton", "initials": "A", "color": "#5B6AF0"} | overrides
    resp = await client.post("/api/family-members", json=payload)
    assert resp.status_code == 201
    return resp.json()


async def upload_file(client: AsyncClient, filename="test.pdf", content=b"%PDF-1.4 test", **form) -> dict:
    resp = await client.post(
        "/api/documents",
        files={"file": (filename, content, "application/pdf")},
        data=form,
    )
    return resp


class TestUploadDocument:
    async def test_upload_minimal(self, client: AsyncClient):
        resp = await upload_file(client)
        assert resp.status_code == 201
        data = resp.json()
        assert data["filename"] == "test.pdf"
        assert data["size_bytes"] == len(b"%PDF-1.4 test")
        assert data["family_member_id"] is None
        assert "id" in data
        assert "uploaded_at" in data

    async def test_upload_with_family_member(self, client: AsyncClient):
        member = await create_member(client)
        resp = await upload_file(client, family_member_id=member["id"])
        assert resp.status_code == 201
        assert resp.json()["family_member_id"] == member["id"]

    async def test_upload_rejects_disallowed_extension(self, client: AsyncClient):
        resp = await upload_file(client, filename="virus.exe", content=b"MZ")
        assert resp.status_code == 400

    async def test_upload_rejects_oversized_file(self, client: AsyncClient, monkeypatch):
        monkeypatch.setattr(settings, "max_upload_size_mb", 0)
        resp = await upload_file(client, content=b"12345")
        assert resp.status_code == 400

    async def test_stored_file_written_to_disk(self, client: AsyncClient, tmp_path):
        resp = await upload_file(client)
        assert resp.status_code == 201
        stored_files = list(tmp_path.iterdir())
        assert len(stored_files) == 1
        assert stored_files[0].read_bytes() == b"%PDF-1.4 test"


class TestListDocuments:
    async def test_empty_list(self, client: AsyncClient):
        resp = await client.get("/api/documents")
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_returns_all_uploaded_documents(self, client: AsyncClient):
        # Not asserting exact order here: SQLite's func.now() has 1-second
        # resolution, so uploads within the same test tie on uploaded_at —
        # same pre-existing limitation as tasks/family-members ordering.
        await upload_file(client, filename="a.pdf")
        await upload_file(client, filename="b.pdf")
        resp = await client.get("/api/documents")
        assert resp.status_code == 200
        filenames = {d["filename"] for d in resp.json()}
        assert filenames == {"a.pdf", "b.pdf"}


class TestUpdateDocument:
    async def test_reassign_to_member(self, client: AsyncClient):
        member = await create_member(client)
        upload_resp = await upload_file(client)
        doc_id = upload_resp.json()["id"]
        resp = await client.put(f"/api/documents/{doc_id}", json={"family_member_id": member["id"]})
        assert resp.status_code == 200
        assert resp.json()["family_member_id"] == member["id"]

    async def test_unassign(self, client: AsyncClient):
        member = await create_member(client)
        upload_resp = await upload_file(client, family_member_id=member["id"])
        doc_id = upload_resp.json()["id"]
        resp = await client.put(f"/api/documents/{doc_id}", json={"family_member_id": None})
        assert resp.status_code == 200
        assert resp.json()["family_member_id"] is None

    async def test_update_nonexistent_returns_404(self, client: AsyncClient):
        resp = await client.put("/api/documents/nonexistent-id", json={"family_member_id": None})
        assert resp.status_code == 404

    async def test_rename(self, client: AsyncClient):
        upload_resp = await upload_file(client)
        doc_id = upload_resp.json()["id"]
        resp = await client.put(f"/api/documents/{doc_id}", json={"filename": "Steuerbescheid 2026.pdf"})
        assert resp.status_code == 200
        assert resp.json()["filename"] == "Steuerbescheid 2026.pdf"

    async def test_rename_trims_whitespace(self, client: AsyncClient):
        upload_resp = await upload_file(client)
        doc_id = upload_resp.json()["id"]
        resp = await client.put(f"/api/documents/{doc_id}", json={"filename": "  Notiz.pdf  "})
        assert resp.status_code == 200
        assert resp.json()["filename"] == "Notiz.pdf"

    async def test_rename_empty_rejected(self, client: AsyncClient):
        upload_resp = await upload_file(client)
        doc_id = upload_resp.json()["id"]
        resp = await client.put(f"/api/documents/{doc_id}", json={"filename": ""})
        assert resp.status_code == 422

    async def test_rename_whitespace_only_rejected(self, client: AsyncClient):
        upload_resp = await upload_file(client)
        doc_id = upload_resp.json()["id"]
        resp = await client.put(f"/api/documents/{doc_id}", json={"filename": "   "})
        assert resp.status_code == 422

    async def test_rename_over_max_length_rejected(self, client: AsyncClient):
        upload_resp = await upload_file(client)
        doc_id = upload_resp.json()["id"]
        resp = await client.put(f"/api/documents/{doc_id}", json={"filename": "a" * 256})
        assert resp.status_code == 422

    async def test_rename_does_not_change_stored_filename_or_content(self, client: AsyncClient):
        upload_resp = await upload_file(client, content=b"original bytes")
        doc_id = upload_resp.json()["id"]
        before = upload_resp.json()
        resp = await client.put(f"/api/documents/{doc_id}", json={"filename": "renamed.pdf"})
        assert resp.status_code == 200
        assert resp.json()["content_type"] == before["content_type"]
        assert resp.json()["size_bytes"] == before["size_bytes"]
        download = await client.get(f"/api/documents/{doc_id}/download")
        assert download.content == b"original bytes"


class TestDownloadDocument:
    async def test_download_returns_original_content(self, client: AsyncClient):
        upload_resp = await upload_file(client, content=b"hello world")
        doc_id = upload_resp.json()["id"]
        resp = await client.get(f"/api/documents/{doc_id}/download")
        assert resp.status_code == 200
        assert resp.content == b"hello world"

    async def test_download_nonexistent_returns_404(self, client: AsyncClient):
        resp = await client.get("/api/documents/nonexistent-id/download")
        assert resp.status_code == 404

    async def test_download_missing_file_on_disk_returns_404(self, client: AsyncClient, tmp_path):
        upload_resp = await upload_file(client)
        doc_id = upload_resp.json()["id"]
        for f in tmp_path.iterdir():
            f.unlink()
        resp = await client.get(f"/api/documents/{doc_id}/download")
        assert resp.status_code == 404

    async def test_download_sets_attachment_disposition(self, client: AsyncClient):
        upload_resp = await upload_file(client)
        doc_id = upload_resp.json()["id"]
        resp = await client.get(f"/api/documents/{doc_id}/download")
        assert "attachment" in resp.headers["content-disposition"]


class TestViewDocument:
    async def test_view_returns_original_content(self, client: AsyncClient):
        upload_resp = await upload_file(client, content=b"hello world")
        doc_id = upload_resp.json()["id"]
        resp = await client.get(f"/api/documents/{doc_id}/view")
        assert resp.status_code == 200
        assert resp.content == b"hello world"

    async def test_view_sets_inline_disposition(self, client: AsyncClient):
        upload_resp = await upload_file(client)
        doc_id = upload_resp.json()["id"]
        resp = await client.get(f"/api/documents/{doc_id}/view")
        assert "inline" in resp.headers["content-disposition"]

    async def test_view_nonexistent_returns_404(self, client: AsyncClient):
        resp = await client.get("/api/documents/nonexistent-id/view")
        assert resp.status_code == 404


class TestDeleteDocument:
    async def test_delete_removes_db_entry_and_file(self, client: AsyncClient, tmp_path):
        upload_resp = await upload_file(client)
        doc_id = upload_resp.json()["id"]
        resp = await client.delete(f"/api/documents/{doc_id}")
        assert resp.status_code == 204

        list_resp = await client.get("/api/documents")
        assert list_resp.json() == []
        assert list(tmp_path.iterdir()) == []

    async def test_delete_nonexistent_returns_404(self, client: AsyncClient):
        resp = await client.delete("/api/documents/nonexistent-id")
        assert resp.status_code == 404


class TestFamilyMemberDeletionUnassignsDocuments:
    async def test_deleting_member_unassigns_their_documents(self, client: AsyncClient):
        member = await create_member(client)
        upload_resp = await upload_file(client, family_member_id=member["id"])
        doc_id = upload_resp.json()["id"]

        del_resp = await client.delete(f"/api/family-members/{member['id']}")
        assert del_resp.status_code == 204

        list_resp = await client.get("/api/documents")
        doc = next(d for d in list_resp.json() if d["id"] == doc_id)
        assert doc["family_member_id"] is None
