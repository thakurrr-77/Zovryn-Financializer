# 💰 Financializer — Finance Data Processing & Access Control Backend

A production-grade FastAPI REST backend for a **finance dashboard system** with multi-role access control, financial record management, and aggregated analytics. Built for the Zovryan Backend Developer Intern Assignment.

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Data Model](#-data-model)
- [Role Permission Matrix](#-role-permission-matrix)
- [API Reference](#-api-reference)
- [Running Tests](#-running-tests)
- [Environment Configuration](#-environment-configuration)
- [Design Decisions & Assumptions](#-design-decisions--assumptions)
- [Optional Enhancements Implemented](#-optional-enhancements-implemented)

---

## 🚀 Quick Start

### Prerequisites

- Python 3.12+
- PostgreSQL running locally on port `5432`
- [`uv`](https://github.com/astral-sh/uv) package manager *(or use pip with `requirements.txt`)*

### 1. Clone & Install

```bash
cd backend
uv sync                        # installs all dependencies from uv.lock
```

### 2. Configure Environment

Copy and fill in your `.env` file (see [Environment Configuration](#-environment-configuration)):

```bash
# .env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/financializer_db
SECRET_KEY=your-strong-random-secret-key
```

### 3. Initialise Database & Seed Admin

```bash
uv run python scripts/init_admin.py
```

This creates all tables, seeds the three roles (`Admin`, `Analyst`, `Viewer`), and creates a default admin account:

| Field    | Value                     |
|----------|---------------------------|
| Username | `admin`                   |
| Password | `admin123`                |
| Email    | `admin@financializer.com` |

### 4. Start the Server

```bash
uv run uvicorn app.main:app --reload --port 8000
```

| URL | Description |
|-----|-------------|
| `http://localhost:8000/docs` | Interactive Swagger UI |
| `http://localhost:8000/redoc` | ReDoc documentation |
| `http://localhost:8000/` | Health check |

### 5. Frontend (Optional)

```bash
cd ../frontend
npm install && npm run dev
```

Dashboard available at `http://localhost:5173`

---

## 🏛️ Architecture

```
financializer/
├── app/
│   ├── main.py              # FastAPI app, middleware, lifespan, router registration
│   ├── api/
│   │   ├── dependencies.py  # JWT validation, RoleChecker guards
│   │   └── routers/
│   │       ├── auth.py      # POST /auth/login
│   │       ├── users.py     # User CRUD + role assignment
│   │       ├── roles.py     # Role management
│   │       ├── records.py   # Financial record CRUD + restore
│   │       └── dashboard.py # Aggregated analytics
│   ├── core/
│   │   ├── config.py        # Settings loaded from environment
│   │   └── security.py      # Bcrypt hashing, JWT creation/verification
│   ├── db/
│   │   ├── database.py      # SQLAlchemy engine + session factory
│   │   └── models.py        # ORM models: User, Role, FinancialRecord
│   ├── schemas/
│   │   └── schemas.py       # Pydantic request/response models with validation
│   └── services/
│       ├── record_service.py    # Business logic for financial records
│       └── dashboard_service.py # Aggregation logic for analytics
├── scripts/
│   └── init_admin.py        # One-time DB seed script
├── tests/
│   ├── conftest.py          # Pytest fixtures (SQLite in-memory test DB)
│   └── test_api.py          # 40+ integration tests across 6 test classes
└── pyproject.toml
```

### Request Lifecycle

```
HTTP Request
    │
    ▼
Rate Limiter (slowapi, 100 req/min)
    │
    ▼
Structured Logger Middleware (path, method, duration, status)
    │
    ▼
Router (auth / users / roles / records / dashboard)
    │
    ▼
RBAC Dependency (RoleChecker → 403 if role not allowed)
    │
    ▼
Service Layer (business logic, no DB calls in routers)
    │
    ▼
SQLAlchemy ORM → PostgreSQL
```

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Framework** | FastAPI 0.135+ |
| **Language** | Python 3.12 |
| **Database** | PostgreSQL (production), SQLite in-memory (tests) |
| **ORM** | SQLAlchemy 2.0 |
| **Auth** | JWT via PyJWT + Bcrypt (passlib) |
| **Validation** | Pydantic v2 |
| **Rate Limiting** | slowapi |
| **Testing** | pytest + HTTPX (TestClient) |
| **Package Manager** | uv |

---

## 🗄️ Data Model

### Users

| Column | Type | Notes |
|--------|------|-------|
| `id` | Integer PK | Auto-increment |
| `username` | String(unique) | 3–50 chars |
| `email` | String(unique) | Valid email format |
| `hashed_password` | String | Bcrypt, 72-byte input guard |
| `is_active` | Boolean | Admins can deactivate accounts |
| `created_at` | DateTime | Server-set timestamp |

### Roles

| Column | Type | Notes |
|--------|------|-------|
| `id` | Integer PK | |
| `name` | String(unique) | `Admin`, `Analyst`, `Viewer` |
| `description` | String | Human-readable label |

Users ↔ Roles is a **many-to-many** relationship via the `user_roles` association table.

### Financial Records

| Column | Type | Notes |
|--------|------|-------|
| `id` | Integer PK | |
| `amount` | Float | Must be > 0 |
| `type` | Enum | `income` or `expense` |
| `category` | String | Max 100 chars, indexed |
| `date` | Date | Defaults to today, indexed |
| `description` | String | Optional, max 500 chars |
| `currency` | String | Defaults to `USD` |
| `payment_method` | String | `Cash`, `Card`, `Transfer`, etc. |
| `tags` | String | Comma-separated, for keyword search |
| `is_deleted` | Boolean | Soft-delete flag (default `False`) |
| `owner_id` | FK → users | Multi-tenancy ownership |
| `created_at` | DateTime | Server-set |
| `updated_at` | DateTime | Server-set on update |

---

## 🛡️ Roles & Permissions

### Viewer
* **Can only access:** `GET /api/dashboard/summary`
* **Purpose:** To view high-level financial data
* **Restrictions:**
  * Cannot access financial records
  * Cannot create, update, or delete anything
  * Cannot manage users or roles

👉 **In short:** Read-only access to dashboard only

### Analyst
* **Can access:** 
  * `GET /api/records/`
  * `GET /api/records/{record_id}`
  * `GET /api/dashboard/summary`
* **Purpose:** To analyze financial data
* **Capabilities:** View detailed records, use filters, search, pagination, and understand trends via dashboard
* **Restrictions:**
  * Cannot create/update/delete records
  * Cannot manage users or roles

👉 **In short:** Read + Analyze data, but no modifications

### Admin
* **Has full access to all endpoints:** Users, Roles, Records, Dashboard
* **Capabilities:** 
  * Create/update/delete financial records system-wide
  * **Log on Behalf:** Target specific users for financial records via `owner_id`
  * Soft delete & restore records
  * Manage users and assign roles
* **Audit Control:** Personnel column in ledger to track record ownership

👉 **In short:** High-level system control & multi-user accounting

---

## 📊 Dashboard vs Insights

### Dashboard
* **Endpoint:** `GET /api/dashboard/summary`
* **What it shows:** Aggregated data
* **Examples:** Total income, total expenses, net balance, category-wise totals, recent transactions.

👉 **Focus:** “What is happening” (numbers & summaries)

### Insights
* **Concept:** Not a direct CRUD endpoint, but derived from data.
* **What it shows:** Analysis and patterns
* **Examples:**
  * “Expenses increased 25% this month”
  * “Food category has highest spending”
  * “Unusual spike on a specific date”

👉 **Focus:** “Why it is happening” + “What it means”


---

## 📡 API Reference

All endpoints are prefixed with `/api`. Authentication uses **Bearer tokens** in the `Authorization` header.

### 🔐 Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/login` | None | Exchange credentials for JWT token |

**Login body** (`application/x-www-form-urlencoded`):
```
username=admin&password=admin123
```

**Response:**
```json
{ "access_token": "eyJ...", "token_type": "bearer" }
```

---

### 👤 Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/users/` | None (public) | Register a new user (auto-assigned Viewer role) |
| `GET` | `/api/users/me` | Any role | Get current user's profile |
| `GET` | `/api/users/` | Admin | List all users (paginated) |
| `GET` | `/api/users/{user_id}` | Admin | Get a specific user by ID |
| `PUT` | `/api/users/{user_id}/status?is_active=bool` | Admin | Activate or deactivate a user |
| `POST` | `/api/users/{user_id}/roles/{role_id}` | Admin | Assign a role to a user (idempotent) |
| `DELETE` | `/api/users/{user_id}/roles/{role_id}` | Admin | Remove a role from a user (idempotent) |

**Register body:**
```json
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "SecurePass1"
}
```

---

### 💳 Financial Records

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/records/` | Any role | List records (own for Viewer/Analyst, all for Admin) |
| `GET` | `/api/records/{record_id}` | Any role | Get a single record by ID |
| `POST` | `/api/records/` | Admin | Create a new financial record |
| `PUT` | `/api/records/{record_id}` | Admin | Partially update a record |
| `DELETE` | `/api/records/{record_id}` | Admin | Soft-delete a record |
| `POST` | `/api/records/{record_id}/restore` | Admin | Restore a soft-deleted record |

**Query parameters for `GET /api/records/`:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `skip` | int (≥0) | Pagination offset (default: 0) |
| `limit` | int (≤1000) | Page size (default: 100) |
| `category` | string | Exact match on category |
| `type` | `income` \| `expense` | Filter by transaction type |
| `search` | string | Keyword search across description, category, tags |
| `start_date` | `YYYY-MM-DD` | Inclusive lower date bound |
| `end_date` | `YYYY-MM-DD` | Inclusive upper date bound |

**Create/Update body fields:**

| Field | Required | Type | Constraints |
|-------|----------|------|-------------|
| `amount` | ✅ (create) | float | > 0 |
| `type` | ✅ (create) | string | `income` or `expense` |
| `category` | ✅ (create) | string | 1–100 chars |
| `date` | ❌ | `YYYY-MM-DD` | Defaults to today |
| `description` | ❌ | string | Max 500 chars |
| `currency` | ❌ | string | Max 10 chars, default `USD` |
| `payment_method` | ❌ | string | Max 50 chars |
| `tags` | ❌ | string | Comma-separated, max 200 chars |
| `owner_id` | ❌ | int | **Admin Only:** Specify target user ID. Defaults to current Admin. |

---

### 📊 Dashboard

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/dashboard/summary` | Any role | Aggregated financial summary |

**Query parameter:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `global_view` | bool | Admin only: `true` = all users' data, `false` = personal (default) |

**Response shape:**
```json
{
  "total_income": 12500.00,
  "total_expenses": 3200.00,
  "net_balance": 9300.00,
  "category_totals": [
    { "category": "Salary", "total": 10000.00 },
    { "category": "Dining", "total": 450.00 }
  ],
  "recent_activity": [ ...last 10 records... ],
  "monthly_trends": [
    { "month": "2025-01", "income": 5000.00, "expense": 1200.00 },
    { "month": "2025-02", "income": 7500.00, "expense": 2000.00 }
  ]
}
```

---

### 🏷️ Roles

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/roles/` | Admin | List all roles |
| `POST` | `/api/roles/` | Admin | Create a custom role |

> The three canonical roles (`Admin`, `Analyst`, `Viewer`) are automatically seeded on startup and do not need to be created manually.

---

## 🧪 Running Tests

The test suite uses an **in-memory SQLite database** — no PostgreSQL or environment setup needed.

```bash
cd backend

# With uv
uv run pytest -v

# With pip + venv
pytest -v
```

**Test coverage (40+ tests across 6 classes):**

| Class | Coverage |
|-------|----------|
| `TestAuth` | Registration, login, /me, wrong credentials |
| `TestUserManagement` | List, get, activate, assign/remove roles, RBAC enforcement |
| `TestRecordsRBAC` | Viewer forbidden from create/update/delete, data isolation |
| `TestRecordsCRUD` | Full lifecycle: create, read, update, soft-delete, restore |
| `TestRecordsFiltering` | Type/category filters, search, pagination, date ranges |
| `TestDashboard` | Auth enforcement, net balance math, global vs personal scope |
| `TestValidation` | Zero/negative amounts, invalid enums, field length limits |

---

## ⚙️ Environment Configuration

Create a `backend/.env` file with the following variables:

```env
# PostgreSQL connection string
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/financializer_db

# JWT signing key — use a long random string in production
# Generate one with: python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=your-strong-random-secret-key-here
```

**Defaults (from `app/core/config.py`):**

| Variable | Default |
|----------|---------|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/financializer_db` |
| `SECRET_KEY` | `your-secret-key-here-for-development` *(change in production!)* |
| `ALGORITHM` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` |

---

## 🧠 Design Decisions & Assumptions

### 1. Role Hierarchy (Assumption)
The assignment gave flexibility; I chose **three discrete roles** rather than a permissions bitfield:
- `Viewer` — read-only access to their own data (default for all registrations)
- `Analyst` — same read access as Viewer, differentiated for future read-analytics features
- `Admin` — full CRUD + system-wide data access

A user can hold **multiple roles simultaneously** (many-to-many). The highest privilege always wins.

### 2. Record Ownership & Data Isolation
Records are scoped by `owner_id`. Non-admin users (Viewer and Analyst) query only their own rows. This is enforced in the **service layer**, not the router — keeping controllers thin and business logic testable in isolation.

### 3. Admin Owns All Records (Create/Modify)
The assignment states: *"Admin: can create, update, and manage records and users."* I interpreted this to mean only Admins can mutate financial data. Viewers and Analysts have read access only. This is a deliberate design trade-off — if business needs change, a `has_analyst_access` guard can be swapped in for individual endpoints.

### 4. Soft Delete vs Hard Delete
Records are never physically deleted. The `is_deleted` flag hides records from all standard queries. The restore endpoint (`POST /records/{id}/restore`) returns them. This prevents accidental data loss in a finance context where audit trails matter.

### 5. Monthly Trends — Python-side Aggregation
The original implementation used `func.to_char()` which is PostgreSQL-specific and breaks the SQLite test environment. I replaced it with Python-side grouping using `date.strftime('%Y-%m')`. This trades some DB-side efficiency for **portability and testability**. For a very large dataset this could be optimised with a DB-specific function guarded by the dialect name.

### 6. Global vs Personal Dashboard
Admins get a `global_view` query parameter. When `true`, they see aggregates across all users. When `false` (default), they see only their own data — useful for Admins who also enter their own records.

### 7. JWT Token Expiry
Tokens expire after 30 minutes (configurable via env). There is no refresh token endpoint — this is a reasonable simplification for an intern assignment. In production, a refresh token flow would be added.

### 8. Rate Limiting
`slowapi` enforces 100 requests/minute per IP address. This protects login and record endpoints from brute-force and scraping without requiring infrastructure-level changes.

### 9. Password Safety
`passlib` with `bcrypt` truncates inputs at 72 bytes (a bcrypt algorithm limit). The schema validates max 72 characters and the `verify_password` function explicitly rejects inputs exceeding 72 bytes to prevent subtle security issues with long-password inputs.

---

## ✨ Optional Enhancements Implemented

| Enhancement | Implementation |
|-------------|----------------|
| **JWT Authentication** | `app/core/security.py` + `api/dependencies.py` |
| **Pagination** | `skip` / `limit` on `GET /api/records/` |
| **Search** | Full-text keyword search on description, category, tags |
| **Soft Delete + Restore** | `is_deleted` flag + `POST /records/{id}/restore` |
| **Rate Limiting** | `slowapi` (100 req/min per IP) |
| **Structured Logging** | Per-request log with path, method, duration, status |
| **Unit & Integration Tests** | 40+ tests using pytest + SQLite in-memory |
| **API Documentation** | Swagger UI at `/docs`, ReDoc at `/redoc` |
| **Auto-seeded Roles** | Lifespan event seeds roles and defaults new users to Viewer |
| **Seed Script** | `scripts/init_admin.py` creates admin + demo records |

---

*Built with FastAPI · SQLAlchemy 2.0 · PostgreSQL · JWT · Pydantic v2*
