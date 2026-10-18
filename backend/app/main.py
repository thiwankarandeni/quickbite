"""
FastAPI entry point. Run with:  uvicorn app.main:app --reload

Reading order for the backend:
  config.py -> db.py -> models/ -> security.py -> deps.py -> routers/
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import db
from app.config import get_settings
from app.routers import admin, auth, menu, orders


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    CONCEPT: lifespan
      Code before `yield` runs once at startup, and code after it runs once at
      shutdown. This is where long-lived resources such as the DB client belong.
    """
    await db.connect()
    yield
    await db.close()


app = FastAPI(title="Food Ordering API", version="1.0.0", lifespan=lifespan)

# CONCEPT: CORS
#   Browsers block JavaScript on http://localhost:3000 from calling
#   http://localhost:8000 unless the API explicitly allows that origin.
#   (Calls made from the Next.js *server* aren't affected; CORS is a browser rule.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(menu.router)
app.include_router(orders.router)
app.include_router(admin.router)


@app.get("/health", tags=["meta"])
async def health():
    return {"status": "ok"}
