def get_admin_headers(client):
    login = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_list_products(client):
    headers = get_admin_headers(client)
    response = client.get("/api/products", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) > 0


def test_create_and_update_product(client):
    headers = get_admin_headers(client)
    new_prod = {
        "product_code": "TEST-PROD-99",
        "name": "Test Wireless Mouse",
        "category_id": 1,
        "description": "Ergonomic test mouse",
        "cost_price": "500.00",
        "selling_price": "899.00",
        "quantity": 15,
        "low_stock_threshold": 5
    }
    create_res = client.post("/api/products", json=new_prod, headers=headers)
    assert create_res.status_code == 201
    prod_id = create_res.json()["id"]

    # Update product
    update_res = client.put(f"/api/products/{prod_id}", json={"selling_price": "950.00"}, headers=headers)
    assert update_res.status_code == 200
    assert float(update_res.json()["selling_price"]) == 950.00


def test_low_stock_detection(client):
    headers = get_admin_headers(client)
    response = client.get("/api/inventory/low-stock", headers=headers)
    assert response.status_code == 200
    low_stock_items = response.json()
    assert isinstance(low_stock_items, list)
