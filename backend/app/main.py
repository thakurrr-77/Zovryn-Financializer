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

            # 2. Seed Default Admin (only if no users exist)
            from app.core.security import get_password_hash
            if db.query(models.User).count() == 0:
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
                    logger.info("First run detected: Created default admin account (admin/admin123)")
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
