import pytest

def test_assistant_symptom_matching(client):
    # Test Cardiologist non-emergency symptom match
    res = client.post('/api/assistant/chat', json={
        "message": "I have chest discomfort and heart palpitations"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert "Cardiologist" in data["suggested_specialization"]
    assert "Disclaimer" in data["reply"]

def test_assistant_emergency_warning(client):
    res = client.post('/api/assistant/chat', json={
        "message": "My father is unconscious and can't breathe"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert "EMERGENCY WARNING" in data["reply"]
    assert "112" in data["reply"] or "108" in data["reply"]

def test_assistant_intent_replies(client):
    # Greeting
    res1 = client.post('/api/assistant/chat', json={"message": "Hello"})
    assert res1.status_code == 200
    assert "MedBook AI Health Assistant" in res1.get_json()["reply"]

    # Booking instructions
    res2 = client.post('/api/assistant/chat', json={"message": "How do I book an appointment?"})
    assert res2.status_code == 200
    assert "To book an appointment" in res2.get_json()["reply"]
