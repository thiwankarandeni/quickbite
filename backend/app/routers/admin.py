"""
Admin routes: see all orders, change order status, sales stats.

`dependencies=[Depends(require_admin)]` on the router applies the admin check
to EVERY route in this file, so we can't forget it on a new one.
"""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from pymongo import ReturnDocument

from app.deps import Db, require_admin
from app.models.common import doc_to_dict, to_object_id
from app.models.order import OrderOut, OrderStatus, OrderStatusUpdate

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


@router.get("/orders", response_model=list[OrderOut])
async def all_orders(db: Db, status_filter: OrderStatus | None = None):
    filter_ = {"status": status_filter} if status_filter else {}
    cursor = db["orders"].find(filter_).sort([("created_at", -1), ("_id", -1)])
    return [doc_to_dict(d) for d in await cursor.to_list(500)]


@router.patch("/orders/{order_id}/status", response_model=OrderOut)
async def update_order_status(order_id: str, body: OrderStatusUpdate, db: Db):
    # One atomic update with two operators:
    #   $set  -> overwrite the current status
    #   $push -> append an entry to the status_history array
    order = await db["orders"].find_one_and_update(
        {"_id": to_object_id(order_id)},
        {
            "$set": {"status": body.status},
            "$push": {"status_history": {"status": body.status, "at": datetime.now(UTC)}},
        },
        return_document=ReturnDocument.AFTER,
    )
    if order is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
    return doc_to_dict(order)


class StatusCount(BaseModel):
    status: str
    count: int
    revenue: float


class TopItem(BaseModel):
    name: str
    quantity: int


class Stats(BaseModel):
    by_status: list[StatusCount]
    top_items: list[TopItem]


@router.get("/stats", response_model=Stats)
async def stats(db: Db):
    """
    CONCEPT: aggregation pipeline
      A list of stages. Each stage transforms the stream of documents and passes
      the result to the next stage (like Unix pipes, or SQL GROUP BY / ORDER BY).
    """
    by_status = await (await db["orders"].aggregate([
        # $group: one output doc per distinct status, with computed fields.
        {"$group": {"_id": "$status", "count": {"$sum": 1}, "revenue": {"$sum": "$total"}}},
        # $project: reshape the output (rename _id -> status).
        {"$project": {"_id": 0, "status": "$_id", "count": 1, "revenue": {"$round": ["$revenue", 2]}}},
        {"$sort": {"count": -1}},
    ])).to_list(None)

    top_items = await (await db["orders"].aggregate([
        {"$match": {"status": {"$ne": "cancelled"}}},  # $match = filter (like WHERE)
        {"$unwind": "$items"},                          # one doc per embedded item
        {"$group": {"_id": "$items.name", "quantity": {"$sum": "$items.quantity"}}},
        {"$sort": {"quantity": -1}},
        {"$limit": 5},
        {"$project": {"_id": 0, "name": "$_id", "quantity": 1}},
    ])).to_list(None)

    return {"by_status": by_status, "top_items": top_items}
