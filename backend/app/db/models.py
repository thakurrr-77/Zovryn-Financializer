from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Table, Float, Date, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base
import enum
import datetime

class TransactionType(str, enum.Enum):
    income = "income"
    expense = "expense"

user_roles_association = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id")),
    Column("role_id", Integer, ForeignKey("roles.id"))
)

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False) # Viewer, Analyst, Admin
    description = Column(String)

    users = relationship("User", secondary=user_roles_association, back_populates="roles")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    roles = relationship("Role", secondary=user_roles_association, back_populates="users")
    records = relationship("FinancialRecord", back_populates="owner")

class FinancialRecord(Base):
    __tablename__ = "financial_records"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    type = Column(SQLEnum(TransactionType), nullable=False)
    category = Column(String, index=True, nullable=False)
    date = Column(Date, default=datetime.date.today, index=True)
    description = Column(String, nullable=True)
    
    # New analytics fields
    currency = Column(String, default="USD")
    payment_method = Column(String, nullable=True) # Cash, Card, Transfer
    tags = Column(String, nullable=True) # Comma separated
    
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="records")
