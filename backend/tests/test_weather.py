"""Weather API endpoint tests"""
import pytest

class TestWeatherEndpoint:
    """Test weather API with city parameter"""

    def test_weather_paris(self, base_url, api_client):
        """Test weather API returns data for Paris"""
        response = api_client.get(f"{base_url}/api/weather?city=Paris")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "city" in data
        assert "temperature" in data
        assert "humidity" in data
        assert "icon" in data
        assert "skin_advice" in data
        assert isinstance(data["temperature"], (int, float))
        assert isinstance(data["humidity"], (int, float))

    def test_weather_lyon(self, base_url, api_client):
        """Test weather API works for different cities"""
        response = api_client.get(f"{base_url}/api/weather?city=Lyon")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "city" in data
        assert "skin_advice" in data

    def test_weather_invalid_city(self, base_url, api_client):
        """Test weather API handles invalid city gracefully"""
        response = api_client.get(f"{base_url}/api/weather?city=InvalidCityXYZ123")
        assert response.status_code in [404, 500], f"Expected 404 or 500, got {response.status_code}"

    def test_weather_missing_city(self, base_url, api_client):
        """Test weather API requires city parameter"""
        response = api_client.get(f"{base_url}/api/weather")
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
