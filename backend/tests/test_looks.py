"""Saved Looks CRUD endpoint tests"""
import pytest
import uuid

class TestLooksEndpoints:
    """Test saved looks create, read, delete operations"""

    def test_get_looks_requires_auth(self, base_url, api_client):
        """Test GET /api/looks requires authentication"""
        response = api_client.get(f"{base_url}/api/looks")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"

    def test_get_looks_empty_list(self, base_url, api_client, test_user_token):
        """Test GET /api/looks returns list (may be empty for new user)"""
        response = api_client.get(
            f"{base_url}/api/looks",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"

    def test_create_and_get_look(self, base_url, api_client, test_user_token):
        """Test POST /api/looks creates a look and GET retrieves it"""
        # Create a look
        look_name = f"TEST_Look_{uuid.uuid4().hex[:6]}"
        create_response = api_client.post(
            f"{base_url}/api/looks",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={
                "name": look_name,
                "products": ["Fond de teint", "Mascara", "Rouge à lèvres"],
                "notes": "Test look for automated testing"
            }
        )
        assert create_response.status_code == 200, f"Expected 200, got {create_response.status_code}: {create_response.text}"
        
        created_look = create_response.json()
        assert created_look["name"] == look_name
        assert "id" in created_look
        assert len(created_look["products"]) == 3
        assert created_look["notes"] == "Test look for automated testing"
        
        # Verify it appears in GET list
        get_response = api_client.get(
            f"{base_url}/api/looks",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert get_response.status_code == 200
        looks = get_response.json()
        assert any(look["id"] == created_look["id"] for look in looks), "Created look not found in list"

    def test_create_look_requires_auth(self, base_url, api_client):
        """Test POST /api/looks requires authentication"""
        response = api_client.post(
            f"{base_url}/api/looks",
            json={
                "name": "Test Look",
                "products": ["Mascara"],
                "notes": ""
            }
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"

    def test_delete_look(self, base_url, api_client, test_user_token):
        """Test DELETE /api/looks/:id removes a look"""
        # First create a look
        look_name = f"TEST_ToDelete_{uuid.uuid4().hex[:6]}"
        create_response = api_client.post(
            f"{base_url}/api/looks",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={
                "name": look_name,
                "products": ["Blush"],
                "notes": "Will be deleted"
            }
        )
        assert create_response.status_code == 200
        look_id = create_response.json()["id"]
        
        # Delete it
        delete_response = api_client.delete(
            f"{base_url}/api/looks/{look_id}",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert delete_response.status_code == 200, f"Expected 200, got {delete_response.status_code}: {delete_response.text}"
        
        # Verify it's gone
        get_response = api_client.get(
            f"{base_url}/api/looks",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        looks = get_response.json()
        assert not any(look["id"] == look_id for look in looks), "Deleted look still appears in list"

    def test_delete_nonexistent_look(self, base_url, api_client, test_user_token):
        """Test DELETE /api/looks/:id with invalid ID returns 404"""
        response = api_client.delete(
            f"{base_url}/api/looks/nonexistent-id-12345",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
