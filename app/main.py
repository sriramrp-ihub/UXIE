import logging
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import OperationalError

from app.cache.cache_service import CacheService
from app.core.config import get_settings
from app.core.response import api_error
from app.core.security import decode_token
from app.routes.analytics import router as analytics_router
from app.routes.auth import router as auth_router
from app.routes.chatbot import router as chatbot_router
from app.routes.courses import router as courses_router
from app.routes.enrollments import router as enrollments_router
from app.routes.progress import router as progress_router
from app.routes.quiz import router as quiz_router
from app.routes.scorm import admin_router as admin_scorm_router
from app.routes.scorm import router as scorm_router
from app.routes.users import router as users_router

settings = get_settings()
logger = logging.getLogger(__name__)
PROJECT_ROOT = Path(__file__).resolve().parents[1]

app = FastAPI(title=settings.app_name, version=settings.app_version, debug=settings.debug)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "success": True,
        "data": {
            "service": settings.app_name,
            "version": settings.app_version,
            "docs": "/docs",
            "health": "ok",
        },
        "error": None,
    }


@app.get("/favicon.ico", include_in_schema=False)
def favicon() -> Response:
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.on_event("startup")
def on_startup() -> None:
    Path(settings.scorm_storage_dir).mkdir(parents=True, exist_ok=True)


@app.middleware("http")
async def active_user_tracking_middleware(request: Request, call_next):
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", maxsplit=1)[1]
        try:
            payload = decode_token(token)
            user_id = payload.get("user_id")
            if user_id:
                CacheService.track_user_activity(str(user_id))
        except Exception:  # nosec B110
            pass
    return await call_next(request)


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content=api_error(exc.detail),
    )


@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(_: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=api_error("Validation error", data={"details": exc.errors()}),
    )


@app.exception_handler(OperationalError)
async def database_exception_handler(_: Request, exc: OperationalError):
    logger.warning("Database unavailable: %s", exc)
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content=api_error("Database unavailable. Please try again later."),
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, exc: Exception):
    logger.exception("Unhandled exception: %s", exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=api_error("Internal server error"),
    )


app.include_router(auth_router, prefix=settings.api_prefix)
app.include_router(users_router, prefix=settings.api_prefix)
app.include_router(courses_router, prefix=settings.api_prefix)
app.include_router(enrollments_router, prefix=settings.api_prefix)
app.include_router(scorm_router, prefix=settings.api_prefix)
app.include_router(admin_scorm_router, prefix=settings.api_prefix)
app.include_router(progress_router, prefix=settings.api_prefix)
app.include_router(quiz_router, prefix=settings.api_prefix)
app.include_router(analytics_router, prefix=settings.api_prefix)
app.include_router(chatbot_router, prefix=settings.api_prefix)
app.include_router(chatbot_router)

app.mount("/scorm-content", StaticFiles(directory=settings.scorm_storage_dir), name="scorm-content")
app.mount(
    "/sandbox",
    StaticFiles(directory=str(PROJECT_ROOT / "frontend"), html=True),
    name="sandbox",
)
