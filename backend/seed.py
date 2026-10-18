"""
Fill the database with sample menu items and an admin user.

Run from the backend folder:  python seed.py
It is safe to run again: menu items are replaced and the admin is upserted.
"""

import asyncio

from pymongo import AsyncMongoClient

from app.config import get_settings
from app.db import create_indexes
from app.security import hash_password

ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "admin123"


def img(photo_id: str) -> str:
    return f"https://images.unsplash.com/{photo_id}?w=600&q=70&auto=format&fit=crop"


MENU = [
    {"name": "Classic Cheeseburger", "category": "burgers", "price": 9.5,
     "description": "Beef patty, cheddar, lettuce, tomato, house sauce.",
     "image_url": img("photo-1568901346375-23c9450c58cd")},
    {"name": "Spicy Chicken Burger", "category": "burgers", "price": 10.0,
     "description": "Crispy chicken, jalapeños, chipotle mayo.",
     "image_url": img("photo-1606755962773-d324e0a13086")},
    {"name": "Margherita Pizza", "category": "pizza", "price": 12.0,
     "description": "Tomato, mozzarella, fresh basil.",
     "image_url": img("photo-1574071318508-1cdbab80d002")},
    {"name": "Pepperoni Pizza", "category": "pizza", "price": 13.5,
     "description": "Loaded with pepperoni and mozzarella.",
     "image_url": img("photo-1628840042765-356cda07504e")},
    {"name": "Caesar Salad", "category": "salads", "price": 8.0,
     "description": "Romaine, parmesan, croutons, Caesar dressing.",
     "image_url": img("photo-1550304943-4f24f54ddde9")},
    {"name": "Greek Salad", "category": "salads", "price": 8.5,
     "description": "Tomato, cucumber, olives, feta.",
     "image_url": img("photo-1540420773420-3366772f4999")},
    {"name": "Lemonade", "category": "drinks", "price": 3.0,
     "description": "Freshly squeezed.",
     "image_url": img("photo-1621263764928-df1444c5e859")},
    {"name": "Iced Coffee", "category": "drinks", "price": 3.5,
     "description": "Cold brew over ice.",
     "image_url": img("photo-1517701604599-bb29b565090c")},
    {"name": "Chocolate Brownie", "category": "desserts", "price": 4.5,
     "description": "Warm, fudgy, with a scoop of vanilla.",
     "image_url": img("photo-1606313564200-e75d5e30476c")},
    {"name": "Cheesecake", "category": "desserts", "price": 5.0,
     "description": "New York style with berry compote.",
     "image_url": img("photo-1533134242443-d4fd215305ad")},
]


async def main() -> None:
    settings = get_settings()
    client = AsyncMongoClient(settings.mongodb_uri)
    db = client[settings.db_name]
    await create_indexes(db)

    await db["menu_items"].delete_many({})
    await db["menu_items"].insert_many([{**item, "available": True} for item in MENU])
    print(f"Inserted {len(MENU)} menu items")

    # upsert=True: update the admin if it exists, otherwise insert it.
    await db["users"].update_one(
        {"email": ADMIN_EMAIL},
        {"$set": {
            "name": "Admin",
            "email": ADMIN_EMAIL,
            "password_hash": hash_password(ADMIN_PASSWORD),
            "role": "admin",
        }},
        upsert=True,
    )
    print(f"Admin user ready: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
    await client.close()


if __name__ == "__main__":
    asyncio.run(main())
