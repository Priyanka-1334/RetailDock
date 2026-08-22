from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.services.product_service import get_products, get_product_by_id, create_product, update_product, delete_product
from app.core.deps import get_current_user, require_roles
from app.models.user import UserRole, User

router = APIRouter(prefix="/api/products", tags=["Products"])


@router.get("", response_model=List[ProductResponse])
def list_products(
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    search: Optional[str] = Query(None, description="Search by code, name, or description"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """View products list with optional category filter and search."""
    return get_products(db, category_id=category_id, search=search)


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """View single product details."""
    return get_product_by_id(db, product_id)


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_roles([UserRole.ADMIN]))])
def add_product(prod_in: ProductCreate, db: Session = Depends(get_db)):
    """Create a new product (Admin only)."""
    return create_product(db, prod_in)


@router.put("/{product_id}", response_model=ProductResponse, dependencies=[Depends(require_roles([UserRole.ADMIN]))])
def edit_product(product_id: int, prod_in: ProductUpdate, db: Session = Depends(get_db)):
    """Update product information or prices (Admin only)."""
    return update_product(db, product_id, prod_in)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_roles([UserRole.ADMIN]))])
def remove_product(product_id: int, db: Session = Depends(get_db)):
    """Delete product (Admin only)."""
    delete_product(db, product_id)
