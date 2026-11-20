from fastapi import FastAPI

from app.api.router import api_router


app = FastAPI(
    title="JoinLab Studio API",
    description="Python backend for JoinLab Studio",
    version="0.3.1"
)


app.include_router(api_router)