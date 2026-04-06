from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import date
from app.db import models
from app.schemas import schemas


class RecordService:
    @staticmethod
    def get_records(
        db: Session,
        user: models.User,
        skip: int = 0,
        limit: int = 100,
        category: Optional[str] = None,
        record_type: Optional[str] = None,
        search: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        is_admin: bool = False,
    ) -> List[models.FinancialRecord]:
        """
        Return a filtered, paginated list of non-deleted financial records.
        Non-admins are restricted to their own records only.
        """
        query = db.query(models.FinancialRecord).filter(
            models.FinancialRecord.is_deleted == False  # noqa: E712
        )

        # RBAC: non-admins only see their own records
        if not is_admin:
            query = query.filter(models.FinancialRecord.owner_id == user.id)

        if category:
            query = query.filter(models.FinancialRecord.category == category)
        if record_type:
            query = query.filter(models.FinancialRecord.type == record_type)
        if search:
            query = query.filter(
                or_(
                    models.FinancialRecord.description.ilike(f"%{search}%"),
                    models.FinancialRecord.category.ilike(f"%{search}%"),
                    models.FinancialRecord.tags.ilike(f"%{search}%"),
                )
            )
        if start_date:
            query = query.filter(models.FinancialRecord.date >= start_date)
        if end_date:
            query = query.filter(models.FinancialRecord.date <= end_date)

        return query.order_by(models.FinancialRecord.date.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_by_id(
        db: Session,
        record_id: int,
        user_id: int,
        is_admin: bool = False,
    ) -> Optional[models.FinancialRecord]:
        """
        Fetch a single non-deleted record by ID.
        Non-admins can only access records they own.
        """
        query = db.query(models.FinancialRecord).filter(
            models.FinancialRecord.id == record_id,
            models.FinancialRecord.is_deleted == False,  # noqa: E712
        )
        if not is_admin:
            query = query.filter(models.FinancialRecord.owner_id == user_id)
        return query.first()

    @staticmethod
    def create_record(
        db: Session,
        record_in: schemas.FinancialRecordCreate,
        user_id: int,
    ) -> models.FinancialRecord:
        data = record_in.model_dump()
        owner_id = data.pop("owner_id", None) or user_id
        db_obj = models.FinancialRecord(**data, owner_id=owner_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def update_record(
        db: Session,
        record_id: int,
        record_in: schemas.FinancialRecordUpdate,
        user_id: int,
        is_admin: bool = False,
    ) -> Optional[models.FinancialRecord]:
        query = db.query(models.FinancialRecord).filter(
            models.FinancialRecord.id == record_id,
            models.FinancialRecord.is_deleted == False,  # noqa: E712
        )
        if not is_admin:
            query = query.filter(models.FinancialRecord.owner_id == user_id)

        record = query.first()
        if not record:
            return None

        update_data = record_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(record, field, value)

        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def soft_delete(
        db: Session,
        record_id: int,
        user_id: int,
        is_admin: bool = False,
    ) -> bool:
        """
        Soft-delete a record by setting is_deleted=True.
        Guards against deleting an already-deleted record.
        """
        query = db.query(models.FinancialRecord).filter(
            models.FinancialRecord.id == record_id,
            models.FinancialRecord.is_deleted == False,  # noqa: E712 — guard against double-delete
        )
        if not is_admin:
            query = query.filter(models.FinancialRecord.owner_id == user_id)

        record = query.first()
        if not record:
            return False

        record.is_deleted = True
        db.commit()
        return True

    @staticmethod
    def restore_record(
        db: Session,
        record_id: int,
    ) -> Optional[models.FinancialRecord]:
        """
        Restore a previously soft-deleted record (admin only).
        Returns None if the record doesn't exist or was never deleted.
        """
        record = db.query(models.FinancialRecord).filter(
            models.FinancialRecord.id == record_id,
            models.FinancialRecord.is_deleted == True,  # noqa: E712
        ).first()
        if not record:
            return None

        record.is_deleted = False
        db.commit()
        db.refresh(record)
        return record
