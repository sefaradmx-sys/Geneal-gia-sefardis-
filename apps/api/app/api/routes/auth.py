import time

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.db import get_db
from app.core.deps import get_current_user
from app.core.security import create_access_token, verify_password
from app.models.entities import AuditLog, User
from app.schemas.dto import LoginRequest, TokenResponse, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])
_failures: dict[str, list[float]] = {}


def _identity_key(username: str) -> str:
    return username.strip().casefold() or "-"


def _limited(identity: str) -> bool:
    now = time.time()
    recent = [stamp for stamp in _failures.get(identity, []) if now - stamp < 600]
    _failures[identity] = recent
    return len(recent) >= 10


def _register_failure(identity: str) -> None:
    _limited(identity)
    _failures.setdefault(identity, []).append(time.time())


def _clear_failures(identity: str) -> None:
    _failures.pop(identity, None)


@router.post("/login", response_model=TokenResponse)
def login(
    body: LoginRequest,
    session: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    identity = _identity_key(body.username)
    if _limited(identity):
        raise HTTPException(status_code=429, detail="Demasiados intentos. Espera unos minutos.")
    identifier = body.username.strip()
    user = session.scalar(select(User).where(or_(User.username == identifier, User.email == identifier)))
    if user is None or not user.is_active or not verify_password(body.password, user.password_hash):
        _register_failure(identity)
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    _clear_failures(identity)
    session.add(
        AuditLog(
            organization_id=user.organization_id,
            user_id=user.id,
            action="login",
            resource=f"user:{user.id}",
            detail="inicio de sesión",
        )
    )
    session.commit()
    token = create_access_token(
        user_id=user.id, role=user.role, organization_id=user.organization_id, settings=settings
    )
    return TokenResponse(access_token=token, role=user.role, username=user.username)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user
