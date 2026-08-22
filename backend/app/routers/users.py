from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.user import UserResponse, UserUpdate
from app.services.user_service import get_all_users, get_user_by_id, update_user, delete_user
from app.core.deps import require_roles
from app.models.user import UserRole

router = APIRouter(prefix="/api/users", tags=["Users Management"])


@router.get("", response_model=List[UserResponse], dependencies=[Depends(require_roles([UserRole.ADMIN]))])
def list_users(db: Session = Depends(get_db)):
    """List all registered system users (Admin only)."""
    return get_all_users(db)


@router.get("/{user_id}", response_model=UserResponse, dependencies=[Depends(require_roles([UserRole.ADMIN]))])
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get details of a specific user (Admin only)."""
    return get_user_by_id(db, user_id)


@router.put("/{user_id}", response_model=UserResponse, dependencies=[Depends(require_roles([UserRole.ADMIN]))])
def update_user_details(user_id: int, user_in: UserUpdate, db: Session = Depends(get_db)):
    """Update user information/role/password (Admin only)."""
    return update_user(db, user_id, user_in)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_roles([UserRole.ADMIN]))])
def remove_user(user_id: int, db: Session = Depends(get_db)):
    """Delete a user from the system (Admin only)."""
    delete_user(db, user_id)
