from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field

ShoppingUnit = Literal["stk", "g"]
ShoppingStore = Literal["migros", "lidl", "coop", "aldi", "andere", "egal"]


class ShoppingItemCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    quantity: int = Field(..., ge=1, le=9999)
    unit: ShoppingUnit
    store: ShoppingStore = "egal"


class ShoppingItemUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    quantity: Optional[int] = Field(None, ge=1, le=9999)
    unit: Optional[ShoppingUnit] = None
    store: Optional[ShoppingStore] = None
    checked: Optional[bool] = None


class ShoppingItemResponse(BaseModel):
    id: str
    name: str
    quantity: int
    unit: str
    store: str
    checked: bool
    checked_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}
