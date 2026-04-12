"""Authentication endpoint tests"""
import pytest
import requests
import uuid

class TestAuthEndpoints:
    """Test auth registration, login, and /me endpoint"""

    def test_admin_login_success(self, base_url, api_client):
        """Test admin can login with correct credentials"""
        response = api_client.post(
            f"{base_url}/api/auth/login",
            json={"email": "tom@gmail.com", "password": "Tomcle62"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "access_token" in data, "Missing access_token in response"
        assert "refresh_token" in data, "Missing refresh_token in response"
        assert "user" in data, "Missing user in response"
        assert data["user"]["email"] == "tom@gmail.com"
        assert data["user"]["role"] == "admin"

    def test_login_wrong_password(self, base_url, api_client):
        """Test login fails with wrong password"""
        response = api_client.post(
            f"{base_url}/api/auth/login",
            json={"email": "tom@gmail.com", "password": "wrongpassword"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"

    def test_login_nonexistent_user(self, base_url, api_client):
        """Test login fails for non-existent user"""
        response = api_client.post(
            f"{base_url}/api/auth/login",
            json={"email": "nonexistent@test.com", "password": "password123"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"

    def test_register_new_user(self, base_url, api_client):
        """Test user registration with unique email"""
        unique_email = f"test_{uuid.uuid4().hex[:8]}@aria.com"
        response = api_client.post(
            f"{base_url}/api/auth/register",
            json={
                "email": unique_email,
                "password": "testpass123",
                "name": "Test User",
                "city": "Lyon"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == unique_email
        assert data["user"]["name"] == "Test User"
        assert data["user"]["city"] == "Lyon"
        assert data["user"]["role"] == "user"

    def test_register_duplicate_email(self, base_url, api_client):
        """Test registration fails with duplicate email"""
        response = api_client.post(
            f"{base_url}/api/auth/register",
            json={
                "email": "admin@aria.com",
                "password": "testpass123",
                "name": "Duplicate",
                "city": "Paris"
            }
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"

    def test_get_current_user(self, base_url, api_client, admin_token):
        """Test /api/auth/me returns current user info"""
        response = api_client.get(
            f"{base_url}/api/auth/me",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["email"] == "tom@gmail.com"
        assert data["role"] == "admin"
        assert "password_hash" not in data, "Password hash should not be in response"
        assert "_id" not in data, "MongoDB _id should not be in response"

    def test_get_current_user_no_token(self, base_url, api_client):
        """Test /api/auth/me fails without token"""
        response = api_client.get(f"{base_url}/api/auth/me")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"

    def test_get_current_user_invalid_token(self, base_url, api_client):
        """Test /api/auth/me fails with invalid token"""
        response = api_client.get(
            f"{base_url}/api/auth/me",
            headers={"Authorization": "Bearer invalid_token_here"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
