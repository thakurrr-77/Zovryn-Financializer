from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db import models
from app.schemas import schemas
from app.api import dependencies
from app.db.database import get_db

router = APIRouter(prefix="/roles", tags=["roles"])

@router.post("/", response_model=schemas.RoleOut, dependencies=[Depends(dependencies.has_admin_access)])
def create_role(role: schemas.RoleCreate, db: Session = Depends(get_db)):
    db_role = db.query(models.Role).filter(models.Role.name == role.name).first()
    if db_role:
        raise HTTPException(status_code=400, detail="Role already exists")
    new_role = models.Role(name=role.name, description=role.description)
    db.add(new_role)
    db.commit()
    db.refresh(new_role)
    return new_role

@router.get("/", response_model=List[schemas.RoleOut], dependencies=[Depends(dependencies.has_admin_access)])
def get_roles(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    roles = db.query(models.Role).offset(skip).limit(limit).all()
    return roles
