from fastapi import APIRouter

from app.api.v1.routers.auth import router as auth_router
from app.api.v1.routers.role import router as role_router
from app.api.v1.routers.user import router as user_router
from app.api.v1.routers.form import router as form_router
from app.api.v1.routers.response import router as response_router
from app.api.v1.routers.activity_log import router as activity_log_router
from app.api.v1.routers.report import router as report_router
from app.api.v1.routers.dashboard import router as dashboard_router

api_router = APIRouter(
    prefix="/api/v1",
)


api_router.include_router(
    auth_router,
)

api_router.include_router(
    user_router,
)

api_router.include_router(
    role_router,
)
api_router.include_router(
    form_router,
)
api_router.include_router(
    response_router,
)
api_router.include_router(
    activity_log_router,
)

api_router.include_router(
    report_router,
)

api_router.include_router(
    dashboard_router,
)