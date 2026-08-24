from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.core.config import settings
from app.exceptions.base import AppException
from app.exceptions.handlers import app_exception_handler


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.add_exception_handler(
    AppException,
    app_exception_handler,
)


app.include_router(api_router)


# -----------------------------------------------------
# Serve uploaded files (e.g. FILE-type form field
# attachments) at /uploads/<stored_name>
# -----------------------------------------------------

Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)

app.mount(
    "/uploads",
    StaticFiles(directory=settings.upload_dir),
    name="uploads",
)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "message": "Dynamic Form Builder API is running.",
    }
