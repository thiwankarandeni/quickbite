"""API tests for /admin: order management and the aggregation-based stats."""

import pytest
from bson import ObjectId


# The same check for every admin endpoint, via parametrize.
@pytest.mark.parametrize(
    "method, path",
    [
        ("get", "/admin/orders"),
        ("get", "/admin/stats"),
        ("patch", f"/admin/orders/{ObjectId()}/status"),
    ],
)
def test_admin_endpoints_reject_customers_and_anonymous(api, customer_headers, method, path):
    kwargs = {"json": {"status": "ready"}} if method == "patch" else {}
    assert getattr(api, method)(path, **kwargs).status_code == 401
    assert getattr(api, method)(path, headers=customer_headers, **kwargs).status_code == 403


def test_admin_sees_all_orders(api, admin_headers, customer_headers, other_customer_headers, place_order):
    place_order(customer_headers, {"Burger": 1})
    place_order(other_customer_headers, {"Lemonade": 1})

    res = api.get("/admin/orders", headers=admin_headers)
    assert res.status_code == 200
    assert {o["customer_name"] for o in res.json()} == {"Customer", "Other"}


def test_filter_orders_by_status(api, admin_headers, customer_headers, place_order):
    a = place_order(customer_headers, {"Burger": 1})
    place_order(customer_headers, {"Lemonade": 1})
    api.patch(f"/admin/orders/{a['id']}/status", json={"status": "ready"}, headers=admin_headers)

    res = api.get("/admin/orders", params={"status_filter": "ready"}, headers=admin_headers)
    assert [o["id"] for o in res.json()] == [a["id"]]


def test_update_status_appends_history(api, admin_headers, customer_headers, place_order):
    order = place_order(customer_headers, {"Burger": 1})

    for status in ("preparing", "ready", "delivered"):
        res = api.patch(f"/admin/orders/{order['id']}/status", json={"status": status}, headers=admin_headers)
        assert res.status_code == 200

    body = res.json()
    assert body["status"] == "delivered"
    # $push appended one entry per change, in order.
    assert [h["status"] for h in body["status_history"]] == ["pending", "preparing", "ready", "delivered"]

    # The customer sees the same thing.
    mine = api.get(f"/orders/{order['id']}", headers=customer_headers).json()
    assert mine["status"] == "delivered"


def test_update_status_rejects_unknown_status(api, admin_headers, customer_headers, place_order):
    order = place_order(customer_headers, {"Burger": 1})
    res = api.patch(f"/admin/orders/{order['id']}/status", json={"status": "teleported"}, headers=admin_headers)
    assert res.status_code == 422  # not one of the Literal values in OrderStatus


def test_update_status_of_missing_order(api, admin_headers):
    res = api.patch(f"/admin/orders/{ObjectId()}/status", json={"status": "ready"}, headers=admin_headers)
    assert res.status_code == 404


def test_stats_when_empty(api, admin_headers):
    res = api.get("/admin/stats", headers=admin_headers)
    assert res.status_code == 200
    assert res.json() == {"by_status": [], "top_items": []}


def test_stats_aggregation(api, admin_headers, customer_headers, place_order):
    place_order(customer_headers, {"Burger": 3, "Lemonade": 1})   # 33.0
    place_order(customer_headers, {"Margherita": 1})              # 12.5
    cancelled = place_order(customer_headers, {"Lemonade": 10})   # 30.0, cancelled below
    api.patch(f"/admin/orders/{cancelled['id']}/status", json={"status": "cancelled"}, headers=admin_headers)

    stats = api.get("/admin/stats", headers=admin_headers).json()

    by_status = {s["status"]: s for s in stats["by_status"]}
    assert by_status["pending"]["count"] == 2
    assert by_status["pending"]["revenue"] == 45.5
    assert by_status["cancelled"]["count"] == 1

    # Top items skip cancelled orders ($match), so Lemonade counts 1, not 11.
    top = {t["name"]: t["quantity"] for t in stats["top_items"]}
    assert top == {"Burger": 3, "Margherita": 1, "Lemonade": 1}
    assert stats["top_items"][0]["name"] == "Burger"  # sorted by quantity, descending
