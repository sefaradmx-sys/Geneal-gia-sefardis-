from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import get_current_user
from app.models.entities import Organization, User
from app.schemas.dto import OrganizationCreate, OrganizationOut, OrganizationPatch

router = APIRouter(prefix="/organizations", tags=["organizations"])


def _visible(session: Session, user: User):
    stmt = select(Organization).order_by(Organization.name)
    if user.role != "superadmin":
        stmt = stmt.where(Organization.id == user.organization_id)
    return stmt


@router.get("", response_model=list[OrganizationOut])
def list_organizations(session: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return list(session.scalars(_visible(session, user)).all())


@router.post("", response_model=OrganizationOut)
def create_organization(
    body: OrganizationCreate,
    session: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role != "superadmin":
        raise HTTPException(status_code=403, detail="No tienes permiso para modificar")
    org = Organization(name=body.name, slug=body.slug)
    session.add(org)
    session.commit()
    session.refresh(org)
    return org


@router.get("/{organization_id}", response_model=OrganizationOut)
def get_organization(
    organization_id: UUID,
    session: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    org = session.get(Organization, organization_id)
    if org is None or (user.role != "superadmin" and org.id != user.organization_id):
        raise HTTPException(status_code=404, detail="Organización no encontrada")
    return org


@router.patch("/{organization_id}", response_model=OrganizationOut)
def patch_organization(
    organization_id: UUID,
    body: OrganizationPatch,
    session: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role != "superadmin":
        raise HTTPException(status_code=403, detail="No tienes permiso para modificar")
    org = session.get(Organization, organization_id)
    if org is None:
        raise HTTPException(status_code=404, detail="Organización no encontrada")
    if body.name is not None:
        org.name = body.name
    session.commit()
    session.refresh(org)
    return org
