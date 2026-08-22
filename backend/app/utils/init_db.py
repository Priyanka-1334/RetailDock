import logging
from decimal import Decimal
from sqlalchemy.orm import Session
from app.database.session import Base, engine
from app.models.user import User, UserRole
from app.models.category import Category
from app.models.product import Product
from app.models.customer import Customer
from app.models.inventory_transaction import InventoryTransaction, TransactionType
from app.core.security import get_password_hash

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("RetailDockInit")


def init_db(db: Session) -> None:
    """Create tables and populate initial seed data if empty."""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")

    # 1. Seed Admin User
    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        admin = User(
            username="admin",
            password_hash=get_password_hash("admin123"),
            role=UserRole.ADMIN,
            full_name="System Administrator",
            email="admin@retaildock.io",
            is_active=True
        )
        db.add(admin)
        logger.info("Seeded initial Admin user ('admin' / 'admin123').")

    # 2. Seed Cashier User
    cashier = db.query(User).filter(User.username == "cashier").first()
    if not cashier:
        cashier = User(
            username="cashier",
            password_hash=get_password_hash("cashier123"),
            role=UserRole.CASHIER,
            full_name="Primary Cashier",
            email="cashier@retaildock.io",
            is_active=True
        )
        db.add(cashier)
        logger.info("Seeded initial Cashier user ('cashier' / 'cashier123').")

    db.commit()

    # 3. Seed Categories
    existing_cat_count = db.query(Category).count()
    if existing_cat_count == 0:
        categories_data = [
            ("Electronics", "Gadgets, appliances, and electronic accessories"),
            ("Grocery & Food", "Staple food items, grains, and kitchen supplies"),
            ("Dairy & Fresh", "Fresh milk, cheese, butter, and daily consumables"),
            ("Apparel & Fashion", "Clothing, shoes, and wearable items"),
            ("Home & Living", "Home decor, cookware, and domestic utilities"),
        ]
        cat_map = {}
        for name, desc in categories_data:
            cat = Category(name=name, description=desc)
            db.add(cat)
            db.flush()
            cat_map[name] = cat.id
        db.commit()
        logger.info("Seeded 5 initial categories.")

        # 4. Seed Sample Products
        products_data = [
            ("ELEC-001", "4K Ultra HD Smart TV 55\"", cat_map["Electronics"], "55-inch 4K HDR Smart LED Television", Decimal("32000.00"), Decimal("45000.00"), 12, 3),
            ("ELEC-002", "Wireless Noise Canceling Earbuds", cat_map["Electronics"], "Bluetooth 5.3 earbuds with active noise cancellation", Decimal("2500.00"), Decimal("4999.00"), 25, 5),
            ("GROC-001", "Premium Basmati Rice 5kg", cat_map["Grocery & Food"], "Long grain aromatic basmati rice pack", Decimal("450.00"), Decimal("650.00"), 40, 10),
            ("GROC-002", "Organic Extra Virgin Olive Oil 1L", cat_map["Grocery & Food"], "Cold-pressed extra virgin olive oil bottle", Decimal("700.00"), Decimal("990.00"), 18, 5),
            ("DAIR-001", "Full Cream Fresh Milk 1L", cat_map["Dairy & Fresh"], "Pasteurized whole milk pouch", Decimal("50.00"), Decimal("66.00"), 50, 15),
            ("DAIR-002", "Artisanal Cheddar Cheese 200g", cat_map["Dairy & Fresh"], "Aged cheddar cheese block", Decimal("180.00"), Decimal("275.00"), 8, 10),  # Low stock test
            ("APPA-001", "Classic Cotton Crewneck T-Shirt", cat_map["Apparel & Fashion"], "100% combed cotton breathable t-shirt", Decimal("350.00"), Decimal("799.00"), 30, 8),
            ("HOME-001", "Non-Stick Cookware Set 3Pcs", cat_map["Home & Living"], "Induction friendly ceramic coated cookware set", Decimal("1400.00"), Decimal("2499.00"), 4, 5),  # Low stock test
        ]

        for code, name, cat_id, desc, cost, sell, qty, low_thresh in products_data:
            prod = Product(
                product_code=code,
                name=name,
                category_id=cat_id,
                description=desc,
                cost_price=cost,
                selling_price=sell,
                quantity=qty,
                low_stock_threshold=low_thresh
            )
            db.add(prod)
            db.flush()

            # Record initial inventory stock-in transaction
            tx = InventoryTransaction(
                product_id=prod.id,
                transaction_type=TransactionType.STOCK_IN,
                quantity=qty,
                reference_id="SEED_INITIAL_STOCK"
            )
            db.add(tx)

        db.commit()
        logger.info("Seeded 8 initial sample products with inventory logs.")

    # 5. Seed Sample Customers
    existing_cust_count = db.query(Customer).count()
    if existing_cust_count == 0:
        customers_data = [
            ("Alice Johnson", "9876543210", "alice@example.com", "123 Main Street, Suite 4B"),
            ("Bob Smith", "9876543211", "bob@example.com", "456 Oak Avenue, West End"),
            ("Carol Williams", "9876543212", "carol@example.com", "789 Pine Road, City Center")
        ]
        for name, phone, email, addr in customers_data:
            cust = Customer(name=name, phone=phone, email=email, address=addr)
            db.add(cust)
        db.commit()
        logger.info("Seeded 3 sample customers.")
