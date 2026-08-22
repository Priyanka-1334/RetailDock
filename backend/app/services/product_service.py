from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.category import Category
from app.models.product import Product
from app.models.inventory_transaction import InventoryTransaction, TransactionType
from app.schemas.category import CategoryCreate, CategoryUpdate
from app.schemas.product import ProductCreate, ProductUpdate
from app.schemas.inventory_transaction import StockInRequest, StockAdjustRequest


# Category Operations
def get_categories(db: Session) -> List[Category]:
    categories = db.query(Category).all()
    for cat in categories:
        cat.product_count = len(cat.products)
    return categories


def create_category(db: Session, cat_in: CategoryCreate) -> Category:
    existing = db.query(Category).filter(Category.name == cat_in.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category name already exists"
        )
    category = Category(name=cat_in.name, description=cat_in.description)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def update_category(db: Session, cat_id: int, cat_in: CategoryUpdate) -> Category:
    category = db.query(Category).filter(Category.id == cat_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    if cat_in.name is not None and cat_in.name != category.name:
        existing = db.query(Category).filter(Category.name == cat_in.name).first()
        if existing:
            raise HTTPException(status_code=400, detail="Category name already exists")
        category.name = cat_in.name
    
    if cat_in.description is not None:
        category.description = cat_in.description

    db.commit()
    db.refresh(category)
    return category


def delete_category(db: Session, cat_id: int) -> None:
    category = db.query(Category).filter(Category.id == cat_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(category)
    db.commit()


# Product Operations
def get_products(
    db: Session,
    category_id: Optional[int] = None,
    search: Optional[str] = None
) -> List[Product]:
    query = db.query(Product)
    if category_id:
        query = query.filter(Product.category_id == category_id)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_pattern),
                Product.product_code.ilike(search_pattern),
                Product.description.ilike(search_pattern)
            )
        )
    products = query.order_by(Product.name.asc()).all()
    for prod in products:
        prod.is_low_stock = prod.quantity <= prod.low_stock_threshold
    return products


def get_product_by_id(db: Session, product_id: int) -> Product:
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.is_low_stock = product.quantity <= product.low_stock_threshold
    return product


def create_product(db: Session, prod_in: ProductCreate) -> Product:
    existing_code = db.query(Product).filter(Product.product_code == prod_in.product_code).first()
    if existing_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product code '{prod_in.product_code}' already exists"
        )
    
    if prod_in.category_id:
        category = db.query(Category).filter(Category.id == prod_in.category_id).first()
        if not category:
            raise HTTPException(status_code=404, detail="Specified category does not exist")

    product = Product(
        product_code=prod_in.product_code,
        name=prod_in.name,
        category_id=prod_in.category_id,
        description=prod_in.description,
        cost_price=prod_in.cost_price,
        selling_price=prod_in.selling_price,
        quantity=prod_in.quantity,
        low_stock_threshold=prod_in.low_stock_threshold
    )
    db.add(product)
    db.commit()
    db.refresh(product)

    # Initial inventory log if quantity > 0
    if prod_in.quantity > 0:
        tx = InventoryTransaction(
            product_id=product.id,
            transaction_type=TransactionType.STOCK_IN,
            quantity=prod_in.quantity,
            reference_id="INITIAL_STOCK"
        )
        db.add(tx)
        db.commit()

    product.is_low_stock = product.quantity <= product.low_stock_threshold
    return product


def update_product(db: Session, product_id: int, prod_in: ProductUpdate) -> Product:
    product = get_product_by_id(db, product_id)

    if prod_in.product_code is not None and prod_in.product_code != product.product_code:
        existing = db.query(Product).filter(Product.product_code == prod_in.product_code).first()
        if existing:
            raise HTTPException(status_code=400, detail="Product code already in use")
        product.product_code = prod_in.product_code

    if prod_in.category_id is not None:
        if prod_in.category_id != product.category_id:
            cat = db.query(Category).filter(Category.id == prod_in.category_id).first()
            if not cat:
                raise HTTPException(status_code=404, detail="Category not found")
        product.category_id = prod_in.category_id

    for field in ["name", "description", "cost_price", "selling_price", "low_stock_threshold"]:
        val = getattr(prod_in, field)
        if val is not None:
            setattr(product, field, val)

    if prod_in.quantity is not None and prod_in.quantity != product.quantity:
        diff = prod_in.quantity - product.quantity
        product.quantity = prod_in.quantity
        tx_type = TransactionType.STOCK_IN if diff > 0 else TransactionType.ADJUSTMENT
        tx = InventoryTransaction(
            product_id=product.id,
            transaction_type=tx_type,
            quantity=diff,
            reference_id="MANUAL_QUANTITY_UPDATE"
        )
        db.add(tx)

    db.commit()
    db.refresh(product)
    product.is_low_stock = product.quantity <= product.low_stock_threshold
    return product


def delete_product(db: Session, product_id: int) -> None:
    product = get_product_by_id(db, product_id)
    db.delete(product)
    db.commit()


def get_low_stock_products(db: Session) -> List[Product]:
    products = db.query(Product).filter(Product.quantity <= Product.low_stock_threshold).all()
    for prod in products:
        prod.is_low_stock = True
    return products


def stock_in_product(db: Session, req: StockInRequest) -> Product:
    product = get_product_by_id(db, req.product_id)
    product.quantity += req.quantity
    
    tx = InventoryTransaction(
        product_id=product.id,
        transaction_type=TransactionType.STOCK_IN,
        quantity=req.quantity,
        reference_id=req.note or "STOCK_IN"
    )
    db.add(tx)
    db.commit()
    db.refresh(product)
    product.is_low_stock = product.quantity <= product.low_stock_threshold
    return product


def adjust_stock_product(db: Session, req: StockAdjustRequest) -> Product:
    product = get_product_by_id(db, req.product_id)
    new_qty = product.quantity + req.quantity_change
    if new_qty < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Adjustment resulted in negative stock ({new_qty}). Operation denied."
        )

    product.quantity = new_qty
    tx = InventoryTransaction(
        product_id=product.id,
        transaction_type=TransactionType.ADJUSTMENT,
        quantity=req.quantity_change,
        reference_id=req.reason or "ADJUSTMENT"
    )
    db.add(tx)
    db.commit()
    db.refresh(product)
    product.is_low_stock = product.quantity <= product.low_stock_threshold
    return product
