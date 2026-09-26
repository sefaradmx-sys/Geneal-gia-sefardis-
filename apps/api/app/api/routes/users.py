from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import get_current_user
from app.core.security import hash_password
from app.models.entities import User
from app.schemas.dto import UserCreate, UserOut, UserPatch

router = APIRouter(prefix="/users", tags=["users"])
ROLES = {"superadmin", "analyst", "client_reader", "auditor"}


@router.get("", response_model=list[UserOut])
def list_users(session: Session = Depends(get_db), user: User = Depends(get_current_user)):
    stmt = select(User).order_by(User.username)
    if user.role != "superadmin":
        stmt = stmt.where(User.organization_id == user.organization_id)
    return list(session.scalars(stmt).all())


@router.post("", response_model=UserOut)
def create_user(body: UserCreate, session: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role != "superadmin":
        raise HTTPException(status_code=403, detail="No tienes permiso para modificar")
    if body.role not in ROLES:
        raise HTTPException(status_code=422, detail="Rol desconocido")
    created = User(
        organization_id=body.organization_id or user.organization_id,
        email=body.email.strip().lower(),
        username=body.username.strip(),
        password_hash=hash_password(body.password),
        role=body.role,
    )
    session.add(created)
    session.commit()
    session.refresh(created)
    return created


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: UUID, session: Session = Depends(get_db), user: User = Depends(get_current_user)):
    found = session.get(User, user_id)
    if found is None or (user.role != "superadmin" and found.organization_id != user.organization_id):
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return found


@router.patch("/{user_id}", response_model=UserOut)
def patch_user(
    user_id: UUID,
    body: UserPatch,
    session: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role != "superadmin":
        raise HTTPException(status_code=403, detail="No tienes permiso para modificar")
    found = session.get(User, user_id)
    if found is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if body.role is not None:
        if body.role not in ROLES:
            raise HTTPException(status_code=422, detail="Rol desconocido")
        found.role = body.role
    if body.is_active is not None:
        found.is_active = body.is_active
    if body.password:
        found.password_hash = hash_password(body.password)
    session.commit()
    session.refresh(found)
    return found
