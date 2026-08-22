from typing import List, Optional
from fastapi import APIRouter, Depends, status, Response
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.bill import BillCreate, BillResponse
from app.services.billing_service import create_bill_transaction, get_bills, get_bill_by_id
from app.services.export_service import generate_invoice_pdf
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/bills", tags=["Billing & Invoices"])


@router.post("", response_model=BillResponse, status_code=status.HTTP_201_CREATED)
def checkout_bill(
    bill_in: BillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    POS Checkout:
    - Validates product availability & stock
    - Deducts stock transactionally
    - Calculates subtotal, discount, GST, and grand total with Decimal precision
    - Creates Bill, BillItems, and Payment records atomically
    """
    return create_bill_transaction(db, bill_in, cashier=current_user)


@router.get("", response_model=List[BillResponse])
def list_bills(
    customer_id: Optional[int] = None,
    cashier_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List bill/invoice history with optional filters."""
    return get_bills(db, customer_id=customer_id, cashier_id=cashier_id, search=search)


@router.get("/{bill_id}", response_model=BillResponse)
def get_bill(bill_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get single bill details."""
    return get_bill_by_id(db, bill_id)


@router.get("/{bill_id}/invoice")
def download_invoice_pdf(bill_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Generate and download PDF Invoice document for a bill."""
    bill = get_bill_by_id(db, bill_id)
    pdf_bytes = generate_invoice_pdf(bill)
    
    headers = {
        'Content-Disposition': f'attachment; filename="Invoice_{bill.bill_number}.pdf"'
    }
    return Response(content=pdf_bytes, media_type="application/pdf", headers=headers)
