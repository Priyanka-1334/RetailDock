import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.config import settings
from app.database.session import SessionLocal, get_db
from app.utils.init_db import init_db
from app.routers import (
    auth,
    users,
    categories,
    products,
    inventory,
    customers,
    bills,
    reports,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("RetailDockMain")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifespan context manager."""
    logger.info("Initializing database and seed data on startup...")
    db = SessionLocal()
    try:
        init_db(db)
    except Exception as e:
        logger.error(f"Failed to initialize database on startup: {e}")
    finally:
        db.close()
    yield
    logger.info("Application shutting down...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Containerized Inventory and POS Billing Management System REST API",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS Middleware
origins = settings.get_cors_origins_list()
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(categories.router)
app.include_router(products.router)
app.include_router(inventory.router)
app.include_router(customers.router)
app.include_router(bills.router)
app.include_router(reports.router)


@app.get("/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint verifying FastAPI application and PostgreSQL DB connectivity.
    """
    try:
        # Execute test query to check DB connectivity
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"disconnected: {str(e)}"
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database unhealthy: {db_status}"
        )

    return {
        "status": "healthy",
        "app_name": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "database": db_status
    }


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to RetailDock API",
        "docs_url": "/docs",
        "health_url": "/health"
    }
