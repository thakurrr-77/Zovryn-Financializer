# Financializer Backend Dev Intern Assignment

This is a full-featured FastAPI REST application meeting all requirements for the Financializer Backend Developer intern assignment. It includes a PostgreSQL database backbone, role-based access control (RBAC), and aggregated dashboard endpoints.

## Features Built
- **Role-Based Access Control:** Secure boundaries natively integrated. Enforces permissions dynamically based on user context (`Viewer`, `Analyst`, `Admin`).
- **PostgreSQL Ready:** Mapped directly to PostgreSQL using SQLAlchemy schemas and relationships.
- **JWT Authentication:** Stateful user session validations. 
- **Financial Record Operations:** Full CRUD on financial transactions.
- **Aggregation Dashboard:** Native SQL endpoints computing sums and time-based metrics safely.
- **Pydantic Validation:** Comprehensive input restrictions preventing invalid dates, wrong enums, and negative balances.
- **Auto-Sync Schema:** Uses SQLAlchemy to automatically manage database tables.

---

## Technical Architecture & Persistence

To meet the assignment requirements, this application uses a robust **Relational Database** for data persistence:

- **Database Engine:** PostgreSQL (Recommended)
- **ORM Layer:** SQLAlchemy 2.0 using Type-Safe Declarative Mapping.
- **Relational Integrity:** Uses Foreign Keys for user ownership of records and an association table for many-to-many user-role mappings.
- **Data Safety:** Uses native Boolean and Enum types for role management and transaction types.

---

## ✨ Optional Enhancements (Implemented)

To provide a production-ready experience, this project includes several optional improvements suggested in the requirements:

- **JWT Authentication:** Secure stateless session management using signed tokens.
- **Advanced Pagination:** The `/records/` list endpoint supports `skip` and `limit` parameters for efficient data fetching.
- **Robust Searching & Filtering:** Native support for filtering records by **Category**, **Transaction Type**, **Date Ranges**, AND **Keyword Search** in descriptions and categories.
- **Rate Limiting:** Global rate limiting (100 requests/minute) using `slowapi` to protect against brute force and API abuse.
- **Soft Delete with Restoration:** Seamless soft-delete functionality with a dedicated endpoint for administrators to restore deleted records.
- **Unit & Integration Tests:** Comprehensive test suite using `pytest` and `httpx` with an in-memory SQLite backend for isolated testing.
- **Auto-Generated Documentation:** Full Swagger UI and ReDoc accessible out-of-the-box.

---

---

## Running the Application Locally

The fastest way to spin up this project is using `uv`. 

### Prerequisites
1. Have PostgreSQL running locally on port `5432` with a database name `financializer_db` (or tweak your connection string in the `.env` file).
2. Install [uv](https://github.com/astral-sh/uv).

### Step-by-Step

**1. Create a virtual environment**
```bash
uv venv
```

**2. Sync all your project packages instantly**
```bash
uv pip sync requirements.txt
```

**3. Run the FastAPI development server**
```bash
uv run uvicorn app.main:app --reload --port 8000
```

### Running Tests

To run the automated test suite and verify the API logic:
```bash
pytest
```
Or with `uv`:
```bash
uv run pytest
```

---

## API Documentation
Once the server is running, FastAPI automatically generates your Swagger UI and ReDoc interface! 

Interactive documentation is instantly available at:
- Swagger: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)
