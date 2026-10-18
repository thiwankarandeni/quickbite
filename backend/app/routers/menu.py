"""
Public menu routes (no login needed) plus admin-only create/update/delete.

MongoDB operations shown here:
  find(filter).sort(...)         -> query many documents
  find_one({"_id": ...})         -> get one by primary key
  insert_one(doc)                -> create
  find_one_and_update(..., $set) -> partial update, returning the new document
  delete_one(...)                -> delete
"""

from fastapi import APIRouter, HTTPException, Query, status
from pymongo import ReturnDocument

from app.deps import AdminUser, Db
from app.models.common import doc_to_dict, to_object_id
from app.models.menu import CATEGORIES, MenuItemCreate, MenuItemOut, MenuItemUpdate

router = APIRouter(prefix="/menu", tags=["menu"])


@router.get("/categories", response_model=list[str])
async def list_categories():
    return CATEGORIES


@router.get("", response_model=list[MenuItemOut])
async def list_menu(
    db: Db,
    # Query params: GET /menu?category=pizza&search=cheese
    # Query(...) adds validation and docs. A default of None makes them optional.
    category: str | None = Query(default=None),
    search: str | None = Query(default=None, max_length=50),
    include_unavailable: bool = False,
):
    # Build the Mongo filter step by step. An empty dict {} matches everything.
    filter_: dict = {}
    if category:
        filter_["category"] = category
    if search:
        # $regex with "i" option = case-insensitive "contains". Fine for small data;
        # large apps would use a text index or Atlas Search instead.
        filter_["name"] = {"$regex": search, "$options": "i"}
    if not include_unavailable:
        filter_["available"] = True

    cursor = db["menu_items"].find(filter_).sort([("category", 1), ("name", 1)])
    # A cursor is lazy. to_list() actually fetches the documents.
    docs = await cursor.to_list(length=500)
    return [doc_to_dict(d) for d in docs]


# {item_id} is a *path* parameter: GET /menu/6650f1...
@router.get("/{item_id}", response_model=MenuItemOut)
async def get_menu_item(item_id: str, db: Db):
    doc = await db["menu_items"].find_one({"_id": to_object_id(item_id)})
    if doc is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Menu item not found")
    return doc_to_dict(doc)


# ---- Admin-only below: the `_: AdminUser` parameter enforces it -----------

@router.post("", response_model=MenuItemOut, status_code=status.HTTP_201_CREATED)
async def create_menu_item(body: MenuItemCreate, db: Db, _: AdminUser):
    # mode="json" turns types like HttpUrl into plain strings that Mongo can store.
    doc = body.model_dump(mode="json")
    result = await db["menu_items"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc_to_dict(doc)


@router.patch("/{item_id}", response_model=MenuItemOut)
async def update_menu_item(item_id: str, body: MenuItemUpdate, db: Db, _: AdminUser):
    # exclude_unset=True keeps only the fields the client actually sent, so a
    # PATCH with {"price": 9.5} changes the price and nothing else.
    changes = body.model_dump(mode="json", exclude_unset=True)
    if not changes:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No fields to update")

    doc = await db["menu_items"].find_one_and_update(
        {"_id": to_object_id(item_id)},
        {"$set": changes},  # $set updates only the given fields
        return_document=ReturnDocument.AFTER,  # return the doc *after* the update
    )
    if doc is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Menu item not found")
    return doc_to_dict(doc)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_menu_item(item_id: str, db: Db, _: AdminUser):
    result = await db["menu_items"].delete_one({"_id": to_object_id(item_id)})
    if result.deleted_count == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Menu item not found")
    # 204 = success with no response body. Past orders are unaffected because they
    # embed their own copy of the item.
