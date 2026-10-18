"""
Customer order routes: place an order, list my orders, view one order.
"""

from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, status

from app.deps import CurrentUser, Db
from app.models.common import doc_to_dict, to_object_id
from app.models.order import OrderCreate, OrderOut

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
async def place_order(body: OrderCreate, db: Db, user: CurrentUser):
    # 1) Load every requested menu item in ONE query using $in
    #    (instead of one query per item, the classic "N+1" problem).
    ids = [to_object_id(i.menu_item_id) for i in body.items]
    docs = await db["menu_items"].find({"_id": {"$in": ids}, "available": True}).to_list(None)
    menu_by_id = {str(d["_id"]): d for d in docs}

    # 2) Build the embedded item snapshots and compute the total ON THE SERVER,
    #    using prices from the database, not prices from the client.
    items, total = [], 0.0
    for line in body.items:
        menu_item = menu_by_id.get(line.menu_item_id)
        if menu_item is None:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Item {line.menu_item_id} doesn't exist or is unavailable",
            )
        items.append({
            "menu_item_id": menu_item["_id"],
            "name": menu_item["name"],
            "price": menu_item["price"],
            "quantity": line.quantity,
        })
        total += menu_item["price"] * line.quantity

    now = datetime.now(UTC)
    order = {
        "user_id": to_object_id(user["id"]),  # reference to the users collection
        "customer_name": user["name"],         # small denormalised copy for the admin list
        "items": items,                        # embedded array of sub-documents
        "total": round(total, 2),
        "status": "pending",
        "delivery_address": body.delivery_address,
        "notes": body.notes,
        "created_at": now,
        "status_history": [{"status": "pending", "at": now}],
    }
    result = await db["orders"].insert_one(order)
    order["_id"] = result.inserted_id
    return doc_to_dict(order)


@router.get("", response_model=list[OrderOut])
async def my_orders(db: Db, user: CurrentUser):
    # This query uses the compound index (user_id, created_at) from db.py.
    cursor = db["orders"].find({"user_id": to_object_id(user["id"])}).sort("created_at", -1)
    return [doc_to_dict(d) for d in await cursor.to_list(200)]


@router.get("/{order_id}", response_model=OrderOut)
async def get_order(order_id: str, db: Db, user: CurrentUser):
    order = await db["orders"].find_one({"_id": to_object_id(order_id)})
    # Customers may only see their own orders. Admins may see any.
    # We return 404 (not 403) so we don't reveal that the order exists.
    if order is None or (user["role"] != "admin" and str(order["user_id"]) != str(user["id"])):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
    return doc_to_dict(order)
