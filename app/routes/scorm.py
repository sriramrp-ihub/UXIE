from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status
from fastapi.concurrency import run_in_threadpool
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_instructor
from app.core.response import api_success
from app.db.database import get_db
from app.db.models.scorm import ScormActivity, ScormPackage
from app.db.models.user import User
from app.schemas.scorm import (
    ScormActivityOut,
    ScormInitializeOut,
    ScormPackageOut,
    ScormRegistrationOut,
    ScormRuntimeSetOut,
    ScormRuntimeSetRequest,
    ScormRuntimeValuesOut,
)
from app.services.scorm_service import ScormService

router = APIRouter(prefix="/scorm", tags=["scorm"])
admin_router = APIRouter(prefix="/admin/scorm", tags=["admin-scorm"])


@admin_router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_scorm(
    course_id: UUID = Form(...),
    lesson_id: UUID | None = Form(default=None),
    title: str | None = Form(default=None),
    file: UploadFile = File(...),
    user: User = Depends(require_instructor),
    db: Session = Depends(get_db),
):
    package = await run_in_threadpool(
        ScormService.upload_package,
        db,
        course_id,
        file,
        lesson_id,
        title,
        user,
    )
    return api_success(ScormPackageOut.model_validate(package).model_dump())


@router.get("/course/{course_id}/packages")
def list_scorm_packages_for_course(
    course_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    packages = ScormService.list_packages_for_course(db, course_id, user)
    return api_success([ScormPackageOut.model_validate(pkg).model_dump() for pkg in packages])


@router.post("/{package_id}/initialize")
def initialize_scorm_session(
    package_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    registration = ScormService.initialize_registration(db, package_id, user)
    package = db.get(ScormPackage, package_id)
    activities = db.scalars(
        select(ScormActivity).where(ScormActivity.package_id == package_id)
    ).all()
    runtime_data = ScormService.get_runtime_values(db, registration.id, user)

    response = ScormInitializeOut(
        session_id=registration.id,
        registration=ScormRegistrationOut.model_validate(registration),
        package=ScormPackageOut.model_validate(package),
        activities=[ScormActivityOut.model_validate(activity) for activity in activities],
        runtime_data=runtime_data,
    )
    return api_success(response.model_dump())


@router.get("/runtime/{registration_id}")
def get_runtime_value(
    registration_id: UUID,
    key: str | None = Query(default=None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    values = ScormService.get_runtime_values(db, registration_id, user, key)
    payload = ScormRuntimeValuesOut(registration_id=registration_id, data=values)
    return api_success(payload.model_dump())


@router.post("/runtime/{registration_id}")
def set_runtime_value(
    registration_id: UUID,
    payload: ScormRuntimeSetRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    runtime = ScormService.set_runtime_value(db, registration_id, user, payload)
    return api_success(ScormRuntimeSetOut.model_validate(runtime).model_dump())


@router.post("/runtime/{registration_id}/commit")
def commit_runtime(
    registration_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payload = ScormService.commit_runtime(db, registration_id, user)
    return api_success(payload)


@router.post("/runtime/{registration_id}/finish")
def finish_runtime(
    registration_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    registration = ScormService.finish_runtime(db, registration_id, user)
    return api_success(ScormRegistrationOut.model_validate(registration).model_dump())
