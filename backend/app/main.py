from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import time
from app.db import models
from app.db.database import engine, SessionLocal
from app.api.routers import auth, users, roles, records, dashboard
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.responses import JSONResponse

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("financializer")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    On startup: ensures DB tables exist and seeds the three base roles.
    Wrapped in try/except so test environments (SQLite/no-DB) don't crash.
    """
    try:
        # Create all tables if they don't exist (idempotent)
        models.Base.metadata.create_all(bind=engine)

        db = SessionLocal()
        try:
            # 1. Seed Roles
            for name in ["Admin", "Analyst", "Viewer"]:
                if not db.query(models.Role).filter(models.Role.name == name).first():
                    db.add(models.Role(name=name, description=f"{name} Role"))
            db.commit()

            # 2. Seed Default Application Data (Aggressive Check)
            user_count = db.query(models.User).count()
            record_count = db.query(models.FinancialRecord).count()
            
            if user_count == 0 or record_count == 0:
                try:
                    from scripts.seed_dummy_data import seed_data
                    seed_data()
                    logger.info(f"Seeding completed (Users: {user_count}, Records: {record_count})")
                    
                    # Ensure fallback admin/admin123 exists
                    if not db.query(models.User).filter(models.User.username == "admin").first():
                        from app.core.security import get_password_hash
                        admin_role = db.query(models.Role).filter(models.Role.name == "Admin").first()
                        if admin_role:
                            new_admin = models.User(
                                username="admin",
                                email="admin@financializer.com",
                                hashed_password=get_password_hash("admin123"),
                                is_active=True
                            )
                            new_admin.roles.append(admin_role)
                            db.add(new_admin)
                            db.commit()
                            logger.info("Created fallback admin account (admin/admin123)")
                except Exception as seed_err:
                    logger.error(f"Seeding failed: {seed_err}")
        finally:
            db.close()
    except Exception as e:
        logger.warning(f"Startup DB initialization skipped or failed: {e}")

    yield  # Application is running

limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

app = FastAPI(
    title="Financializer Role-Based API",
    description=(
        "Finance data processing and access control backend. "
        "Supports JWT auth, multi-role RBAC, full financial record CRUD, "
        "soft-delete, search/filter, pagination, and aggregated dashboard analytics."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ── Middleware ────────────────────────────────────────────────────────────────

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Structured per-request logging with millisecond granularity."""
    start_time = time.time()
    response = await call_next(request)
    duration_ms = (time.time() - start_time) * 1000
    logger.info(
        f"rid={request.url.path} method={request.method} "
        f"duration={duration_ms:.2f}ms status={response.status_code}"
    )
    return response

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

from app.core.config import settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(auth.router,      prefix="/api")
app.include_router(users.router,     prefix="/api")
app.include_router(roles.router,     prefix="/api")
app.include_router(records.router,   prefix="/api")
app.include_router(dashboard.router, prefix="/api")

# ── Root ──────────────────────────────────────────────────────────────────────

@app.get("/", tags=["health"])
def root():
    return {"message": "Welcome to Financializer Role-Based API. Check /docs for Swagger UI"}

@app.exception_handler(RateLimitExceeded)
async def custom_rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Too Many Requests. Please slow down."},
    )
