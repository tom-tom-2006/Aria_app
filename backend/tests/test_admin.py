"""Admin endpoint tests - GET /api/admin/stats"""
import pytest

class TestAdminEndpoints:
    """Test admin-only endpoints"""

    def test_admin_stats_success(self, base_url, api_client, admin_token):
        """Test admin can access stats endpoint"""
        response = api_client.get(
            f"{base_url}/api/admin/stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify all required fields are present
        assert "total_users" in data, "Missing total_users"
        assert "total_admins" in data, "Missing total_admins"
        assert "total_looks" in data, "Missing total_looks"
        assert "total_messages" in data, "Missing total_messages"
        assert "total_tutorials" in data, "Missing total_tutorials"
        assert "subscriptions" in data, "Missing subscriptions"
        assert "recent_users" in data, "Missing recent_users"
        
        # Verify subscriptions structure
        assert "free" in data["subscriptions"], "Missing subscriptions.free"
        assert "premium" in data["subscriptions"], "Missing subscriptions.premium"
        
        # Verify data types
        assert isinstance(data["total_users"], int), "total_users should be int"
        assert isinstance(data["total_admins"], int), "total_admins should be int"
        assert isinstance(data["total_tutorials"], int), "total_tutorials should be int"
        assert isinstance(data["recent_users"], list), "recent_users should be list"
        
        # Verify tutorials count (should be 6 based on seed)
        assert data["total_tutorials"] == 6, f"Expected 6 tutorials, got {data['total_tutorials']}"
        
        print(f"✅ Admin stats: {data['total_users']} users, {data['total_tutorials']} tutorials")

    def test_admin_stats_forbidden_for_regular_user(self, base_url, api_client, test_user_token):
        """Test regular user cannot access admin stats"""
        response = api_client.get(
            f"{base_url}/api/admin/stats",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✅ Regular user correctly denied access to admin stats")

    def test_admin_stats_unauthorized_without_token(self, base_url, api_client):
        """Test admin stats requires authentication"""
        response = api_client.get(f"{base_url}/api/admin/stats")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Admin stats correctly requires authentication")
