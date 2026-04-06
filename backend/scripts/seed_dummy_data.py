import sys
import os
import random
from datetime import date, timedelta
from sqlalchemy.orm import Session

# Add the project root to the python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.db import models
from app.db.database import SessionLocal
from app.core import security

def get_or_create_role(db: Session, name: str, description: str):
    role = db.query(models.Role).filter(models.Role.name == name).first()
    if not role:
        role = models.Role(name=name, description=description)
        db.add(role)
        db.commit()
        db.refresh(role)
    return role

def seed_data():
    db: Session = SessionLocal()
    try:
        print("Starting dummy data seed...")

        # 1. Ensure Roles
        admin_role = get_or_create_role(db, "Admin", "Admin Role")
        analyst_role = get_or_create_role(db, "Analyst", "Analyst Role")
        viewer_role = get_or_create_role(db, "Viewer", "Viewer Role")

        # 2. Define our demo users
        user_configs = [
            {"username": "admin_demo", "email": "admin_demo@financializer.com", "password": "AdminPass123!", "role": admin_role},
            {"username": "analyst_user", "email": "analyst@financializer.com", "password": "AnalystSecure456", "role": analyst_role},
            {"username": "standard_viewer", "email": "viewer@financializer.com", "password": "ViewerBasic789", "role": viewer_role},
        ]

        created_users = []

        # 3. Create Users
        for cfg in user_configs:
            user = db.query(models.User).filter(models.User.username == cfg["username"]).first()
            if not user:
                print(f"Creating user {cfg['username']}...")
                user = models.User(
                    username=cfg["username"],
                    email=cfg["email"],
                    hashed_password=security.get_password_hash(cfg["password"]),
                    is_active=True
                )
                db.add(user)
                db.commit()
                db.refresh(user)

                # Assign role
                if cfg["role"] not in user.roles:
                    user.roles.append(cfg["role"])
                    db.commit()
            
            created_users.append(user)

        # 4. Create Dummy Financial Records
        print("Generating dummy financial records...")
        categories_income = ["Salary", "Freelance", "Investment Returns", "Bonus"]
        categories_expense = ["Groceries", "Rent", "Utilities", "Dining out", "Transportation", "Software Subs"]
        payment_methods = ["Credit Card", "Debit Card", "Bank Transfer", "Cash", "PayPal"]
        
        today = date.today()
        
        # We'll create exactly 15 records per user so the dashboards look populated.
        for user in created_users:
            records = db.query(models.FinancialRecord).filter(models.FinancialRecord.owner_id == user.id).count()
            if records >= 15:
                print(f"User {user.username} already has records. Skipping.")
                continue
                
            print(f"Creating records for user {user.username}...")
            to_insert = []
            for i in range(15):
                # Randomize if it's income or expense (let's make mostly expenses, some income)
                is_income = random.random() < 0.3 
                trans_type = "income" if is_income else "expense"
                
                # Random amount (e.g. income is higher, expenses are lower)
                amount = round(random.uniform(1500, 6000), 2) if is_income else round(random.uniform(20, 800), 2)
                
                # Random category and description
                category = random.choice(categories_income) if is_income else random.choice(categories_expense)
                desc = f"Demo {trans_type} for {category}"
                
                # Assign a random date in the last complete 60 days
                record_date = today - timedelta(days=random.randint(0, 60))
                
                record = models.FinancialRecord(
                    amount=amount,
                    type=trans_type,
                    category=category,
                    date=record_date,
                    description=desc,
                    currency="USD",
                    payment_method=random.choice(payment_methods),
                    tags="demo",
                    owner_id=user.id
                )
                to_insert.append(record)
                
            db.add_all(to_insert)
            db.commit()

        print("Database successfully seeded with demo users and records!")

    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
