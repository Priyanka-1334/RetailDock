from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from app.services.product_service import get_categories, create_category, update_category, delete_category
from app.core.deps import get_current_user, require_roles
from app.models.user import UserRole, User

router = APIRouter(prefix="/api/categories", tags=["Categories"])


@router.get("", response_model=List[CategoryResponse])
def list_categories(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """List all categories (Admin & Cashier)."""
    return get_categories(db)


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_roles([UserRole.ADMIN]))])
def add_category(cat_in: CategoryCreate, db: Session = Depends(get_db)):
    """Create a new product category (Admin only)."""
    return create_category(db, cat_in)


@router.put("/{cat_id}", response_model=CategoryResponse, dependencies=[Depends(require_roles([UserRole.ADMIN]))])
def edit_category(cat_id: int, cat_in: CategoryUpdate, db: Session = Depends(get_db)):
    """Update category details (Admin only)."""
    return update_category(db, cat_id, cat_in)


@router.delete("/{cat_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_roles([UserRole.ADMIN]))])
def remove_category(cat_id: int, db: Session = Depends(get_db)):
    """Delete a category (Admin only)."""
    delete_category(db, cat_id)
