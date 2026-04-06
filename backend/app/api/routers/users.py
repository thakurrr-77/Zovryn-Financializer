from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db import models
from app.schemas import schemas
from app.core import security
from app.api import dependencies
from app.db.database import get_db

router = APIRouter(prefix="/users", tags=["users"])


# ── Register a new user (public) ──────────────────────────────────────────────

@router.post("/", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user account.
    The **Viewer** role is automatically assigned as the default role.
    An Admin must explicitly elevate the user to Analyst or Admin via
    `POST /users/{user_id}/roles/{role_id}`.
    """
    existing = db.query(models.User).filter(
        (models.User.username == user.username) | (models.User.email == user.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already registered")

    hashed_password = security.get_password_hash(user.password)
    new_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
    )

    # Auto-assign Viewer role as the safe default
    viewer_role = db.query(models.Role).filter(models.Role.name == "Viewer").first()
    if viewer_role:
        new_user.roles.append(viewer_role)

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


# ── Current user profile ─────────────────────────────────────────────────────

@router.get("/me", response_model=schemas.UserOut)
def read_users_me(current_user: models.User = Depends(dependencies.get_current_active_user)):
    """Return the profile of the currently authenticated user."""
    return current_user

@router.put("/me", response_model=schemas.UserOut)
def update_user_me(
    user_update: schemas.UserUpdate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dependencies.get_current_active_user)
):
    """Update profile of the currently authenticated user."""
    if user_update.username:
        existing = db.query(models.User).filter(models.User.username == user_update.username, models.User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
        current_user.username = user_update.username
        
    if user_update.email:
        existing = db.query(models.User).filter(models.User.email == user_update.email, models.User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already taken")
        current_user.email = user_update.email
        
    if user_update.password:
        current_user.hashed_password = security.get_password_hash(user_update.password)
        
    db.commit()
    db.refresh(current_user)
    return current_user


# ── List all users (Admin only) ───────────────────────────────────────────────

@router.get(
    "/",
    response_model=List[schemas.UserOut],
    dependencies=[Depends(dependencies.has_admin_access)],
)
def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """
    List all registered users with pagination. **Admin only.**
    """
    return db.query(models.User).offset(skip).limit(limit).all()


# ── Get a specific user (Admin only) ─────────────────────────────────────────

@router.get(
    "/{user_id}",
    response_model=schemas.UserOut,
    dependencies=[Depends(dependencies.has_admin_access)],
)
def read_user(user_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a single user by ID. **Admin only.**
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# ── Activate / deactivate a user (Admin only) ────────────────────────────────

@router.put(
    "/{user_id}/status",
    dependencies=[Depends(dependencies.has_admin_access)],
)
def update_user_status(user_id: int, is_active: bool, db: Session = Depends(get_db)):
    """
    Activate or deactivate a user account. **Admin only.**
    Deactivated users receive 400 on all authenticated requests.
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = is_active
    db.commit()
    status_label = "active" if is_active else "inactive"
    return {"message": f"User '{user.username}' is now {status_label}"}


# ── Assign a role to a user (Admin only) ─────────────────────────────────────

@router.post(
    "/{user_id}/roles/{role_id}",
    dependencies=[Depends(dependencies.has_admin_access)],
)
def assign_role(user_id: int, role_id: int, db: Session = Depends(get_db)):
    """
    Assign an additional role to a user. **Admin only.**
    Idempotent — assigning a role the user already has is a no-op.
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    if role not in user.roles:
        user.roles.append(role)
        db.commit()
    return {"message": f"Role '{role.name}' assigned to user '{user.username}'"}


# ── Remove a role from a user (Admin only) ────────────────────────────────────

@router.delete(
    "/{user_id}/roles/{role_id}",
    dependencies=[Depends(dependencies.has_admin_access)],
)
def remove_role(user_id: int, role_id: int, db: Session = Depends(get_db)):
    """
    Remove a role from a user. **Admin only.**
    Idempotent — removing a role the user doesn't have is a no-op.
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    if role in user.roles:
        user.roles.remove(role)
        db.commit()
    return {"message": f"Role '{role.name}' removed from user '{user.username}'"}
