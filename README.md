# RetailDock: Containerized Inventory and Billing Management System

[![Architecture](https://img.shields.io/badge/Architecture-FastAPI%20%7C%20React%20%7C%20PostgreSQL-blue)](#2-architecture)
[![Docker Compose](https://img.shields.io/badge/Deployment-Docker%20Compose-emerald)](#10-docker-setup)

**RetailDock** is an enterprise-grade full-stack containerized web application designed for retail store inventory management, POS billing, invoicing, user access control, and real-time business analytics.

---

## 1. Project Overview

RetailDock provides an end-to-end retail workflow:
- **Authentication & RBAC**: Dual-role system (`ADMIN` and `CASHIER`) secured with bcrypt password hashing and JWT authorization.
- **Inventory Management**: Product catalog, category management, stock tracking, and low-stock alerts.
- **Auditable Stock Transactions**: Every stock adjustment (`STOCK_IN`, `SALE`, `ADJUSTMENT`) is logged in an audit history table.
- **POS Billing & Automated Invoicing**: Real-time POS checkout terminal with product search, cart controls, customer association, Decimal monetary calculations for discount & GST, transactional stock reduction, and PDF invoice generation via ReportLab.
- **Executive Analytics & Reporting**: Real-time sales metrics, daily/monthly revenue trends, category breakdown, net profit calculations (`(selling_price - cost_price) * qty`), interactive Recharts, and PDF/Excel report exports.
- **Docker Compose Orchestration**: Single-command production-ready deployment orchestrating PostgreSQL 15, FastAPI, and Vite/React.

---

## 2. Architecture

```
React Frontend (Vite / SPA)
       ↓ (REST APIs with JWT)
FastAPI REST API (Python 3.11)
       ↓ (SQLAlchemy ORM)
PostgreSQL 15 Database
```

Docker Compose manages three isolated containers:
1. `retaildock_postgres`: Persistent PostgreSQL database with volume storage.
2. `retaildock_backend`: FastAPI REST API server exposing endpoints, handling ACID transactions, and serving PDF/Excel exports.
3. `retaildock_frontend`: Nginx web server rendering the React single-page application.

---

## 3. Technology Stack

### Frontend
- **Framework**: React 18 + Vite
- **Router**: React Router DOM v6
- **HTTP Client**: Axios with JWT request/response interceptors & auto session timeout handling
- **Visualization**: Recharts (Area charts, Pie charts)
- **Icons**: Lucide React
- **Styling**: Vanilla CSS system (Dark/Light glassmorphism theme, CSS variables)

### Backend
- **Framework**: FastAPI (Python 3.11)
- **Database ORM**: SQLAlchemy 2.0
- **Validation**: Pydantic v2 (Decimal monetary safety)
- **Security**: JWT (`python-jose`) + bcrypt password hashing (`passlib`)
- **Reporting & Exports**: `ReportLab` (PDF generation), `openpyxl` & `pandas` (Excel export)
- **Testing**: Pytest + HTTPX TestClient

### Database
- **Database Engine**: PostgreSQL 15

### Deployment
- Docker & Docker Compose

---

## 4. Project Structure

```
RetailDock/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI application entry point & health check
│   │   ├── core/                    # Security, JWT tokens, RBAC dependencies, settings
│   │   ├── database/                # SQLAlchemy database session & engine configuration
│   │   ├── models/                  # User, Category, Product, Customer, Bill, BillItem, Payment, InventoryTransaction
│   │   ├── schemas/                 # Pydantic request/response validation schemas
│   │   ├── services/                # Business logic: Auth, Product, Billing, Reports, PDF/Excel Exports
│   │   ├── routers/                 # REST API endpoints (auth, users, categories, products, inventory, bills, reports)
│   │   └── utils/                   # Database initialization & seed scripts
│   ├── tests/                       # Pytest automated test suite
│   ├── requirements.txt             # Python dependencies
│   ├── Dockerfile                   # Backend Docker container manifest
│   └── .env.example                 # Backend environment template
│
├── frontend/
│   ├── src/
│   │   ├── components/              # Sidebar, Navbar, StatCard, Toast notifications, Layout
│   │   ├── context/                 # AuthContext (JWT management, role checks, login/logout)
│   │   ├── pages/                   # Login, Dashboard, Products, Categories, Inventory, Billing, BillsHistory, Customers, Reports, Users, Profile
│   │   ├── routes/                  # AppRoutes & ProtectedRoute RBAC guards
│   │   ├── services/                # Axios API instance with interceptors
│   │   ├── index.css                # CSS design system & utility classes
│   │   ├── main.jsx                 # React root render
│   │   └── App.jsx                  # Main application router shell
│   ├── package.json                 # Frontend dependencies
│   ├── vite.config.js               # Vite build & proxy settings
│   ├── Dockerfile                   # Frontend Nginx Docker container manifest
│   └── .env.example                 # Frontend environment template
│
├── database/
│   └── init.sql                     # Initial PostgreSQL setup script
│
├── docker-compose.yml               # Multi-container Docker Compose orchestration file
├── .gitignore                       # Git ignore file
└── README.md                        # Documentation
```

---

## 5. Database Schema & Entities

- **`users`**: `id`, `username`, `password_hash`, `role` (`ADMIN`, `CASHIER`), `full_name`, `email`, `is_active`, `created_at`.
- **`categories`**: `id`, `name`, `description`, `created_at`.
- **`products`**: `id`, `product_code`, `name`, `category_id`, `description`, `cost_price` (`Numeric(12,2)`), `selling_price` (`Numeric(12,2)`), `quantity`, `low_stock_threshold`, `created_at`, `updated_at`.
- **`customers`**: `id`, `name`, `phone`, `email`, `address`, `created_at`.
- **`bills`**: `id`, `bill_number`, `customer_id`, `cashier_id`, `subtotal`, `discount_percentage`, `discount_amount`, `gst_percentage`, `gst_amount`, `total_amount`, `payment_method` (`CASH`, `UPI`, `CARD`), `payment_status` (`PAID`, `PENDING`), `created_at`.
- **`bill_items`**: `id`, `bill_id`, `product_id`, `quantity`, `unit_price` (Sale-time historical unit price), `subtotal`.
- **`payments`**: `id`, `bill_id`, `amount`, `payment_method`, `transaction_ref`, `payment_status`, `created_at`.
- **`inventory_transactions`**: `id`, `product_id`, `transaction_type` (`STOCK_IN`, `SALE`, `ADJUSTMENT`), `quantity`, `reference_id`, `created_at`.

---

## 6. Default Development Accounts

On first launch, RetailDock automatically populates initial demonstration accounts and seed products:

| Role | Username | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Full access: User management, Product catalog, Inventory audit, Billing, Analytics, Exports |
| **Cashier** | `cashier` | `cashier123` | Operational access: POS Billing checkout, Catalog view, Invoice history, Customer directory |

---

## 7. Running the Application via Docker Compose

### Prerequisites
- Docker Desktop (or Docker Engine + Docker Compose)

### Quick Start Command

From the root directory of `RetailDock`:

```bash
docker compose up --build
```

This single command will:
1. Spin up PostgreSQL on port `5432` with automatic health checks.
2. Build and start the FastAPI Backend on `http://localhost:8000`.
3. Build and serve the React Frontend on `http://localhost:3000`.
4. Create database tables and seed initial sample data automatically.

### Accessing Services

- **Web UI**: Open [http://localhost:3000](http://localhost:3000)
- **FastAPI OpenAPI Swagger Documentation**: Open [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check Endpoint**: Open [http://localhost:8000/health](http://localhost:8000/health)

### Stopping the Application

```bash
docker compose down
```

To remove persistent volumes as well:
```bash
docker compose down -v
```

---

## 8. Local Development Setup (Without Docker)

### Backend Setup

1. Navigate to `backend`:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # Linux/macOS:
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
5. Run FastAPI server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### Frontend Setup

1. Navigate to `frontend`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run Vite dev server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 9. Running Backend Tests

RetailDock includes automated tests covering authentication, RBAC authorization, product catalog, stock validation, ACID transactional billing, and report generation.

Run tests using Pytest:

```bash
cd backend
.venv\Scripts\python -m pytest -v
```

---

## 10. Key Business & Security Rules

1. **Password Protection**: Passwords are saved exclusively as bcrypt hashes; raw passwords are never stored or returned in API responses.
2. **Decimal Financial Accuracy**: All prices, discounts, GST, and totals use SQL `Numeric` and Python `Decimal` data types.
3. **Transactional Integrity**: POS billing operations execute within database transactions. Stock is locked, verified, deducted, and logged atomically. If any item has insufficient stock, the entire transaction rolls back.
4. **Historical Price Preservation**: `bill_items` saves the exact `unit_price` at the moment of sale so historical invoices remain accurate even if product prices change later.
5. **Real Database Reporting**: Analytics metrics and profit calculations (`Selling Price - Cost Price`) reflect actual database records dynamically.
6. **No Secret Leaks**: All credentials and secret keys are configurable via environment variables; real secrets are excluded from Git repository tracking via `.gitignore`.
