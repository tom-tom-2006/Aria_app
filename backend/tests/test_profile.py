"""Profile update endpoint tests - PUT /api/auth/profile"""
import pytest
import uuid

class TestProfileUpdate:
    """Test profile update functionality"""

    def test_update_name(self, base_url, api_client, test_user_token):
        """Test updating user name"""
        new_name = f"Updated_{uuid.uuid4().hex[:6]}"
        response = api_client.put(
            f"{base_url}/api/auth/profile",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={"name": new_name}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["name"] == new_name, f"Expected name '{new_name}', got '{data['name']}'"
        assert "password_hash" not in data, "Password hash should not be in response"
        
        # Verify persistence with GET /api/auth/me
        me_response = api_client.get(
            f"{base_url}/api/auth/me",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert me_response.status_code == 200
        me_data = me_response.json()
        assert me_data["name"] == new_name, "Name update not persisted"
        print(f"✅ Name updated to: {new_name}")

    def test_update_city(self, base_url, api_client, test_user_token):
        """Test updating user city"""
        new_city = "Lyon"
        response = api_client.put(
            f"{base_url}/api/auth/profile",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={"city": new_city}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["city"] == new_city, f"Expected city '{new_city}', got '{data['city']}'"
        print(f"✅ City updated to: {new_city}")

    def test_update_email(self, base_url, api_client, test_user_token):
        """Test updating user email to unique address"""
        new_email = f"updated_{uuid.uuid4().hex[:8]}@aria.com"
        response = api_client.put(
            f"{base_url}/api/auth/profile",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={"email": new_email}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["email"] == new_email, f"Expected email '{new_email}', got '{data['email']}'"
        print(f"✅ Email updated to: {new_email}")

    def test_update_email_duplicate(self, base_url, api_client, test_user_token):
        """Test updating email to existing address fails"""
        response = api_client.put(
            f"{base_url}/api/auth/profile",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={"email": "tom@gmail.com"}  # Admin email
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✅ Duplicate email correctly rejected")

    def test_update_password(self, base_url, api_client):
        """Test updating password"""
        # Create a new test user for password update
        unique_email = f"pwtest_{uuid.uuid4().hex[:8]}@aria.com"
        register_resp = api_client.post(
            f"{base_url}/api/auth/register",
            json={
                "email": unique_email,
                "password": "oldpass123",
                "name": "PW Test",
                "city": "Paris"
            }
        )
        assert register_resp.status_code == 200
        token = register_resp.json()["access_token"]
        
        # Update password
        update_resp = api_client.put(
            f"{base_url}/api/auth/profile",
            headers={"Authorization": f"Bearer {token}"},
            json={"password": "newpass456"}
        )
        assert update_resp.status_code == 200, f"Expected 200, got {update_resp.status_code}: {update_resp.text}"
        
        # Verify old password no longer works
        old_login = api_client.post(
            f"{base_url}/api/auth/login",
            json={"email": unique_email, "password": "oldpass123"}
        )
        assert old_login.status_code == 401, "Old password should not work"
        
        # Verify new password works
        new_login = api_client.post(
            f"{base_url}/api/auth/login",
            json={"email": unique_email, "password": "newpass456"}
        )
        assert new_login.status_code == 200, "New password should work"
        print("✅ Password updated successfully")

    def test_update_password_too_short(self, base_url, api_client, test_user_token):
        """Test password update fails if too short"""
        response = api_client.put(
            f"{base_url}/api/auth/profile",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={"password": "123"}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✅ Short password correctly rejected")

    def test_update_multiple_fields(self, base_url, api_client, test_user_token):
        """Test updating multiple fields at once"""
        new_name = f"Multi_{uuid.uuid4().hex[:6]}"
        new_city = "Marseille"
        response = api_client.put(
            f"{base_url}/api/auth/profile",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={"name": new_name, "city": new_city}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["name"] == new_name
        assert data["city"] == new_city
        print(f"✅ Multiple fields updated: name={new_name}, city={new_city}")

    def test_update_no_changes(self, base_url, api_client, test_user_token):
        """Test update with no changes returns error"""
        response = api_client.put(
            f"{base_url}/api/auth/profile",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✅ Empty update correctly rejected")

    def test_update_unauthorized(self, base_url, api_client):
        """Test profile update requires authentication"""
        response = api_client.put(
            f"{base_url}/api/auth/profile",
            json={"name": "Hacker"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Profile update correctly requires authentication")
