from fastapi import APIRouter

from app.api.routes import auth, health

# The prefix="/api" means that every route registered through this router starts with /api.
# Our health route is /health.
# Therefore:
# /api + /health = /api/health
# This is called route composition.

api_router = APIRouter(prefix="/api")

api_router.include_router(health.router)
api_router.include_router(auth.router, prefix="/auth", tags=["auth"]) # Your endpoint will now be: GET http://127.0.0.1:8000/api/auth/me