import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.document import Document
from app.schemas.document import DocumentResponse, DocumentUpdate

router = APIRouter(prefix="/api/documents", tags=["documents"])

ALLOWED_EXTENSIONS = {
    ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
    ".txt", ".jpg", ".jpeg", ".png", ".heic", ".gif", ".zip",
}


@router.get("", response_model=list[DocumentResponse])
async def list_documents(db: AsyncSession = Depends(get_db)) -> list[Document]:
    result = await db.execute(select(Document).order_by(Document.uploaded_at.desc()))
    return list(result.scalars().all())


@router.post("", response_model=DocumentResponse, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    family_member_id: str | None = Form(None),
    db: AsyncSession = Depends(get_db),
) -> Document:
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    suffix = Path(file.filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    content = await file.read()
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {settings.max_upload_size_mb} MB",
        )

    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)

    stored_filename = f"{uuid.uuid4()}{suffix}"
    (upload_dir / stored_filename).write_bytes(content)

    document = Document(
        filename=file.filename,
        stored_filename=stored_filename,
        content_type=file.content_type or "application/octet-stream",
        size_bytes=len(content),
        family_member_id=family_member_id or None,
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)
    return document


@router.put("/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: str, data: DocumentUpdate, db: AsyncSession = Depends(get_db)
) -> Document:
    document = await db.get(Document, document_id)
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(document, field, value)
    await db.commit()
    await db.refresh(document)
    return document


async def _get_document_file(document_id: str, db: AsyncSession) -> tuple[Document, Path]:
    document = await db.get(Document, document_id)
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    file_path = Path(settings.upload_dir) / document.stored_filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")
    return document, file_path


@router.get("/{document_id}/download")
async def download_document(document_id: str, db: AsyncSession = Depends(get_db)) -> FileResponse:
    document, file_path = await _get_document_file(document_id, db)
    return FileResponse(
        path=file_path,
        media_type=document.content_type,
        filename=document.filename,
        content_disposition_type="attachment",
    )


@router.get("/{document_id}/view")
async def view_document(document_id: str, db: AsyncSession = Depends(get_db)) -> FileResponse:
    document, file_path = await _get_document_file(document_id, db)
    return FileResponse(
        path=file_path,
        media_type=document.content_type,
        filename=document.filename,
        content_disposition_type="inline",
    )


@router.delete("/{document_id}", status_code=204)
async def delete_document(document_id: str, db: AsyncSession = Depends(get_db)) -> None:
    document = await db.get(Document, document_id)
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    file_path = Path(settings.upload_dir) / document.stored_filename
    file_path.unlink(missing_ok=True)
    await db.delete(document)
    await db.commit()
