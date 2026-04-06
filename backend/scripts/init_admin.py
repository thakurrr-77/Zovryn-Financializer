import sys
import os
from sqlalchemy.orm import Session

# Add the project root to the python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.db import models
from app.db.database import SessionLocal, engine
from app.core import security

def init_admin():
    db: Session = SessionLocal()
    try:
        # 1. Ensure Roles exist
        role_list = ["Admin", "Analyst", "Viewer"]
        for name in role_list:
            role = db.query(models.Role).filter(models.Role.name == name).first()
            if not role:
                print(f"Creating role: {name}")
                db.add(models.Role(name=name, description=f"{name} Role"))
        db.commit()

        # 2. Check if admin exists
        admin_user = db.query(models.User).filter(models.User.username == "admin").first()
        if not admin_user:
            print("Creating default admin user...")
            hashed_pw = security.get_password_hash("admin123")
            admin_user = models.User(
                username="admin", 
                email="admin@financializer.com", 
                hashed_password=hashed_pw,
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            
            # 3. Assign Admin role
            admin_role = db.query(models.Role).filter(models.Role.name == "Admin").first()
            if admin_role:
                admin_user.roles.append(admin_role)
                db.commit()
            
            # 4. Seed initial records for demonstration
            from datetime import date, timedelta
            print("Seeding demo records for admin...")
            demo_records = [
                models.FinancialRecord(
                    amount=5000.0, type="income", category="Salary", 
                    description="Monthly revenue", owner_id=admin_user.id, 
                    date=date.today(), currency="USD", payment_method="Bank Transfer"
                ),
                models.FinancialRecord(
                    amount=120.0, type="expense", category="Dining", 
                    description="Team lunch", owner_id=admin_user.id, 
                    date=date.today() - timedelta(days=1), currency="USD", payment_method="Credit Card"
                ),
                models.FinancialRecord(
                    amount=45.0, type="expense", category="Transport", 
                    description="Commute", owner_id=admin_user.id, 
                    date=date.today() - timedelta(days=2), currency="USD", payment_method="Cash"
                )
            ]
            db.add_all(demo_records)
            db.commit()
            
            print("Admin user and demo records created successfully! (User: admin, Pwd: admin123)")
        else:
            print("Admin user already exists.")
            
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_admin()
