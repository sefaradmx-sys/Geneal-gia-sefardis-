from fastapi import APIRouter

from app.api.routes import auth, mentions, organizations, reports, studies, users

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(organizations.router)
api_router.include_router(users.router)
api_router.include_router(studies.router)
api_router.include_router(mentions.router)
api_router.include_router(reports.router)
