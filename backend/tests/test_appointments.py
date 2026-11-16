import pytest

def setup_test_users_and_doctor(client):
    # Register Doctor (available Mon,Wed,Fri, 09:00 - 17:00)
    doc_res = client.post('/api/auth/register', json={
        "name": "Dr. Alan Grant",
        "email": "dr.alan@example.com",
        "phone": "9991112223",
        "password": "docpassword",
        "role": "doctor",
        "specialization": "Orthopedic",
        "qualification": "MS Ortho",
        "experience_years": 8,
        "fee": 900.0,
        "available_days": "Mon,Wed,Fri",
        "available_from": "09:00",
        "available_to": "17:00"
    })
    doctor_id = doc_res.get_json()["user"]["doctor_id"]

    # Register Patient 1
    p1_res = client.post('/api/auth/register', json={
        "name": "Patient One",
        "email": "p1@example.com",
        "phone": "9811111111",
        "password": "patientpassword",
        "role": "patient"
    })
    p1_token = p1_res.get_json()["access_token"]

    # Register Patient 2
    p2_res = client.post('/api/auth/register', json={
        "name": "Patient Two",
        "email": "p2@example.com",
        "phone": "9822222222",
        "password": "patientpassword",
        "role": "patient"
    })
    p2_token = p2_res.get_json()["access_token"]

    return doctor_id, p1_token, p2_token

def test_booking_flow_and_double_booking(client):
    doctor_id, p1_token, p2_token = setup_test_users_and_doctor(client)

    # 2026-10-16 is a Friday (valid weekday for Dr. Alan Grant)
    booking_payload = {
        "doctor_id": doctor_id,
        "date": "2026-10-16",
        "time": "10:00",
        "reason": "Knee pain checkup"
    }

    # Patient 1 books slot
    res = client.post('/api/appointments', json=booking_payload, headers={
        "Authorization": f"Bearer {p1_token}"
    })
    assert res.status_code == 201
    apt_data = res.get_json()
    assert apt_data["status"] == "pending"
    apt_id = apt_data["id"]

    # Patient 2 tries to book EXACT SAME slot -> Must be rejected (409 Conflict)
    dup_res = client.post('/api/appointments', json=booking_payload, headers={
        "Authorization": f"Bearer {p2_token}"
    })
    assert dup_res.status_code == 409
    assert "already booked" in dup_res.get_json()["error"]

    # Check booked-slots helper endpoint
    slots_res = client.get(f'/api/appointments/booked-slots?doctor_id={doctor_id}&date=2026-10-16')
    assert slots_res.status_code == 200
    assert "10:00" in slots_res.get_json()["booked_slots"]

def test_role_permission_checks(client):
    doctor_id, p1_token, p2_token = setup_test_users_and_doctor(client)

    # Patient 1 books appointment
    res = client.post('/api/appointments', json={
        "doctor_id": doctor_id,
        "date": "2026-10-16",
        "time": "11:00",
        "reason": "Shoulder sprain"
    }, headers={"Authorization": f"Bearer {p1_token}"})
    apt_id = res.get_json()["id"]

    # Patient 2 tries to cancel Patient 1's appointment -> 403 Forbidden
    p2_cancel = client.patch(f'/api/appointments/{apt_id}/status', json={
        "status": "cancelled"
    }, headers={"Authorization": f"Bearer {p2_token}"})
    assert p2_cancel.status_code == 403

    # Patient 1 tries to set status to 'confirmed' -> 403 Forbidden (Only doctors can confirm)
    p1_confirm = client.patch(f'/api/appointments/{apt_id}/status', json={
        "status": "confirmed"
    }, headers={"Authorization": f"Bearer {p1_token}"})
    assert p1_confirm.status_code == 403

    # Patient 1 cancels their own appointment -> 200 OK
    p1_cancel = client.patch(f'/api/appointments/{apt_id}/status', json={
        "status": "cancelled"
    }, headers={"Authorization": f"Bearer {p1_token}"})
    assert p1_cancel.status_code == 200
    assert p1_cancel.get_json()["appointment"]["status"] == "cancelled"
