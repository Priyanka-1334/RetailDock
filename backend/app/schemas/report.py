from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel


class SalesDataPoint(BaseModel):
    date: str
    revenue: Decimal
    bills_count: int


class TopSellingProduct(BaseModel):
    product_id: int
    product_code: str
    product_name: str
    total_quantity_sold: int
    total_revenue: Decimal
    category_name: Optional[str] = None


class CategorySalesSummary(BaseModel):
    category_id: Optional[int]
    category_name: str
    total_sales: Decimal
    items_sold: int


class SalesReport(BaseModel):
    today_sales: Decimal
    monthly_sales: Decimal
    total_revenue: Decimal
    total_bills: int
    average_bill_value: Decimal
    daily_breakdown: List[SalesDataPoint] = []


class ProductReport(BaseModel):
    top_selling: List[TopSellingProduct] = []
    category_breakdown: List[CategorySalesSummary] = []


class InventoryReport(BaseModel):
    total_products: int
    total_stock_count: int
    low_stock_count: int
    out_of_stock_count: int
    total_inventory_cost_value: Decimal
    total_inventory_retail_value: Decimal


class ProfitReport(BaseModel):
    total_revenue: Decimal
    total_cost_of_goods_sold: Decimal
    total_profit: Decimal
    profit_margin_percentage: Decimal
