"""
Menu item schemas.

The Create / Update / Out pattern:
  - MenuItemCreate: all required fields for a new item.
  - MenuItemUpdate: every field optional, so the admin can PATCH just one field.
  - MenuItemOut:    the shape returned to clients (adds "id").
"""

from pydantic import BaseModel, Field, HttpUrl

from app.models.common import PyObjectId

CATEGORIES = ["burgers", "pizza", "salads", "drinks", "desserts"]


class MenuItemBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str = Field(default="", max_length=500)
    # Money as float is fine for a learning project; real apps often store integer cents.
    price: float = Field(gt=0, le=1000)
    category: str
    image_url: HttpUrl | None = None
    available: bool = True


class MenuItemCreate(MenuItemBase):
    pass


class MenuItemUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    price: float | None = Field(default=None, gt=0, le=1000)
    category: str | None = None
    image_url: HttpUrl | None = None
    available: bool | None = None


class MenuItemOut(MenuItemBase):
    id: PyObjectId
