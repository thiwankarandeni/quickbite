"""
MongoDB connection.

CONCEPT: one client per process
  A MongoClient holds a pool of connections. Creating one is expensive, so we
  create it once when the app starts (see `lifespan` in main.py) and reuse it
  for every request.

CONCEPT: PyMongo's async API
  `AsyncMongoClient` is PyMongo's native asyncio client (it replaces the older
  "Motor" library). Every database call returns an awaitable, so a request that
  is waiting on MongoDB doesn't block other requests.

MongoDB vocabulary vs SQL:
  database   ~ database
  collection ~ table          (e.g. db["menu_items"])
  document   ~ row            (a JSON-like dict, stored as BSON)
  _id        ~ primary key    (an ObjectId, auto-generated if you don't set one)
"""

from pymongo import ASCENDING, DESCENDING, AsyncMongoClient
from pymongo.asynchronous.database import AsyncDatabase

from app.config import get_settings

_client: AsyncMongoClient | None = None


async def connect() -> None:
    global _client
    settings = get_settings()
    _client = AsyncMongoClient(settings.mongodb_uri)
    # "ping" forces a real round-trip so a bad URI fails at startup, not on the first request.
    await _client.admin.command("ping")
    await create_indexes(get_db())


async def close() -> None:
    if _client is not None:
        await _client.close()


def get_db() -> AsyncDatabase:
    """FastAPI dependency: routes declare `db = Depends(get_db)` to receive the database."""
    if _client is None:
        raise RuntimeError("Database not connected. Was the app started with its lifespan?")
    return _client[get_settings().db_name]


async def create_indexes(db: AsyncDatabase) -> None:
    """
    CONCEPT: indexes
      Without an index, MongoDB scans every document to answer a query.
      create_index is idempotent: running it again on startup does nothing if it exists.
    """
    # unique=True also enforces a rule: two users cannot share an email.
    await db["users"].create_index("email", unique=True)
    await db["menu_items"].create_index("category")
    # Compound index: "this user's orders, newest first" is our most common order query.
    await db["orders"].create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
