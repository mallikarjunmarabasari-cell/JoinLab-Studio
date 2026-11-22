from fastapi import APIRouter, Depends

from app.api.dependencies import get_current_user
from app.schemas.auth import AuthUserResponse


router = APIRouter()


@router.get("/me", response_model=AuthUserResponse)
def get_authenticated_user(
    current_user=Depends(get_current_user),
) -> AuthUserResponse:
    return AuthUserResponse(
        id=str(current_user.id),
        email=current_user.email,
    )