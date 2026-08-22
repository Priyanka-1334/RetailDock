from datetime import datetime, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, cast, Date
from app.models.bill import Bill
from app.models.bill_item import BillItem
from app.models.product import Product
from app.models.category import Category
from app.schemas.report import (
    SalesReport,
    SalesDataPoint,
    ProductReport,
    TopSellingProduct,
    CategorySalesSummary,
    InventoryReport,
    ProfitReport
)


def round_decimal(val: Decimal) -> Decimal:
    if val is None:
        return Decimal("0.00")
    return Decimal(str(val)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def get_sales_report(db: Session) -> SalesReport:
    now = datetime.now(timezone.utc)
    today_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
    month_start = datetime(now.year, now.month, 1, tzinfo=timezone.utc)

    # Today's Sales
    today_sales_res = db.query(func.sum(Bill.total_amount)).filter(Bill.created_at >= today_start).scalar()
    today_sales = round_decimal(today_sales_res)

    # Monthly Sales
    monthly_sales_res = db.query(func.sum(Bill.total_amount)).filter(Bill.created_at >= month_start).scalar()
    monthly_sales = round_decimal(monthly_sales_res)

    # Total Revenue & Bill Count
    total_rev_res = db.query(func.sum(Bill.total_amount)).scalar()
    total_revenue = round_decimal(total_rev_res)

    total_bills = db.query(func.count(Bill.id)).scalar() or 0

    average_bill_value = round_decimal(total_revenue / Decimal(total_bills)) if total_bills > 0 else Decimal("0.00")

    # Daily breakdown for last 30 days
    start_30_days = today_start - timedelta(days=29)
    
    # Query grouped by date
    daily_query = db.query(
        cast(Bill.created_at, Date).label("sale_date"),
        func.sum(Bill.total_amount).label("daily_revenue"),
        func.count(Bill.id).label("daily_count")
    ).filter(Bill.created_at >= start_30_days).group_by(cast(Bill.created_at, Date)).all()

    daily_dict = {row.sale_date.strftime("%Y-%m-%d"): row for row in daily_query}

    daily_breakdown = []
    for i in range(30):
        dt = start_30_days + timedelta(days=i)
        dt_str = dt.strftime("%Y-%m-%d")
        if dt_str in daily_dict:
            row = daily_dict[dt_str]
            daily_breakdown.append(SalesDataPoint(
                date=dt_str,
                revenue=round_decimal(row.daily_revenue),
                bills_count=row.daily_count
            ))
        else:
            daily_breakdown.append(SalesDataPoint(
                date=dt_str,
                revenue=Decimal("0.00"),
                bills_count=0
            ))

    return SalesReport(
        today_sales=today_sales,
        monthly_sales=monthly_sales,
        total_revenue=total_revenue,
        total_bills=total_bills,
        average_bill_value=average_bill_value,
        daily_breakdown=daily_breakdown
    )


def get_product_report(db: Session) -> ProductReport:
    # Top 10 Selling Products
    top_query = db.query(
        BillItem.product_id,
        Product.product_code,
        Product.name.label("product_name"),
        Category.name.label("category_name"),
        func.sum(BillItem.quantity).label("total_qty"),
        func.sum(BillItem.subtotal).label("total_rev")
    ).join(Product, BillItem.product_id == Product.id)\
     .outerjoin(Category, Product.category_id == Category.id)\
     .group_by(BillItem.product_id, Product.product_code, Product.name, Category.name)\
     .order_by(desc("total_qty"))\
     .limit(10).all()

    top_selling = [
        TopSellingProduct(
            product_id=row.product_id,
            product_code=row.product_code or "N/A",
            product_name=row.product_name,
            total_quantity_sold=row.total_qty or 0,
            total_revenue=round_decimal(row.total_rev),
            category_name=row.category_name or "Uncategorized"
        )
        for row in top_query
    ]

    # Category Sales Breakdown
    cat_query = db.query(
        Category.id.label("category_id"),
        Category.name.label("category_name"),
        func.sum(BillItem.subtotal).label("total_sales"),
        func.sum(BillItem.quantity).label("items_sold")
    ).join(Product, BillItem.product_id == Product.id)\
     .join(Category, Product.category_id == Category.id)\
     .group_by(Category.id, Category.name)\
     .all()

    category_breakdown = [
        CategorySalesSummary(
            category_id=row.category_id,
            category_name=row.category_name,
            total_sales=round_decimal(row.total_sales),
            items_sold=row.items_sold or 0
        )
        for row in cat_query
    ]

    return ProductReport(
        top_selling=top_selling,
        category_breakdown=category_breakdown
    )


def get_inventory_report(db: Session) -> InventoryReport:
    products = db.query(Product).all()

    total_products = len(products)
    total_stock_count = sum(p.quantity for p in products)
    low_stock_count = sum(1 for p in products if p.quantity <= p.low_stock_threshold)
    out_of_stock_count = sum(1 for p in products if p.quantity == 0)

    total_cost_val = sum(Decimal(p.quantity) * Decimal(str(p.cost_price)) for p in products)
    total_retail_val = sum(Decimal(p.quantity) * Decimal(str(p.selling_price)) for p in products)

    return InventoryReport(
        total_products=total_products,
        total_stock_count=total_stock_count,
        low_stock_count=low_stock_count,
        out_of_stock_count=out_of_stock_count,
        total_inventory_cost_value=round_decimal(total_cost_val),
        total_inventory_retail_value=round_decimal(total_retail_val)
    )


def get_profit_report(db: Session) -> ProfitReport:
    """
    Calculate profit & margin using transparent business rules:
    - Revenue: Sum of final paid bill grand totals (Bill.total_amount)
    - COGS: Sum of (BillItem.quantity * Product.cost_price)
    - Profit: Revenue - COGS
    - Profit Margin: (Profit / Revenue) * 100
    """
    # 1. Total Revenue from final paid bills
    total_rev_res = db.query(func.sum(Bill.total_amount)).scalar()
    total_revenue = round_decimal(total_rev_res)

    # 2. Total COGS from bill items
    cogs_res = db.query(
        func.sum(BillItem.quantity * Product.cost_price)
    ).join(Product, BillItem.product_id == Product.id).scalar()
    total_cogs = round_decimal(cogs_res)

    # 3. Gross/Net Profit = Revenue - COGS
    total_profit = round_decimal(total_revenue - total_cogs)

    # 4. Profit Margin = (Profit / Revenue) * 100
    if total_revenue > Decimal("0.00"):
        margin = round_decimal((total_profit / total_revenue) * Decimal("100.00"))
    else:
        margin = Decimal("0.00")

    return ProfitReport(
        total_revenue=total_revenue,
        total_cost_of_goods_sold=total_cogs,
        total_profit=total_profit,
        profit_margin_percentage=margin
    )
