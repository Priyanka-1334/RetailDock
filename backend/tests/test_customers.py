def test_customer_deletion_flow(client):
    # 1. Login as Admin
    admin_login = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Login as Cashier
    cashier_login = client.post("/api/auth/login", json={"username": "cashier", "password": "cashier123"})
    cashier_token = cashier_login.json()["access_token"]
    cashier_headers = {"Authorization": f"Bearer {cashier_token}"}

    # 3. Create a test customer (as Admin)
    create_res = client.post("/api/customers", headers=admin_headers, json={
        "name": "Temp Customer",
        "phone": "9990001111",
        "email": "temp@example.com"
    })
    assert create_res.status_code == 201
    cust_id = create_res.json()["id"]

    # 4. Cashier attempts to DELETE the customer -> Should return 403 Forbidden
    cashier_del_res = client.delete(f"/api/customers/{cust_id}", headers=cashier_headers)
    assert cashier_del_res.status_code == 403

    # 5. Create a bill for this customer so transaction history exists
    bill_res = client.post("/api/bills", headers=admin_headers, json={
        "customer_id": cust_id,
        "items": [{"product_id": 1, "quantity": 1}],
        "payment_method": "CASH"
    })
    assert bill_res.status_code == 201

    # 6. Admin attempts to DELETE customer with transaction history -> Should return 400 Bad Request
    cust_with_bills_res = client.delete(f"/api/customers/{cust_id}", headers=admin_headers)
    assert cust_with_bills_res.status_code == 400
    assert cust_with_bills_res.json()["detail"] == "Customer cannot be deleted because transaction history exists."

    # 7. Create another test customer with NO bills and delete them -> Should return 200 OK
    clean_cust_res = client.post("/api/customers", headers=admin_headers, json={
        "name": "Clean Customer",
        "phone": "9990002222"
    })
    clean_cust_id = clean_cust_res.json()["id"]
    admin_del_res = client.delete(f"/api/customers/{clean_cust_id}", headers=admin_headers)
    assert admin_del_res.status_code == 200
    assert admin_del_res.json()["message"] == "Customer deleted successfully."

    # 8. Admin attempts to DELETE non-existent customer -> Should return 404 Not Found
    notFound_res = client.delete(f"/api/customers/{clean_cust_id}", headers=admin_headers)
    assert notFound_res.status_code == 404
