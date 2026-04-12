"""Tutorials API endpoint tests"""
import pytest

class TestTutorialsEndpoint:
    """Test tutorials listing and detail endpoints"""

    def test_get_tutorials_list(self, base_url, api_client):
        """Test GET /api/tutorials returns list of tutorials"""
        response = api_client.get(f"{base_url}/api/tutorials")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) == 6, f"Expected 6 tutorials, got {len(data)}"
        
        # Check first tutorial structure
        if len(data) > 0:
            tutorial = data[0]
            assert "id" in tutorial
            assert "title" in tutorial
            assert "description" in tutorial
            assert "duration" in tutorial
            assert "level" in tutorial
            assert "category" in tutorial
            assert "steps" in tutorial
            assert isinstance(tutorial["steps"], list)
            assert "_id" not in tutorial, "MongoDB _id should not be in response"

    def test_get_tutorial_by_id(self, base_url, api_client):
        """Test GET /api/tutorials/:id returns specific tutorial"""
        # First get list to get a valid ID
        list_response = api_client.get(f"{base_url}/api/tutorials")
        assert list_response.status_code == 200
        tutorials = list_response.json()
        assert len(tutorials) > 0, "No tutorials found"
        
        tutorial_id = tutorials[0]["id"]
        
        # Now get specific tutorial
        response = api_client.get(f"{base_url}/api/tutorials/{tutorial_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["id"] == tutorial_id
        assert "title" in data
        assert "steps" in data

    def test_get_tutorial_invalid_id(self, base_url, api_client):
        """Test GET /api/tutorials/:id with invalid ID returns 404"""
        response = api_client.get(f"{base_url}/api/tutorials/invalid-id-12345")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
