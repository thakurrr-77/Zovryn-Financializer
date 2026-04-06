import sys
import os
import argparse
from sqlalchemy.orm import Session

# Add the project root to the python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.db import models
from app.db.database import SessionLocal
from app.core import security

def create_admin(username, email, password):
    db: Session = SessionLocal()
    try:
        # 1. Ensure Admin role exists
        admin_role = db.query(models.Role).filter(models.Role.name == "Admin").first()
        if not admin_role:
            print("Admin role missing. Creating now...")
            admin_role = models.Role(name="Admin", description="Administrator Role")
            db.add(admin_role)
            db.commit()
            db.refresh(admin_role)

        # 2. Check for existing user
        user = db.query(models.User).filter(models.User.username == username).first()
        if user:
            print(f"User '{username}' already exists. Updating to Admin status...")
        else:
            print(f"Creating new Admin user: {username}")
            user = models.User(username=username, email=email, hashed_password=security.get_password_hash(password))
            db.add(user)
            db.commit()
            db.refresh(user)

        if admin_role not in user.roles:
            user.roles.append(admin_role)
            db.commit()
        
        print(f"Successfully configured '{username}' as Admin.")
            
    except Exception as e:
        print(f"Failed to create admin: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Financializer: Create a new Admin user.")
    parser.add_argument("--user", required=True, help="Username")
    parser.add_argument("--email", required=True, help="Email address")
    parser.add_argument("--pwd", required=True, help="Password")
    
    args = parser.parse_args()
    create_admin(args.user, args.email, args.pwd)
