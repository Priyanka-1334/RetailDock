def test_login_success(client):
    response = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["username"] == "admin"
    assert data["user"]["role"] == "ADMIN"


def test_login_invalid_password(client):
    response = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "wrongpassword"
    })
    assert response.status_code == 401


def test_register_and_role_protection(client):
    # Register new cashier
    reg_response = client.post("/api/auth/register", json={
        "username": "new_cashier",
        "password": "password123",
        "role": "CASHIER",
        "full_name": "New Cashier Person"
    })
    assert reg_response.status_code == 201

    # Login as new cashier
    login_response = client.post("/api/auth/login", json={
        "username": "new_cashier",
        "password": "password123"
    })
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Cashier attempts admin-only /api/users endpoint
    users_response = client.get("/api/users", headers=headers)
    assert users_response.status_code == 403

    # Login as admin
    admin_login = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Admin accesses /api/users endpoint successfully
    admin_users_response = client.get("/api/users", headers=admin_headers)
    assert admin_users_response.status_code == 200
    assert len(admin_users_response.json()) >= 2
