from fastapi import FastAPI

from app.api.v1.router import api_router
from app.core.config import settings
from app.exceptions.base import AppException
from app.exceptions.handlers import app_exception_handler


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
)


app.add_exception_handler(
    AppException,
    app_exception_handler,
)


app.include_router(api_router)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "message": "Dynamic Form Builder API is running.",
    }