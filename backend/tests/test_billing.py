def get_cashier_headers(client):
    login = client.post("/api/auth/login", json={"username": "cashier", "password": "cashier123"})
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_billing_checkout_and_stock_reduction(client):
    headers = get_cashier_headers(client)

    # Get initial product
    prod_res = client.get("/api/products/1", headers=headers)
    initial_prod = prod_res.json()
    initial_qty = initial_prod["quantity"]

    bill_payload = {
        "customer_id": 1,
        "items": [
            {"product_id": 1, "quantity": 2}
        ],
        "discount_percentage": "10.00",
        "gst_percentage": "18.00",
        "payment_method": "CASH"
    }

    checkout_res = client.post("/api/bills", json=bill_payload, headers=headers)
    assert checkout_res.status_code == 201
    bill_data = checkout_res.json()
    assert bill_data["payment_status"] == "PAID"
    assert "bill_number" in bill_data

    # Verify product stock reduction
    updated_prod_res = client.get("/api/products/1", headers=headers)
    assert updated_prod_res.json()["quantity"] == initial_qty - 2


def test_insufficient_stock_prevention(client):
    headers = get_cashier_headers(client)
    bill_payload = {
        "items": [
            {"product_id": 1, "quantity": 999999}  # Exceeds available stock
        ],
        "discount_percentage": "0.00",
        "gst_percentage": "0.00",
        "payment_method": "CASH"
    }
    response = client.post("/api/bills", json=bill_payload, headers=headers)
    assert response.status_code == 400
    assert "Insufficient stock" in response.json()["detail"]


def test_pdf_invoice_download(client):
    headers = get_cashier_headers(client)
    # Create bill first
    bill_payload = {
        "items": [{"product_id": 2, "quantity": 1}],
        "discount_percentage": "0.00",
        "gst_percentage": "5.00",
        "payment_method": "UPI"
    }
    create_res = client.post("/api/bills", json=bill_payload, headers=headers)
    bill_id = create_res.json()["id"]

    pdf_res = client.get(f"/api/bills/{bill_id}/invoice", headers=headers)
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert len(pdf_res.content) > 0
