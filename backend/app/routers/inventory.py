from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.product import ProductResponse
from app.schemas.inventory_transaction import StockInRequest, StockAdjustRequest, InventoryTransactionResponse
from app.services.product_service import get_low_stock_products, stock_in_product, adjust_stock_product
from app.core.deps import get_current_user, require_roles
from app.models.user import UserRole, User
from app.models.inventory_transaction import InventoryTransaction

router = APIRouter(prefix="/api/inventory", tags=["Inventory Management"])


@router.get("/low-stock", response_model=List[ProductResponse])
def view_low_stock(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get list of products whose quantity <= low_stock_threshold."""
    return get_low_stock_products(db)


@router.post("/stock-in", response_model=ProductResponse, dependencies=[Depends(require_roles([UserRole.ADMIN]))])
def stock_in(req: StockInRequest, db: Session = Depends(get_db)):
    """Restock inventory quantity for a product (Admin only)."""
    return stock_in_product(db, req)


@router.post("/adjust", response_model=ProductResponse, dependencies=[Depends(require_roles([UserRole.ADMIN]))])
def adjust_stock(req: StockAdjustRequest, db: Session = Depends(get_db)):
    """Adjust product stock count with an audit reason (Admin only)."""
    return adjust_stock_product(db, req)


@router.get("/transactions", response_model=List[InventoryTransactionResponse])
def get_inventory_audit_log(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """View complete auditable history of inventory transactions (STOCK_IN, SALE, ADJUSTMENT)."""
    return db.query(InventoryTransaction).order_by(InventoryTransaction.id.desc()).all()
