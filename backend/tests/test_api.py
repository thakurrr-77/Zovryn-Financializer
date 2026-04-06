"""
Integration test suite for the Financializer API.

Tests are organised into four groups:
  1. Auth & User management
  2. Financial Records CRUD + RBAC enforcement
  3. Dashboard analytics
  4. Input validation & error handling

All tests run against an in-memory SQLite database (see conftest.py).
No live PostgreSQL connection is required.
"""

import pytest
from app.db import models
from app.core import security


# ─── Helpers ─────────────────────────────────────────────────────────────────

def login(client, username: str, password: str) -> str:
    """Log in and return the JWT access token."""
    response = client.post(
        "/api/auth/login",
        data={"username": username, "password": password},
    )
    assert response.status_code == 200, f"Login failed for {username}: {response.text}"
    return response.json()["access_token"]


def auth(token: str) -> dict:
    """Return an Authorization header dict for Bearer token auth."""
    return {"Authorization": f"Bearer {token}"}


def register(client, username: str, email: str, password: str = "password123"):
    """Helper to register a user and return the response JSON."""
    resp = client.post(
        "/api/users/",
        json={"username": username, "email": email, "password": password},
    )
    return resp


# ═════════════════════════════════════════════════════════════════════════════
# 1. AUTH & USER MANAGEMENT
# ═════════════════════════════════════════════════════════════════════════════

class TestAuth:
    def test_root_returns_welcome(self, client):
        resp = client.get("/")
        assert resp.status_code == 200
        assert "Financializer" in resp.json()["message"]

    def test_register_success_returns_201(self, client):
        resp = register(client, "alice", "alice@test.com", "AlicePass1")
        assert resp.status_code == 201
        data = resp.json()
        assert data["username"] == "alice"
        assert data["email"] == "alice@test.com"
        assert "id" in data
        # New accounts automatically receive the Viewer role
        assert any(r["name"] == "Viewer" for r in data["roles"])

    def test_register_duplicate_username_returns_400(self, client):
        register(client, "bob", "bob@test.com")
        resp = register(client, "bob", "bob2@test.com")
        assert resp.status_code == 400

    def test_register_duplicate_email_returns_400(self, client):
        register(client, "carol", "carol@test.com")
        resp = register(client, "carol2", "carol@test.com")
        assert resp.status_code == 400

    def test_register_invalid_email_returns_422(self, client):
        resp = register(client, "dave", "not-an-email")
        assert resp.status_code == 422

    def test_register_short_password_returns_422(self, client):
        resp = register(client, "eve", "eve@test.com", "abc")
        assert resp.status_code == 422

    def test_login_success_returns_bearer_token(self, client):
        register(client, "frank", "frank@test.com", "FrankPass1")
        resp = client.post(
            "/api/auth/login",
            data={"username": "frank", "password": "FrankPass1"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert "access_token" in body
        assert body["token_type"] == "bearer"

    def test_login_wrong_password_returns_401(self, client):
        register(client, "grace", "grace@test.com", "RealPass1")
        resp = client.post(
            "/api/auth/login",
            data={"username": "grace", "password": "WrongPass"},
        )
        assert resp.status_code == 401

    def test_login_unknown_user_returns_401(self, client):
        resp = client.post(
            "/api/auth/login",
            data={"username": "nobody", "password": "whatever"},
        )
        assert resp.status_code == 401

    def test_get_me_returns_own_profile(self, client):
        register(client, "henry", "henry@test.com", "HenryPass1")
        token = login(client, "henry", "HenryPass1")
        resp = client.get("/api/users/me", headers=auth(token))
        assert resp.status_code == 200
        assert resp.json()["username"] == "henry"

    def test_get_me_without_token_returns_401(self, client):
        resp = client.get("/api/users/me")
        assert resp.status_code == 401


class TestUserManagement:
    def test_admin_can_list_all_users(self, client, admin_token):
        resp = client.get("/api/users/", headers=auth(admin_token))
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_viewer_cannot_list_users(self, client):
        register(client, "viewer_ul", "viewer_ul@test.com")
        token = login(client, "viewer_ul", "password123")
        resp = client.get("/api/users/", headers=auth(token))
        assert resp.status_code == 403

    def test_admin_can_get_single_user(self, client, admin_token):
        resp = register(client, "singleuser", "su@test.com")
        user_id = resp.json()["id"]
        resp2 = client.get(f"/api/users/{user_id}", headers=auth(admin_token))
        assert resp2.status_code == 200
        assert resp2.json()["username"] == "singleuser"

    def test_admin_get_nonexistent_user_returns_404(self, client, admin_token):
        resp = client.get("/api/users/999999", headers=auth(admin_token))
        assert resp.status_code == 404

    def test_admin_can_deactivate_user(self, client, admin_token):
        resp = register(client, "todeactivate", "tda@test.com")
        user_id = resp.json()["id"]
        resp2 = client.put(
            f"/api/users/{user_id}/status?is_active=false",
            headers=auth(admin_token),
        )
        assert resp2.status_code == 200

    def test_viewer_cannot_update_user_status(self, client):
        resp = register(client, "viewer_status", "vs@test.com")
        user_id = resp.json()["id"]
        token = login(client, "viewer_status", "password123")
        resp2 = client.put(
            f"/api/users/{user_id}/status?is_active=false",
            headers=auth(token),
        )
        assert resp2.status_code == 403

    def test_admin_can_assign_role(self, client, admin_token, db_session):
        resp = register(client, "rolerecipient", "rr@test.com")
        user_id = resp.json()["id"]
        analyst_role = db_session.query(models.Role).filter(
            models.Role.name == "Analyst"
        ).first()
        resp2 = client.post(
            f"/api/users/{user_id}/roles/{analyst_role.id}",
            headers=auth(admin_token),
        )
        assert resp2.status_code == 200
        # Fetch the user and verify role was added
        user_resp = client.get(f"/api/users/{user_id}", headers=auth(admin_token))
        roles = [r["name"] for r in user_resp.json()["roles"]]
        assert "Analyst" in roles

    def test_admin_can_remove_role(self, client, admin_token, db_session):
        resp = register(client, "roleremove", "rrm@test.com")
        user_id = resp.json()["id"]
        viewer_role = db_session.query(models.Role).filter(
            models.Role.name == "Viewer"
        ).first()
        # Remove the default Viewer role
        resp2 = client.delete(
            f"/api/users/{user_id}/roles/{viewer_role.id}",
            headers=auth(admin_token),
        )
        assert resp2.status_code == 200


# ═════════════════════════════════════════════════════════════════════════════
# 2. FINANCIAL RECORDS — CRUD + RBAC
# ═════════════════════════════════════════════════════════════════════════════

class TestRecordsRBAC:
    """Verifies that role-based access control is enforced on records."""

    def test_unauthenticated_create_returns_401(self, client):
        resp = client.post(
            "/api/records/",
            json={"amount": 100, "type": "income", "category": "Salary"},
        )
        assert resp.status_code == 401

    def test_viewer_cannot_create_record(self, client):
        register(client, "viewer_rec", "viewer_rec@test.com")
        token = login(client, "viewer_rec", "password123")
        resp = client.post(
            "/api/records/",
            json={"amount": 100.0, "type": "income", "category": "Salary"},
            headers=auth(token),
        )
        assert resp.status_code == 403

    def test_admin_can_create_record_returns_201(self, client, admin_token):
        resp = client.post(
            "/api/records/",
            json={
                "amount": 5000.0,
                "type": "income",
                "category": "Salary",
                "description": "Monthly salary",
            },
            headers=auth(admin_token),
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["amount"] == 5000.0
        assert data["category"] == "Salary"
        assert data["type"] == "income"

    def test_viewer_can_read_own_records(self, client):
        register(client, "viewer_read", "vrd@test.com")
        token = login(client, "viewer_read", "password123")
        resp = client.get("/api/records/", headers=auth(token))
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_viewer_cannot_see_admin_records(self, client, admin_token):
        register(client, "viewer_isolation", "vi@test.com")
        token = login(client, "viewer_isolation", "password123")

        # Admin creates a record
        client.post(
            "/api/records/",
            json={"amount": 999.0, "type": "income", "category": "PrivateData"},
            headers=auth(admin_token),
        )

        # Viewer should not see admin's records
        viewer_resp = client.get("/api/records/", headers=auth(token))
        admin_resp = client.get(
            "/api/records/?category=PrivateData", headers=auth(admin_token)
        )
        assert viewer_resp.status_code == 200
        viewer_ids = {r["id"] for r in viewer_resp.json()}
        admin_ids = {r["id"] for r in admin_resp.json()}
        # Viewer's record set must be disjoint from admin's private records
        assert viewer_ids.isdisjoint(admin_ids)

    def test_viewer_cannot_update_record(self, client, admin_token):
        create_resp = client.post(
            "/api/records/",
            json={"amount": 200.0, "type": "expense", "category": "Food"},
            headers=auth(admin_token),
        )
        record_id = create_resp.json()["id"]

        register(client, "viewer_upd", "vupd@test.com")
        token = login(client, "viewer_upd", "password123")
        resp = client.put(
            f"/api/records/{record_id}",
            json={"amount": 999.0},
            headers=auth(token),
        )
        assert resp.status_code == 403

    def test_viewer_cannot_delete_record(self, client, admin_token):
        create_resp = client.post(
            "/api/records/",
            json={"amount": 50.0, "type": "expense", "category": "Misc"},
            headers=auth(admin_token),
        )
        record_id = create_resp.json()["id"]

        register(client, "viewer_del", "vdel@test.com")
        token = login(client, "viewer_del", "password123")
        resp = client.delete(f"/api/records/{record_id}", headers=auth(token))
        assert resp.status_code == 403


class TestRecordsCRUD:
    """Tests the full CRUD lifecycle (admin performing operations)."""

    def test_get_single_record(self, client, admin_token):
        create_resp = client.post(
            "/api/records/",
            json={"amount": 750.0, "type": "expense", "category": "Rent"},
            headers=auth(admin_token),
        )
        record_id = create_resp.json()["id"]
        resp = client.get(f"/api/records/{record_id}", headers=auth(admin_token))
        assert resp.status_code == 200
        assert resp.json()["id"] == record_id
        assert resp.json()["category"] == "Rent"

    def test_get_nonexistent_record_returns_404(self, client, admin_token):
        resp = client.get("/api/records/999999", headers=auth(admin_token))
        assert resp.status_code == 404

    def test_update_record_changes_fields(self, client, admin_token):
        create_resp = client.post(
            "/api/records/",
            json={"amount": 300.0, "type": "income", "category": "Freelance"},
            headers=auth(admin_token),
        )
        record_id = create_resp.json()["id"]

        update_resp = client.put(
            f"/api/records/{record_id}",
            json={"amount": 450.0, "category": "Consulting"},
            headers=auth(admin_token),
        )
        assert update_resp.status_code == 200
        updated = update_resp.json()
        assert updated["amount"] == 450.0
        assert updated["category"] == "Consulting"
        # Unchanged field should persist
        assert updated["type"] == "income"

    def test_soft_delete_hides_record(self, client, admin_token):
        create_resp = client.post(
            "/api/records/",
            json={"amount": 100.0, "type": "expense", "category": "DeleteMe"},
            headers=auth(admin_token),
        )
        record_id = create_resp.json()["id"]

        del_resp = client.delete(f"/api/records/{record_id}", headers=auth(admin_token))
        assert del_resp.status_code == 200

        # Record must no longer appear in the list
        list_resp = client.get("/api/records/", headers=auth(admin_token))
        ids = [r["id"] for r in list_resp.json()]
        assert record_id not in ids

        # Fetching by ID should also return 404
        get_resp = client.get(f"/api/records/{record_id}", headers=auth(admin_token))
        assert get_resp.status_code == 404

    def test_double_delete_returns_404(self, client, admin_token):
        create_resp = client.post(
            "/api/records/",
            json={"amount": 20.0, "type": "expense", "category": "DoubleDelete"},
            headers=auth(admin_token),
        )
        record_id = create_resp.json()["id"]
        client.delete(f"/api/records/{record_id}", headers=auth(admin_token))
        # Second delete should 404  (not silently succeed)
        resp2 = client.delete(f"/api/records/{record_id}", headers=auth(admin_token))
        assert resp2.status_code == 404

    def test_restore_brings_record_back(self, client, admin_token):
        create_resp = client.post(
            "/api/records/",
            json={"amount": 80.0, "type": "income", "category": "RestoreMe"},
            headers=auth(admin_token),
        )
        record_id = create_resp.json()["id"]

        # Soft-delete
        client.delete(f"/api/records/{record_id}", headers=auth(admin_token))

        # Restore
        restore_resp = client.post(
            f"/api/records/{record_id}/restore", headers=auth(admin_token)
        )
        assert restore_resp.status_code == 200
        assert restore_resp.json()["id"] == record_id

        # Record reappears in list
        list_resp = client.get("/api/records/", headers=auth(admin_token))
        ids = [r["id"] for r in list_resp.json()]
        assert record_id in ids

    def test_restore_nondeleted_record_returns_404(self, client, admin_token):
        create_resp = client.post(
            "/api/records/",
            json={"amount": 60.0, "type": "income", "category": "Alive"},
            headers=auth(admin_token),
        )
        record_id = create_resp.json()["id"]
        # Restore a record that was never deleted
        resp = client.post(
            f"/api/records/{record_id}/restore", headers=auth(admin_token)
        )
        assert resp.status_code == 404

    def test_viewer_cannot_restore_record(self, client, admin_token):
        create_resp = client.post(
            "/api/records/",
            json={"amount": 10.0, "type": "expense", "category": "NoRestore"},
            headers=auth(admin_token),
        )
        record_id = create_resp.json()["id"]
        client.delete(f"/api/records/{record_id}", headers=auth(admin_token))

        register(client, "viewer_norestore", "vnr@test.com")
        token = login(client, "viewer_norestore", "password123")
        resp = client.post(f"/api/records/{record_id}/restore", headers=auth(token))
        assert resp.status_code == 403


class TestRecordsFiltering:
    """Tests filters, pagination, and search on the records list endpoint."""

    def test_filter_by_type_income(self, client, admin_token):
        client.post("/api/records/", json={"amount": 1000.0, "type": "income",  "category": "TypeFilter"}, headers=auth(admin_token))
        client.post("/api/records/", json={"amount":  200.0, "type": "expense", "category": "TypeFilter"}, headers=auth(admin_token))

        resp = client.get("/api/records/?type=income&category=TypeFilter", headers=auth(admin_token))
        assert resp.status_code == 200
        for record in resp.json():
            assert record["type"] == "income"

    def test_filter_by_type_expense(self, client, admin_token):
        resp = client.get("/api/records/?type=expense&category=TypeFilter", headers=auth(admin_token))
        assert resp.status_code == 200
        for record in resp.json():
            assert record["type"] == "expense"

    def test_filter_by_category(self, client, admin_token):
        client.post("/api/records/", json={"amount": 50.0, "type": "expense", "category": "UniqueCategory99"}, headers=auth(admin_token))
        resp = client.get("/api/records/?category=UniqueCategory99", headers=auth(admin_token))
        assert resp.status_code == 200
        assert len(resp.json()) >= 1
        for r in resp.json():
            assert r["category"] == "UniqueCategory99"

    def test_search_in_description(self, client, admin_token):
        client.post(
            "/api/records/",
            json={"amount": 45.0, "type": "expense", "category": "Coffee", "description": "SearchableKeyword_XYZ"},
            headers=auth(admin_token),
        )
        resp = client.get("/api/records/?search=SearchableKeyword_XYZ", headers=auth(admin_token))
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    def test_search_in_tags(self, client, admin_token):
        client.post(
            "/api/records/",
            json={"amount": 30.0, "type": "expense", "category": "General", "tags": "mytag_unique123"},
            headers=auth(admin_token),
        )
        resp = client.get("/api/records/?search=mytag_unique123", headers=auth(admin_token))
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    def test_pagination_limit(self, client, admin_token):
        resp = client.get("/api/records/?limit=2", headers=auth(admin_token))
        assert resp.status_code == 200
        assert len(resp.json()) <= 2

    def test_date_range_filter(self, client, admin_token):
        resp = client.get(
            "/api/records/?start_date=2020-01-01&end_date=2030-12-31",
            headers=auth(admin_token),
        )
        assert resp.status_code == 200


# ═════════════════════════════════════════════════════════════════════════════
# 3. DASHBOARD ANALYTICS
# ═════════════════════════════════════════════════════════════════════════════

class TestDashboard:
    def test_dashboard_requires_auth(self, client):
        resp = client.get("/api/dashboard/summary")
        assert resp.status_code == 401

    def test_viewer_can_access_own_dashboard(self, client):
        register(client, "dash_viewer", "dv@test.com")
        token = login(client, "dash_viewer", "password123")
        resp = client.get("/api/dashboard/summary", headers=auth(token))
        assert resp.status_code == 200
        body = resp.json()
        assert "total_income" in body
        assert "total_expenses" in body
        assert "net_balance" in body
        assert "category_totals" in body
        assert "monthly_trends" in body
        assert "recent_activity" in body

    def test_dashboard_net_balance_is_correct(self, client, admin_token):
        resp = client.get("/api/dashboard/summary", headers=auth(admin_token))
        body = resp.json()
        expected = round(body["total_income"] - body["total_expenses"], 10)
        assert round(body["net_balance"], 10) == expected

    def test_admin_can_view_global_dashboard(self, client, admin_token):
        resp = client.get(
            "/api/dashboard/summary?global_view=true", headers=auth(admin_token)
        )
        assert resp.status_code == 200

    def test_viewer_global_view_flag_has_no_effect(self, client):
        """
        Passing global_view=true as a Viewer must not expose other users' data.
        The service ignores this flag for non-admins.
        """
        register(client, "viewer_gv", "vgv@test.com")
        token = login(client, "viewer_gv", "password123")
        resp = client.get(
            "/api/dashboard/summary?global_view=true", headers=auth(token)
        )
        # Should still succeed but only show personal (empty) data
        assert resp.status_code == 200
        body = resp.json()
        assert body["total_income"] == 0.0
        assert body["total_expenses"] == 0.0


# ═════════════════════════════════════════════════════════════════════════════
# 4. INPUT VALIDATION & ERROR HANDLING
# ═════════════════════════════════════════════════════════════════════════════

class TestValidation:
    def test_zero_amount_rejected(self, client, admin_token):
        resp = client.post(
            "/api/records/",
            json={"amount": 0.0, "type": "income", "category": "Test"},
            headers=auth(admin_token),
        )
        assert resp.status_code == 422

    def test_negative_amount_rejected(self, client, admin_token):
        resp = client.post(
            "/api/records/",
            json={"amount": -50.0, "type": "income", "category": "Test"},
            headers=auth(admin_token),
        )
        assert resp.status_code == 422

    def test_invalid_transaction_type_rejected(self, client, admin_token):
        resp = client.post(
            "/api/records/",
            json={"amount": 100.0, "type": "reimbursement", "category": "Test"},
            headers=auth(admin_token),
        )
        assert resp.status_code == 422

    def test_missing_required_fields_rejected(self, client, admin_token):
        # amount, type, and category are all required
        resp = client.post(
            "/api/records/",
            json={"type": "income"},
            headers=auth(admin_token),
        )
        assert resp.status_code == 422

    def test_category_too_long_rejected(self, client, admin_token):
        resp = client.post(
            "/api/records/",
            json={"amount": 10.0, "type": "income", "category": "x" * 101},
            headers=auth(admin_token),
        )
        assert resp.status_code == 422

    def test_description_too_long_rejected(self, client, admin_token):
        resp = client.post(
            "/api/records/",
            json={"amount": 10.0, "type": "income", "category": "Test", "description": "x" * 501},
            headers=auth(admin_token),
        )
        assert resp.status_code == 422

    def test_username_too_short_rejected(self, client):
        resp = register(client, "ab", "ab@test.com")
        assert resp.status_code == 422

    def test_invalid_pagination_params_rejected(self, client, admin_token):
        # skip must be >= 0
        resp = client.get("/api/records/?skip=-1", headers=auth(admin_token))
        assert resp.status_code == 422
