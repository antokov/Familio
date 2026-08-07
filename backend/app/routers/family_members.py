from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.family_member import FamilyMember
from app.schemas.family_member import FamilyMemberCreate, FamilyMemberResponse, FamilyMemberUpdate

router = APIRouter(prefix="/api/family-members", tags=["family-members"])


@router.get("", response_model=list[FamilyMemberResponse])
async def list_family_members(db: AsyncSession = Depends(get_db)) -> list[FamilyMember]:
    result = await db.execute(select(FamilyMember).order_by(FamilyMember.created_at))
    return list(result.scalars().all())


@router.post("", response_model=FamilyMemberResponse, status_code=201)
async def create_family_member(
    data: FamilyMemberCreate, db: AsyncSession = Depends(get_db)
) -> FamilyMember:
    member = FamilyMember(
        name=data.name.strip(),
        initials=data.initials.upper(),
        color=data.color,
    )
    db.add(member)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Initials already in use")
    await db.refresh(member)
    return member


@router.put("/{member_id}", response_model=FamilyMemberResponse)
async def update_family_member(
    member_id: str, data: FamilyMemberUpdate, db: AsyncSession = Depends(get_db)
) -> FamilyMember:
    member = await db.get(FamilyMember, member_id)
    if member is None:
        raise HTTPException(status_code=404, detail="Family member not found")
    updates = data.model_dump(exclude_unset=True)
    if "name" in updates and updates["name"] is not None:
        updates["name"] = updates["name"].strip()
    if "initials" in updates and updates["initials"] is not None:
        updates["initials"] = updates["initials"].upper()
    for field, value in updates.items():
        setattr(member, field, value)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Initials already in use")
    await db.refresh(member)
    return member


@router.delete("/{member_id}", status_code=204)
async def delete_family_member(member_id: str, db: AsyncSession = Depends(get_db)) -> None:
    member = await db.get(FamilyMember, member_id)
    if member is None:
        raise HTTPException(status_code=404, detail="Family member not found")
    await db.delete(member)
    await db.commit()
