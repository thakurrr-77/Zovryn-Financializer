from fastapi import FastAPI
from app.db import models
from app.db.database import engine
from app.api.routers import auth, users, roles, records, dashboard

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Zovryan Role-Based API", description="API with user roles and permissions backed by PostgreSQL")

app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(roles.router, prefix="/api")
app.include_router(records.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")

@app.get("/")
def root():
    return {"message": "Welcome to Zovryan Role-Based API. Check /docs for Swagger UI"}
