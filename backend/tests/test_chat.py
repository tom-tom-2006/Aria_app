"""Chat API endpoint tests (GPT 5.2 integration)"""
import pytest
import time

class TestChatEndpoint:
    """Test chat endpoint with AI integration"""

    def test_chat_requires_auth(self, base_url, api_client):
        """Test POST /api/chat requires authentication"""
        response = api_client.post(
            f"{base_url}/api/chat",
            json={"message": "Bonjour"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"

    def test_chat_send_message(self, base_url, api_client, test_user_token):
        """Test POST /api/chat sends message and gets AI response"""
        response = api_client.post(
            f"{base_url}/api/chat",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={"message": "Bonjour ARIA, quel est ton rôle ?"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "session_id" in data, "Missing session_id in response"
        assert "response" in data, "Missing response in response"
        assert isinstance(data["response"], str), "Response should be a string"
        assert len(data["response"]) > 0, "Response should not be empty"

    def test_chat_with_session_id(self, base_url, api_client, test_user_token):
        """Test chat maintains session context"""
        # First message
        response1 = api_client.post(
            f"{base_url}/api/chat",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={"message": "Bonjour"}
        )
        assert response1.status_code == 200
        session_id = response1.json()["session_id"]
        
        # Second message with same session
        time.sleep(1)  # Brief pause between messages
        response2 = api_client.post(
            f"{base_url}/api/chat",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={
                "message": "Merci pour ton aide",
                "session_id": session_id
            }
        )
        assert response2.status_code == 200, f"Expected 200, got {response2.status_code}: {response2.text}"
        assert response2.json()["session_id"] == session_id

    def test_chat_history(self, base_url, api_client, test_user_token):
        """Test GET /api/chat/history returns message history"""
        # Send a message first
        chat_response = api_client.post(
            f"{base_url}/api/chat",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={"message": "Test message for history"}
        )
        assert chat_response.status_code == 200
        session_id = chat_response.json()["session_id"]
        
        # Get history
        history_response = api_client.get(
            f"{base_url}/api/chat/history?session_id={session_id}",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert history_response.status_code == 200, f"Expected 200, got {history_response.status_code}: {history_response.text}"
        
        messages = history_response.json()
        assert isinstance(messages, list), "History should be a list"
        assert len(messages) >= 2, "Should have at least user message and assistant response"
        
        # Check message structure
        if len(messages) > 0:
            msg = messages[0]
            assert "role" in msg
            assert "content" in msg
            assert "session_id" in msg
