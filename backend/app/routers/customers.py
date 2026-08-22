from typing import List, Optional
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse
from app.models.customer import Customer
from app.models.bill import Bill
from app.core.deps import require_roles, get_current_user
from app.models.user import User, UserRole

router = APIRouter(prefix="/api/customers", tags=["Customers"])


@router.get("", response_model=List[CustomerResponse])
def list_customers(search: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """List customers with optional search by name or phone."""
    query = db.query(Customer)
    if search:
        query = query.filter(
            (Customer.name.ilike(f"%{search}%")) | (Customer.phone.ilike(f"%{search}%"))
        )
    return query.order_by(Customer.id.desc()).all()


@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(cust_in: CustomerCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Create a new customer profile."""
    if cust_in.phone:
        existing = db.query(Customer).filter(Customer.phone == cust_in.phone).first()
        if existing:
            raise HTTPException(status_code=400, detail="Customer with this phone number already exists")

    customer = Customer(
        name=cust_in.name,
        phone=cust_in.phone,
        email=cust_in.email,
        address=cust_in.address
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(customer_id: int, cust_in: CustomerUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Update customer details."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    for field in ["name", "phone", "email", "address"]:
        val = getattr(cust_in, field)
        if val is not None:
            setattr(customer, field, val)

    db.commit()
    db.refresh(customer)
    return customer


@router.delete("/{customer_id}", status_code=status.HTTP_200_OK, dependencies=[Depends(require_roles([UserRole.ADMIN]))])
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    """Delete a customer profile (Admin only). Safely prevents deletion if transaction history exists."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    # Transaction history check: prevent deletion if customer has existing bills
    has_bills = db.query(Bill).filter(Bill.customer_id == customer_id).first()
    if has_bills:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Customer cannot be deleted because transaction history exists."
        )

    db.delete(customer)
    db.commit()
    return {"message": "Customer deleted successfully."}
