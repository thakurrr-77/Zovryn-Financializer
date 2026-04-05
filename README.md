# Zovryan Backend Dev Intern Assignment

This is a full-featured FastAPI REST application meeting all requirements for the Zovryan Backend Developer intern assignment. It includes a PostgreSQL database backbone, role-based access control (RBAC), and aggregated dashboard endpoints.

## Features Built
- **Role-Based Access Control:** Secure boundaries natively integrated. Enforces permissions dynamically based on user context (`Viewer`, `Analyst`, `Admin`).
- **PostgreSQL Ready:** Mapped directly to PostgreSQL using SQLAlchemy schemas and relationships.
- **JWT Authentication:** Stateful user session validations. 
- **Financial Record Operations:** Full CRUD on financial transactions.
- **Aggregation Dashboard:** Native SQL endpoints computing sums and time-based metrics safely.
- **Pydantic Validation:** Comprehensive input restrictions preventing invalid dates, wrong enums, and negative balances.

---

## Running the Application Locally

The fastest way to spin up this project is using `uv`. 

### Prerequisites
1. Have PostgreSQL running locally on port `5432` with a database name `zovryan_db` (or tweak your connection string in the `.env` file).
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

### Alternative: Using Standard Pip

If you do not have `uv` installed, you can use the standard Python tools:
```bash
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

---

## API Documentation
Once the server is running, FastAPI automatically generates your Swagger UI and ReDoc interface! 

Interactive documentation is instantly available at:
- Swagger: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)
