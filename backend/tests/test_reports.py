from decimal import Decimal


def get_admin_headers(client):
    login = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_sales_and_inventory_reports(client):
    headers = get_admin_headers(client)

    sales_res = client.get("/api/reports/sales", headers=headers)
    assert sales_res.status_code == 200
    sales_data = sales_res.json()
    assert "today_sales" in sales_data
    assert "daily_breakdown" in sales_data

    inv_res = client.get("/api/reports/inventory", headers=headers)
    assert inv_res.status_code == 200
    inv_data = inv_res.json()
    assert "total_products" in inv_data
    assert "low_stock_count" in inv_data

    profit_res = client.get("/api/reports/profit", headers=headers)
    assert profit_res.status_code == 200
    profit_data = profit_res.json()
    assert "total_profit" in profit_data
    
    # Mathematical consistency checks
    rev = Decimal(str(profit_data["total_revenue"]))
    cogs = Decimal(str(profit_data["total_cost_of_goods_sold"]))
    profit = Decimal(str(profit_data["total_profit"]))
    margin = Decimal(str(profit_data["profit_margin_percentage"]))

    assert profit == rev - cogs
    if rev > 0:
        expected_margin = round((profit / rev) * Decimal("100.00"), 2)
        assert margin == expected_margin


def test_report_export_pdf_and_excel(client):
    headers = get_admin_headers(client)

    pdf_res = client.get("/api/reports/export/pdf", headers=headers)
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"

    excel_res = client.get("/api/reports/export/excel", headers=headers)
    assert excel_res.status_code == 200
    assert "spreadsheetml" in excel_res.headers["content-type"]
