"""
Order schemas.

CONCEPT: embedding vs referencing (MongoDB data modelling)
  - The order *embeds* a copy of each item (name, price, quantity). If the admin
    later changes a burger's price, old orders still show what the customer paid.
    Embedding also means one read gets the whole order, with no joins.
  - The order *references* the user by `user_id`, because users change
    independently and we don't need their details on every order.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.models.common import PyObjectId

OrderStatus = Literal["pending", "preparing", "ready", "delivered", "cancelled"]


# --- Input ---------------------------------------------------------------

class OrderItemIn(BaseModel):
    # The client only sends WHICH item and HOW MANY. Never trust a price from the client.
    menu_item_id: str
    quantity: int = Field(ge=1, le=50)


class OrderCreate(BaseModel):
    items: list[OrderItemIn] = Field(min_length=1)
    delivery_address: str = Field(min_length=5, max_length=300)
    notes: str = Field(default="", max_length=300)


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


# --- Output --------------------------------------------------------------

class OrderItemOut(BaseModel):
    menu_item_id: PyObjectId
    name: str
    price: float
    quantity: int


class StatusChange(BaseModel):
    status: OrderStatus
    at: datetime


class OrderOut(BaseModel):
    id: PyObjectId
    user_id: PyObjectId
    customer_name: str
    items: list[OrderItemOut]
    total: float
    status: OrderStatus
    delivery_address: str
    notes: str
    created_at: datetime
    # A list that grows with `$push` every time the status changes.
    status_history: list[StatusChange]
