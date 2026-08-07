from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.shopping_item import ShoppingItem
from app.schemas.shopping_item import ShoppingItemCreate, ShoppingItemResponse, ShoppingItemUpdate

router = APIRouter(prefix="/api/shopping", tags=["shopping"])


@router.get("", response_model=list[ShoppingItemResponse])
async def list_shopping_items(db: AsyncSession = Depends(get_db)) -> list[ShoppingItem]:
    cutoff = datetime.now(timezone.utc) - timedelta(hours=6)
    await db.execute(
        delete(ShoppingItem).where(
            ShoppingItem.checked == True,  # noqa: E712
            ShoppingItem.checked_at != None,  # noqa: E711
            ShoppingItem.checked_at < cutoff,
        )
    )
    await db.commit()

    result = await db.execute(
        select(ShoppingItem).order_by(ShoppingItem.created_at.desc())
    )
    return list(result.scalars().all())


@router.post("", response_model=ShoppingItemResponse, status_code=201)
async def create_shopping_item(
    data: ShoppingItemCreate, db: AsyncSession = Depends(get_db)
) -> ShoppingItem:
    item = ShoppingItem(
        name=data.name.strip(),
        quantity=data.quantity,
        unit=data.unit,
        store=data.store,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.put("/{item_id}", response_model=ShoppingItemResponse)
async def update_shopping_item(
    item_id: str, data: ShoppingItemUpdate, db: AsyncSession = Depends(get_db)
) -> ShoppingItem:
    item = await db.get(ShoppingItem, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Shopping item not found")
    updates = data.model_dump(exclude_unset=True)
    if "name" in updates and updates["name"] is not None:
        updates["name"] = updates["name"].strip()
    # checked_at is server-controlled: set on check, clear on uncheck
    if "checked" in updates:
        updates["checked_at"] = (
            datetime.now(timezone.utc) if updates["checked"] else None
        )
    for field, value in updates.items():
        setattr(item, field, value)
    await db.commit()
    await db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=204)
async def delete_shopping_item(item_id: str, db: AsyncSession = Depends(get_db)) -> None:
    item = await db.get(ShoppingItem, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Shopping item not found")
    await db.delete(item)
    await db.commit()
