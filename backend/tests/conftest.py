import pytest
import requests
import os

@pytest.fixture(scope="session")
def base_url():
    """Get base URL from environment"""
    url = os.environ.get('EXPO_PUBLIC_BACKEND_URL')
    if not url:
        raise ValueError("EXPO_PUBLIC_BACKEND_URL not set in environment")
    return url.rstrip('/')

@pytest.fixture(scope="session")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture(scope="session")
def admin_token(base_url, api_client):
    """Get admin token for authenticated tests"""
    response = api_client.post(
        f"{base_url}/api/auth/login",
        json={"email": "tom@gmail.com", "password": "Tomcle62"}
    )
    if response.status_code == 200:
        return response.json()["access_token"]
    pytest.skip("Admin login failed - skipping authenticated tests")

@pytest.fixture(scope="session")
def test_user_token(base_url, api_client):
    """Get test user token"""
    # Try login first
    response = api_client.post(
        f"{base_url}/api/auth/login",
        json={"email": "test@aria.com", "password": "test123456"}
    )
    if response.status_code == 200:
        return response.json()["access_token"]
    
    # If login fails, try register
    response = api_client.post(
        f"{base_url}/api/auth/register",
        json={
            "email": "test@aria.com",
            "password": "test123456",
            "name": "Marie",
            "city": "Paris"
        }
    )
    if response.status_code in [200, 201]:
        return response.json()["access_token"]
    
    pytest.skip("Test user creation/login failed")
