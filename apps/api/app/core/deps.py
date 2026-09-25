from uuid import UUID

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.db import get_db
from app.core.security import decode_access_token
from app.models.entities import User

bearer = HTTPBearer(auto_error=False)
WRITERS = {"superadmin", "analyst"}


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    session: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> User:
    if credentials is None:
        raise HTTPException(status_code=401, detail="No autenticado")
    try:
        payload = decode_access_token(credentials.credentials, settings)
        user_id = UUID(payload["sub"])
    except (ValueError, KeyError):
        raise HTTPException(status_code=401, detail="Sesión inválida") from None
    user = session.get(User, user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="Sesión inválida")
    return user


def require_writer(user: User) -> None:
    if user.role not in WRITERS:
        raise HTTPException(status_code=403, detail="No tienes permiso para modificar")
