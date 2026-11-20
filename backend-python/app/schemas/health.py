# Pydantic schemas define the structure and types of data.
# Here, HealthResponse says that every health response must contain:
# - status: a string.
# - message: a string.
# FastAPI uses this schema for response validation and API documentation.
from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    message: str