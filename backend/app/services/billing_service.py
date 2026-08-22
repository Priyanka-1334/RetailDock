from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.bill import Bill, PaymentMethod, PaymentStatus
from app.models.bill_item import BillItem
from app.models.payment import Payment
from app.models.product import Product
from app.models.customer import Customer
from app.models.user import User
from app.models.inventory_transaction import InventoryTransaction, TransactionType
from app.schemas.bill import BillCreate


def round_decimal(val: Decimal) -> Decimal:
    """Helper to round decimal values to 2 decimal places."""
    return val.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def generate_bill_number(db: Session) -> str:
    """Generate unique invoice bill number formatted as INV-YYYYMMDD-XXXX."""
    today_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    prefix = f"INV-{today_str}-"
    
    latest_bill = db.query(Bill).filter(Bill.bill_number.like(f"{prefix}%")).order_by(Bill.id.desc()).first()
    if latest_bill:
        try:
            seq_num = int(latest_bill.bill_number.split("-")[-1]) + 1
        except ValueError:
            seq_num = 1
    else:
        seq_num = 1
    
    return f"{prefix}{seq_num:04d}"


def create_bill_transaction(db: Session, bill_in: BillCreate, cashier: User) -> Bill:
    """
    ACID Transactional Billing:
    1. Verify products & stock availability
    2. Deduct stock & record inventory transactions
    3. Calculate subtotals, discounts, GST, and final totals with Decimal precision
    4. Save Bill, BillItems, and Payment records
    5. Rollback automatically on any exception
    """
    if not bill_in.items:
        raise HTTPException(status_code=400, detail="Bill must contain at least one item")

    # Validate Customer if provided
    if bill_in.customer_id:
        customer = db.query(Customer).filter(Customer.id == bill_in.customer_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Selected customer not found")

    prepared_items = []
    subtotal_sum = Decimal("0.00")

    try:
        # Step 1: Validate stock & compute item subtotals inside transaction
        for item_req in bill_in.items:
            product = db.query(Product).filter(Product.id == item_req.product_id).with_for_update().first()
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product with ID {item_req.product_id} not found"
                )
            
            if product.quantity < item_req.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for product '{product.name}'. Available: {product.quantity}, Requested: {item_req.quantity}"
                )

            unit_price = Decimal(str(product.selling_price))
            item_subtotal = round_decimal(Decimal(item_req.quantity) * unit_price)
            subtotal_sum += item_subtotal

            prepared_items.append({
                "product": product,
                "quantity": item_req.quantity,
                "unit_price": unit_price,
                "subtotal": item_subtotal
            })

        # Step 2: Financial Calculations
        subtotal = round_decimal(subtotal_sum)
        discount_pct = Decimal(str(bill_in.discount_percentage))
        discount_amount = round_decimal(subtotal * (discount_pct / Decimal("100.00")))
        
        taxable_amount = subtotal - discount_amount
        if taxable_amount < Decimal("0.00"):
            taxable_amount = Decimal("0.00")

        gst_pct = Decimal(str(bill_in.gst_percentage))
        gst_amount = round_decimal(taxable_amount * (gst_pct / Decimal("100.00")))
        
        total_amount = taxable_amount + gst_amount

        bill_number = generate_bill_number(db)

        # Step 3: Create Bill Record
        new_bill = Bill(
            bill_number=bill_number,
            customer_id=bill_in.customer_id,
            cashier_id=cashier.id,
            subtotal=subtotal,
            discount_percentage=discount_pct,
            discount_amount=discount_amount,
            gst_percentage=gst_pct,
            gst_amount=gst_amount,
            total_amount=total_amount,
            payment_method=bill_in.payment_method,
            payment_status=PaymentStatus.PAID
        )
        db.add(new_bill)
        db.flush()  # assign new_bill.id

        # Step 4: Create Bill Items & Reduce Stock Transactionally
        for item in prepared_items:
            product = item["product"]
            qty = item["quantity"]

            bill_item = BillItem(
                bill_id=new_bill.id,
                product_id=product.id,
                quantity=qty,
                unit_price=item["unit_price"],
                subtotal=item["subtotal"]
            )
            db.add(bill_item)

            # Reduce product stock
            product.quantity -= qty

            # Inventory Transaction record
            inv_tx = InventoryTransaction(
                product_id=product.id,
                transaction_type=TransactionType.SALE,
                quantity=-qty,
                reference_id=bill_number
            )
            db.add(inv_tx)

        # Step 5: Record Payment
        payment = Payment(
            bill_id=new_bill.id,
            amount=total_amount,
            payment_method=bill_in.payment_method,
            payment_status=PaymentStatus.PAID,
            transaction_ref=f"PAY-{bill_number}"
        )
        db.add(payment)

        # Commit entire transaction
        db.commit()
        db.refresh(new_bill)
        return new_bill

    except Exception:
        db.rollback()
        raise


def get_bills(
    db: Session,
    customer_id: Optional[int] = None,
    cashier_id: Optional[int] = None,
    search: Optional[str] = None
) -> List[Bill]:
    query = db.query(Bill)
    if customer_id:
        query = query.filter(Bill.customer_id == customer_id)
    if cashier_id:
        query = query.filter(Bill.cashier_id == cashier_id)
    if search:
        query = query.filter(Bill.bill_number.ilike(f"%{search}%"))

    return query.order_by(Bill.id.desc()).all()


def get_bill_by_id(db: Session, bill_id: int) -> Bill:
    bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    return bill
