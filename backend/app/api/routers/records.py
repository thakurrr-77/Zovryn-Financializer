from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.db import models
from app.schemas import schemas
from app.api import dependencies
from app.db.database import get_db
from app.services.record_service import RecordService

router = APIRouter(prefix="/records", tags=["records"])


# ── List records ──────────────────────────────────────────────────────────────

@router.get("/", response_model=List[schemas.FinancialRecordOut])
def get_records(
    skip: int = Query(0, ge=0, description="Number of records to skip (pagination offset)"),
    limit: int = Query(100, le=1000, description="Maximum number of records to return"),
    category: Optional[str] = Query(None, description="Filter by exact category name"),
    type: Optional[schemas.TransactionTypeModel] = Query(None, description="Filter by income or expense"),
    search: Optional[str] = Query(None, description="Keyword search across description, category, and tags"),
    start_date: Optional[date] = Query(None, description="Inclusive start date filter (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Inclusive end date filter (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dependencies.has_analyst_access),
):
    """
    Returns financial records visible to the current user.
    - **Viewer / Analyst**: own records only.
    - **Admin**: all records system-wide.
    Supports pagination, category/type/date-range filters, and full-text search.
    """
    is_admin = any(r.name == "Admin" for r in current_user.roles)
    return RecordService.get_records(
        db, current_user, skip, limit,
        category,
        type.value if type else None,
        search, start_date, end_date,
        is_admin,
    )


# ── Get single record ─────────────────────────────────────────────────────────

@router.get("/{record_id}", response_model=schemas.FinancialRecordOut)
def get_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dependencies.has_analyst_access),
):
    """
    Fetch a single financial record by ID.
    Non-admins can only retrieve their own records.
    """
    is_admin = any(r.name == "Admin" for r in current_user.roles)
    record = RecordService.get_by_id(db, record_id, current_user.id, is_admin)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found or access denied")
    return record


# ── Create record (Admin only) ────────────────────────────────────────────────

@router.post("/", response_model=schemas.FinancialRecordOut, status_code=status.HTTP_201_CREATED)
def create_record(
    record: schemas.FinancialRecordCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dependencies.has_admin_access),
):
    """
    Create a new financial record. **Admin only.**
    Viewers and Analysts have read access only — they cannot create records.
    """
    return RecordService.create_record(db, record, current_user.id)


# ── Update record (Admin only) ────────────────────────────────────────────────

@router.put("/{record_id}", response_model=schemas.FinancialRecordOut)
def update_record(
    record_id: int,
    record_update: schemas.FinancialRecordUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dependencies.has_admin_access),
):
    """
    Update an existing financial record by ID. **Admin only.**
    Only fields included in the request body will be changed (partial update).
    """
    record = RecordService.update_record(
        db, record_id, record_update, current_user.id, is_admin=True
    )
    if not record:
        raise HTTPException(status_code=404, detail="Record not found or access denied")
    return record


# ── Soft-delete record (Admin only) ──────────────────────────────────────────

@router.delete("/{record_id}")
def delete_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dependencies.has_admin_access),
):
    """
    Soft-delete a financial record. **Admin only.**
    The record is flagged as deleted but remains in the database and can be
    restored at any time. Returns 404 if the record is already deleted.
    """
    success = RecordService.soft_delete(db, record_id, current_user.id, is_admin=True)
    if not success:
        raise HTTPException(status_code=404, detail="Record not found or already deleted")
    return {"message": "Record archived successfully (soft-delete). Use /restore to undo."}


# ── Restore soft-deleted record (Admin only) ──────────────────────────────────

@router.post("/{record_id}/restore", response_model=schemas.FinancialRecordOut)
def restore_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dependencies.has_admin_access),
):
    """
    Restore a previously soft-deleted record. **Admin only.**
    Returns 404 if the record ID does not exist or was not in a deleted state.
    """
    record = RecordService.restore_record(db, record_id)
    if not record:
        raise HTTPException(
            status_code=404,
            detail="Record not found in archive or was not deleted",
        )
    return record
