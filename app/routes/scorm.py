from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_instructor
from app.core.response import api_success
from app.db.database import get_db
from app.db.models.user import User
from app.schemas.scorm import ScormPackageOut, ScormTrackCreate, ScormTrackingOut
from app.services.scorm_service import ScormService

router = APIRouter(prefix="/scorm", tags=["scorm"])


@router.post("/upload", status_code=status.HTTP_201_CREATED)
def upload_scorm(
    course_id: UUID = Form(...),
    file: UploadFile = File(...),
    _: User = Depends(require_instructor),
    db: Session = Depends(get_db),
):
    package = ScormService.upload_package(db, course_id, file)
    return api_success(ScormPackageOut.model_validate(package).model_dump())


@router.post("/track")
def track_scorm(
    payload: ScormTrackCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tracking = ScormService.track_progress(db, user, payload)
    return api_success(ScormTrackingOut.model_validate(tracking).model_dump())
