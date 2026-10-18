"""API tests for /orders: placing orders and who can see them."""

from bson import ObjectId


def test_place_order_computes_total_on_server(api, customer_headers, menu_items, sync_db):
    burger, lemonade = menu_items["Burger"], menu_items["Lemonade"]
    res = api.post(
        "/orders",
        json={
            "items": [
                # The client sneaks in a fake price. The model has no "price" field,
                # so Pydantic ignores it and the server uses the DB price.
                {"menu_item_id": burger["id"], "quantity": 2, "price": 0.01},
                {"menu_item_id": lemonade["id"], "quantity": 1},
            ],
            "delivery_address": "42 Test Road",
            "total": 0.01,  # also ignored
        },
        headers=customer_headers,
    )
    assert res.status_code == 201
    order = res.json()
    assert order["total"] == 2 * 10.0 + 3.0
    assert order["status"] == "pending"
    assert [h["status"] for h in order["status_history"]] == ["pending"]
    assert order["customer_name"] == "Customer"

    # Embedded snapshot: each item carries its own name and price.
    assert {i["name"]: i["price"] for i in order["items"]} == {"Burger": 10.0, "Lemonade": 3.0}

    # In MongoDB, user_id is stored as an ObjectId (a reference), not a string.
    stored = sync_db["orders"].find_one({"_id": ObjectId(order["id"])})
    assert isinstance(stored["user_id"], ObjectId)


def test_order_keeps_old_price_after_menu_change(api, customer_headers, admin_headers, place_order, menu_items):
    """Why we EMBED item snapshots: editing the menu must not rewrite order history."""
    order = place_order(customer_headers, {"Burger": 1})

    api.patch(f"/menu/{menu_items['Burger']['id']}", json={"price": 99.0}, headers=admin_headers)

    again = api.get(f"/orders/{order['id']}", headers=customer_headers).json()
    assert again["items"][0]["price"] == 10.0
    assert again["total"] == 10.0


def test_cannot_order_unavailable_item(api, customer_headers, menu_items):
    res = api.post(
        "/orders",
        json={"items": [{"menu_item_id": menu_items["Seasonal Pie"]["id"], "quantity": 1}],
              "delivery_address": "42 Test Road"},
        headers=customer_headers,
    )
    assert res.status_code == 400


def test_cannot_order_nonexistent_item(api, customer_headers, menu_items):
    res = api.post(
        "/orders",
        json={"items": [{"menu_item_id": str(ObjectId()), "quantity": 1}], "delivery_address": "42 Test Road"},
        headers=customer_headers,
    )
    assert res.status_code == 400


def test_order_validation(api, customer_headers, menu_items):
    burger_id = menu_items["Burger"]["id"]
    cases = [
        {"items": [], "delivery_address": "42 Test Road"},                                  # empty cart
        {"items": [{"menu_item_id": burger_id, "quantity": 0}], "delivery_address": "42 Test Road"},  # qty 0
        {"items": [{"menu_item_id": burger_id, "quantity": 1}], "delivery_address": "x"},   # address too short
    ]
    for payload in cases:
        res = api.post("/orders", json=payload, headers=customer_headers)
        assert res.status_code == 422, payload


def test_placing_order_requires_login(api, menu_items):
    res = api.post(
        "/orders",
        json={"items": [{"menu_item_id": menu_items["Burger"]["id"], "quantity": 1}], "delivery_address": "42 Test Road"},
    )
    assert res.status_code == 401


def test_my_orders_only_shows_my_orders_newest_first(api, customer_headers, other_customer_headers, place_order):
    first = place_order(customer_headers, {"Burger": 1})
    second = place_order(customer_headers, {"Lemonade": 1})
    place_order(other_customer_headers, {"Margherita": 1})

    res = api.get("/orders", headers=customer_headers)
    assert res.status_code == 200
    assert [o["id"] for o in res.json()] == [second["id"], first["id"]]


def test_customer_cannot_see_someone_elses_order(api, customer_headers, other_customer_headers, place_order):
    order = place_order(customer_headers, {"Burger": 1})
    # 404, not 403: we don't even admit the order exists.
    assert api.get(f"/orders/{order['id']}", headers=other_customer_headers).status_code == 404


def test_admin_can_see_any_order(api, customer_headers, admin_headers, place_order):
    order = place_order(customer_headers, {"Burger": 1})
    res = api.get(f"/orders/{order['id']}", headers=admin_headers)
    assert res.status_code == 200
    assert res.json()["id"] == order["id"]
