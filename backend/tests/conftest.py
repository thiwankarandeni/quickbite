"""
Shared test setup. pytest loads conftest.py automatically before any test.

CONCEPT: fixtures
  A fixture is a function decorated with @pytest.fixture. A test asks for it
  by naming it as a parameter:

      def test_something(api, admin_headers): ...

  pytest runs the fixtures first and passes in their return values. Fixtures
  can depend on other fixtures, just like FastAPI's Depends().
  `scope="session"` means "create once for the whole test run"; the default
  (function scope) means "create fresh for every test".
  Code after `yield` in a fixture is cleanup (teardown).

WHICH DATABASE DO TESTS USE?
  The same MongoDB server as the app (MONGODB_URI from .env), or TEST_MONGODB_URI
  if you set it. But always a SEPARATE database called "<DB_NAME>_test". It is
  emptied before every test and dropped when the run finishes, so your real
  data is never touched.
"""

import os

# --- Configure the environment BEFORE importing the app ---------------------
# Settings are read from env vars (which take priority over .env), so we
# override them here, before app.config creates its cached Settings object.
from app.config import Settings

_base = Settings()
os.environ["DB_NAME"] = f"{_base.db_name}_test"
# Tests sign their own JWTs, so use a fixed, long test secret instead of yours.
os.environ["JWT_SECRET"] = "test-secret-that-is-at-least-32-bytes-long"
if os.environ.get("TEST_MONGODB_URI"):
    os.environ["MONGODB_URI"] = os.environ["TEST_MONGODB_URI"]

import pytest  # noqa: E402  (imports below must come after the env setup)
from fastapi.testclient import TestClient  # noqa: E402
from pymongo import MongoClient  # noqa: E402
from pymongo.errors import PyMongoError  # noqa: E402

from app.config import get_settings  # noqa: E402
from app.main import app  # noqa: E402
from app.security import hash_password  # noqa: E402

get_settings.cache_clear()  # make sure the app sees the _test database name
settings = get_settings()

# Safety net: never run destructive cleanup against a non-test database.
assert settings.db_name.endswith("_test"), f"Refusing to run tests against {settings.db_name!r}"

ADMIN_EMAIL = "admin@test.com"
ADMIN_PASSWORD = "admin-pass"


# --- Database fixtures --------------------------------------------------------

@pytest.fixture(scope="session")
def sync_db():
    """
    A plain (synchronous) PyMongo connection for test setup and assertions.

    Why not reuse the app's AsyncMongoClient? That client belongs to the event
    loop TestClient runs the app in. Tests are ordinary sync functions, so a
    separate sync client is the simplest way to insert/inspect data directly.
    """
    client = MongoClient(settings.mongodb_uri, serverSelectionTimeoutMS=5000)
    try:
        client.admin.command("ping")
    except PyMongoError as e:
        pytest.exit(f"Cannot connect to MongoDB for tests: {e}", returncode=1)

    db = client[settings.db_name]
    yield db
    client.drop_database(settings.db_name)  # teardown: remove the whole test DB
    client.close()


@pytest.fixture(scope="session")
def client(sync_db):
    """
    One TestClient for the whole run. Using it as a context manager (`with`)
    runs the app's lifespan: connect to MongoDB and create indexes on enter,
    close the connection on exit.
    """
    with TestClient(app) as c:
        yield c


@pytest.fixture
def api(client, sync_db):
    """
    What most tests use: the TestClient, with all collections emptied first so
    every test starts from a clean slate and tests can't affect each other.

    delete_many({}) instead of drop() keeps the indexes (e.g. unique email).
    """
    for name in ("users", "menu_items", "orders"):
        sync_db[name].delete_many({})
    return client


# --- Data fixtures --------------------------------------------------------------

@pytest.fixture
def menu_items(api, sync_db):
    """Insert a small menu and return the items as API-style dicts (with string ids)."""
    docs = [
        {"name": "Burger", "description": "Beefy", "price": 10.0, "category": "burgers",
         "image_url": None, "available": True},
        {"name": "Margherita", "description": "Cheesy", "price": 12.5, "category": "pizza",
         "image_url": None, "available": True},
        {"name": "Lemonade", "description": "Fresh", "price": 3.0, "category": "drinks",
         "image_url": None, "available": True},
        {"name": "Seasonal Pie", "description": "Sold out", "price": 6.0, "category": "desserts",
         "image_url": None, "available": False},
    ]
    result = sync_db["menu_items"].insert_many(docs)
    items = {}
    for doc, _id in zip(docs, result.inserted_ids):
        item = {k: v for k, v in doc.items() if k != "_id"}
        item["id"] = str(_id)
        items[doc["name"]] = item
    return items  # e.g. menu_items["Burger"]["id"]


def register(api, name="Customer", email="customer@test.com", password="secret123"):
    """Helper (not a fixture): register through the real API and return the response JSON."""
    res = api.post("/auth/register", json={"name": name, "email": email, "password": password})
    assert res.status_code == 201, res.text
    return res.json()


def bearer(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def customer_headers(api):
    return bearer(register(api)["access_token"])


@pytest.fixture
def other_customer_headers(api):
    return bearer(register(api, name="Other", email="other@test.com")["access_token"])


@pytest.fixture
def admin_headers(api, sync_db):
    # Admins can't sign up through the API (on purpose), so insert one directly,
    # the same way seed.py does, then log in through the real endpoint.
    sync_db["users"].insert_one({
        "name": "Admin",
        "email": ADMIN_EMAIL,
        "password_hash": hash_password(ADMIN_PASSWORD),
        "role": "admin",
    })
    res = api.post("/auth/login", data={"username": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert res.status_code == 200, res.text
    return bearer(res.json()["access_token"])


@pytest.fixture
def place_order(api, menu_items):
    """
    Fixture that returns a FUNCTION ("factory fixture"), so a test can place as
    many orders as it needs: order = place_order(headers, {"Burger": 2})
    """
    def _place(headers: dict, quantities: dict[str, int], address: str = "1 Test Street"):
        items = [{"menu_item_id": menu_items[n]["id"], "quantity": q} for n, q in quantities.items()]
        res = api.post("/orders", json={"items": items, "delivery_address": address}, headers=headers)
        assert res.status_code == 201, res.text
        return res.json()

    return _place
