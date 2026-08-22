from fastapi import APIRouter, Depends, Response, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.report import SalesReport, ProductReport, InventoryReport, ProfitReport
from app.services.report_service import get_sales_report, get_product_report, get_inventory_report, get_profit_report
from app.services.export_service import generate_sales_report_pdf, generate_sales_excel
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/reports", tags=["Reporting & Analytics"])


@router.get("/sales", response_model=SalesReport)
def sales_report(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get real-time sales report (today's sales, monthly sales, daily trend, avg bill value)."""
    return get_sales_report(db)


@router.get("/products", response_model=ProductReport)
def product_report(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get top-selling products and category breakdown analytics."""
    return get_product_report(db)


@router.get("/inventory", response_model=InventoryReport)
def inventory_report(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get inventory status analytics (stock count, low stock, out of stock, cost/retail values)."""
    return get_inventory_report(db)


@router.get("/profit", response_model=ProfitReport)
def profit_report(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get aggregated profit report (Selling Price - Cost Price * Quantity)."""
    return get_profit_report(db)


@router.get("/export/pdf")
def export_pdf_report(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Export executive sales and inventory report in PDF format."""
    sales = get_sales_report(db)
    inv = get_inventory_report(db)
    profit = get_profit_report(db)

    pdf_bytes = generate_sales_report_pdf(sales, inv, profit)
    headers = {
        'Content-Disposition': 'attachment; filename="RetailDock_Business_Report.pdf"'
    }
    return Response(content=pdf_bytes, media_type="application/pdf", headers=headers)


@router.get("/export/excel")
def export_excel_report(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Export daily sales and profit summary report in Excel format."""
    sales = get_sales_report(db)
    profit = get_profit_report(db)
    excel_bytes = generate_sales_excel(sales.daily_breakdown, profit_report=profit)
    headers = {
        'Content-Disposition': 'attachment; filename="RetailDock_Sales_Report.xlsx"'
    }
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers
    )
