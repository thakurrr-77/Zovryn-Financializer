from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db import models
from app.schemas import schemas
from app.api import dependencies
from app.db.database import get_db
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/summary", response_model=schemas.DashboardSummaryOut)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dependencies.get_current_active_user),
    global_view: bool = Query(False, description="Admins can toggle global summary vs personal data")
):
    # Requirement: "analyst: read + analytics access"
    # "viewer: read-only access to their own data"
    # Dashboard summary should be user-scoped by default.
    is_admin = any(r.name == "Admin" for r in current_user.roles)
    
    return DashboardService.get_summary(
        db, 
        current_user, 
        is_admin=is_admin, 
        global_view=global_view
    )
