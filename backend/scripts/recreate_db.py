import sys
import os

# Add the project root to the python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.db.database import engine, Base
from app.db import models

def recreate_db():
    print("Dropping all existing tables...")
    Base.metadata.drop_all(bind=engine)
    print("Creating all tables based on current models...")
    Base.metadata.create_all(bind=engine)
    print("Database schema successfully recreated!")

if __name__ == "__main__":
    recreate_db()
