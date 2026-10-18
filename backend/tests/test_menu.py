"""API tests for /menu: public reads and admin-only writes."""

from bson import ObjectId


def names(res) -> set[str]:
    return {item["name"] for item in res.json()}


# --- Public reads ----------------------------------------------------------------

def test_list_menu_hides_unavailable_items(api, menu_items):
    res = api.get("/menu")
    assert res.status_code == 200
    assert names(res) == {"Burger", "Margherita", "Lemonade"}  # not "Seasonal Pie"


def test_list_menu_can_include_unavailable(api, menu_items):
    res = api.get("/menu", params={"include_unavailable": True})
    assert "Seasonal Pie" in names(res)


def test_filter_by_category(api, menu_items):
    res = api.get("/menu", params={"category": "pizza"})
    assert names(res) == {"Margherita"}


def test_search_is_case_insensitive(api, menu_items):
    res = api.get("/menu", params={"search": "MARG"})
    assert names(res) == {"Margherita"}


def test_items_expose_id_not_underscore_id(api, menu_items):
    item = api.get("/menu").json()[0]
    assert "id" in item and "_id" not in item
    assert ObjectId.is_valid(item["id"])


def test_get_single_item(api, menu_items):
    burger = menu_items["Burger"]
    res = api.get(f"/menu/{burger['id']}")
    assert res.status_code == 200
    assert res.json()["name"] == "Burger"


def test_get_missing_item_returns_404(api, menu_items):
    assert api.get(f"/menu/{ObjectId()}").status_code == 404  # valid id, no such doc
    assert api.get("/menu/not-an-object-id").status_code == 404  # invalid id


def test_categories(api):
    res = api.get("/menu/categories")
    assert res.status_code == 200
    assert "pizza" in res.json()


# --- Admin writes -------------------------------------------------------------------

NEW_ITEM = {"name": "Tacos", "price": 7.5, "category": "burgers", "image_url": "https://example.com/t.jpg"}


def test_create_requires_login(api):
    assert api.post("/menu", json=NEW_ITEM).status_code == 401


def test_create_forbidden_for_customers(api, customer_headers):
    assert api.post("/menu", json=NEW_ITEM, headers=customer_headers).status_code == 403


def test_admin_can_create_item(api, admin_headers, sync_db):
    res = api.post("/menu", json=NEW_ITEM, headers=admin_headers)
    assert res.status_code == 201
    body = res.json()
    assert body["name"] == "Tacos"
    assert body["available"] is True  # default from the Pydantic model
    assert body["description"] == ""

    # It's really in the database.
    assert sync_db["menu_items"].count_documents({"name": "Tacos"}) == 1


def test_create_validates_price(api, admin_headers):
    res = api.post("/menu", json={**NEW_ITEM, "price": -1}, headers=admin_headers)
    assert res.status_code == 422


def test_patch_updates_only_sent_fields(api, admin_headers, menu_items):
    burger = menu_items["Burger"]
    res = api.patch(f"/menu/{burger['id']}", json={"price": 11.0}, headers=admin_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["price"] == 11.0
    assert body["name"] == "Burger"  # untouched (exclude_unset=True + $set)
    assert body["description"] == "Beefy"


def test_patch_with_no_fields_is_rejected(api, admin_headers, menu_items):
    res = api.patch(f"/menu/{menu_items['Burger']['id']}", json={}, headers=admin_headers)
    assert res.status_code == 400


def test_patch_missing_item_returns_404(api, admin_headers):
    res = api.patch(f"/menu/{ObjectId()}", json={"price": 5}, headers=admin_headers)
    assert res.status_code == 404


def test_delete_item(api, admin_headers, menu_items):
    item_id = menu_items["Lemonade"]["id"]
    assert api.delete(f"/menu/{item_id}", headers=admin_headers).status_code == 204
    assert api.get(f"/menu/{item_id}").status_code == 404
    # Deleting again: nothing left to delete.
    assert api.delete(f"/menu/{item_id}", headers=admin_headers).status_code == 404


def test_delete_forbidden_for_customers(api, customer_headers, menu_items):
    res = api.delete(f"/menu/{menu_items['Burger']['id']}", headers=customer_headers)
    assert res.status_code == 403
