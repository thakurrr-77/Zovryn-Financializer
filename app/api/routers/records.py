from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.db import models
from app.schemas import schemas
from app.api import dependencies
from app.db.database import get_db

router = APIRouter(prefix="/records", tags=["records"])

# Both Admins and Analysts have access to view records 
@router.get("/", response_model=List[schemas.FinancialRecordOut], dependencies=[Depends(dependencies.has_analyst_access)])
def get_records(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    category: Optional[str] = None,
    type: Optional[schemas.TransactionTypeModel] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.FinancialRecord)
    
    if category:
        query = query.filter(models.FinancialRecord.category == category)
    if type:
        query = query.filter(models.FinancialRecord.type == type.value)
    if start_date:
        query = query.filter(models.FinancialRecord.date >= start_date)
    if end_date:
        query = query.filter(models.FinancialRecord.date <= end_date)
        
    return query.offset(skip).limit(limit).all()

# Admins can create records
@router.post("/", response_model=schemas.FinancialRecordOut, dependencies=[Depends(dependencies.has_admin_access)])
def create_record(
    record: schemas.FinancialRecordCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dependencies.get_current_active_user)
):
    record_data = record.model_dump(exclude_unset=True)
    if not record_data.get('date'):
        record_data['date'] = date.today()
        
    new_record = models.FinancialRecord(**record_data, owner_id=current_user.id)
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return new_record

# Admins can update records
@router.put("/{record_id}", response_model=schemas.FinancialRecordOut, dependencies=[Depends(dependencies.has_admin_access)])
def update_record(
    record_id: int,
    record_update: schemas.FinancialRecordUpdate,
    db: Session = Depends(get_db)
):
    record = db.query(models.FinancialRecord).filter(models.FinancialRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
        
    update_data = record_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(record, key, value)
        
    db.commit()
    db.refresh(record)
    return record

# Admins can delete records
@router.delete("/{record_id}", dependencies=[Depends(dependencies.has_admin_access)])
def delete_record(record_id: int, db: Session = Depends(get_db)):
    record = db.query(models.FinancialRecord).filter(models.FinancialRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
        
    db.delete(record)
    db.commit()
    return {"message": "Record deleted successfully"}
