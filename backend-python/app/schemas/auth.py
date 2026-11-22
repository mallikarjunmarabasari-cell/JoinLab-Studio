from pydantic import BaseModel


class AuthUserResponse(BaseModel):
    id: str
    email: str | None = None # We return only the user ID and email for this initial endpoint.