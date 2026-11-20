from fastapi import APIRouter

from app.api.routes import health

# The prefix="/api" means that every route registered through this router starts with /api.
# Our health route is /health.
# Therefore:
# /api + /health = /api/health
# This is called route composition.

api_router = APIRouter(prefix="/api")

api_router.include_router(health.router)