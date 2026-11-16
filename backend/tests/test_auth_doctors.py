import pytest

def test_patient_registration_and_login(client):
    # Register patient
    res = client.post('/api/auth/register', json={
        "name": "Test Patient",
        "email": "testpatient@example.com",
        "phone": "9876543210",
        "password": "password123",
        "role": "patient"
    })
    assert res.status_code == 201
    data = res.get_json()
    assert "access_token" in data
    assert data["user"]["role"] == "patient"

    # Duplicate email registration should fail
    dup_res = client.post('/api/auth/register', json={
        "name": "Test Patient 2",
        "email": "testpatient@example.com",
        "phone": "9876543210",
        "password": "password123",
        "role": "patient"
    })
    assert dup_res.status_code == 409

    # Login patient
    login_res = client.post('/api/auth/login', json={
        "email": "testpatient@example.com",
        "password": "password123"
    })
    assert login_res.status_code == 200
    login_data = login_res.get_json()
    assert "access_token" in login_data

def test_doctor_registration(client):
    res = client.post('/api/auth/register', json={
        "name": "Dr. Test Doctor",
        "email": "drtest@example.com",
        "phone": "9998887776",
        "password": "doctorpassword",
        "role": "doctor",
        "specialization": "Cardiologist",
        "qualification": "MBBS, MD",
        "experience_years": 10,
        "fee": 1000.0,
        "available_days": "Mon,Tue,Wed,Thu,Fri",
        "available_from": "09:00",
        "available_to": "17:00",
        "bio": "Cardiology expert"
    })
    assert res.status_code == 201
    data = res.get_json()
    assert data["user"]["role"] == "doctor"
    assert data["user"]["doctor_id"] is not None

def test_doctors_list_and_search(client):
    # Register a doctor
    client.post('/api/auth/register', json={
        "name": "Dr. Sarah Jenkins",
        "email": "sarah@example.com",
        "phone": "9998887771",
        "password": "doctorpassword",
        "role": "doctor",
        "specialization": "Neurologist",
        "qualification": "MD Neurology",
        "experience_years": 12,
        "fee": 1200.0,
        "available_days": "Mon,Wed,Fri",
        "available_from": "10:00",
        "available_to": "16:00"
    })

    # Search by specialization
    res = client.get('/api/doctors?specialization=Neurologist')
    assert res.status_code == 200
    docs = res.get_json()
    assert len(docs) == 1
    assert docs[0]["specialization"] == "Neurologist"

    # Search by name partial match
    res_q = client.get('/api/doctors?q=Jenkins')
    assert res_q.status_code == 200
    assert len(res_q.get_json()) == 1

    # Specializations endpoint
    specs_res = client.get('/api/doctors/specializations')
    assert specs_res.status_code == 200
    assert "Neurologist" in specs_res.get_json()
