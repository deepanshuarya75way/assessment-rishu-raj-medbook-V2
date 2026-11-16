from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models import Appointment, Doctor, User
from utils.decorators import role_required

appointments_bp = Blueprint('appointments', __name__)

DAY_MAP = {
    0: "Mon",
    1: "Tue",
    2: "Wed",
    3: "Thu",
    4: "Fri",
    5: "Sat",
    6: "Sun"
}

@appointments_bp.route('', methods=['POST'])
@jwt_required()
@role_required('patient')
def book_appointment():
    current_user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    doctor_id = data.get('doctor_id')
    date_str = data.get('date', '').strip()
    time_str = data.get('time', '').strip()
    reason = data.get('reason', '').strip()

    if not doctor_id or not date_str or not time_str or not reason:
        return jsonify({"error": "doctor_id, date, time, and reason are required."}), 400

    doctor = db.session.get(Doctor, doctor_id)
    if not doctor:
        return jsonify({"error": "Doctor not found."}), 404

    # 1. Validate date format & not in the past
    try:
        booking_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

    today = datetime.now().date()
    if booking_date < today:
        return jsonify({"error": "Appointment date cannot be in the past."}), 400

    # 2. Validate Doctor works on that weekday
    weekday_name = DAY_MAP[booking_date.weekday()]
    allowed_days = [d.strip() for d in doctor.available_days.split(",") if d.strip()]
    if weekday_name not in allowed_days:
        return jsonify({"error": f"Doctor is not available on {weekday_name}s. Available days: {doctor.available_days}"}), 400

    # 3. Validate time format & within doctor's working hours
    try:
        booking_time = datetime.strptime(time_str, "%H:%M").time()
        doctor_from = datetime.strptime(doctor.available_from, "%H:%M").time()
        doctor_to = datetime.strptime(doctor.available_to, "%H:%M").time()
    except ValueError:
        return jsonify({"error": "Invalid time format. Use HH:MM in 24-hour format."}), 400

    if not (doctor_from <= booking_time <= doctor_to):
        return jsonify({"error": f"Time slot must be within doctor's working hours ({doctor.available_from} - {doctor.available_to})."}), 400

    # 4. Validate slot is not already taken by active appointment
    existing_apt = Appointment.query.filter_by(
        doctor_id=doctor_id,
        date=date_str,
        time=time_str
    ).filter(Appointment.status.in_(['pending', 'confirmed'])).first()

    if existing_apt:
        return jsonify({"error": "This time slot is already booked. Please choose a different date or time."}), 409

    # Create appointment
    new_apt = Appointment(
        patient_id=current_user_id,
        doctor_id=doctor_id,
        date=date_str,
        time=time_str,
        reason=reason,
        status='pending'
    )
    db.session.add(new_apt)
    db.session.commit()

    return jsonify(new_apt.to_dict()), 201


@appointments_bp.route('/mine', methods=['GET'])
@jwt_required()
@role_required('patient')
def get_my_appointments():
    current_user_id = int(get_jwt_identity())
    appointments = Appointment.query.filter_by(patient_id=current_user_id).order_by(Appointment.date.desc(), Appointment.time.desc()).all()
    return jsonify([apt.to_dict() for apt in appointments]), 200


@appointments_bp.route('/doctor', methods=['GET'])
@jwt_required()
@role_required('doctor')
def get_doctor_appointments():
    current_user_id = int(get_jwt_identity())
    doctor = Doctor.query.filter_by(user_id=current_user_id).first()
    if not doctor:
        return jsonify({"error": "Doctor profile not found for current user."}), 404

    appointments = Appointment.query.filter_by(doctor_id=doctor.id).order_by(Appointment.date.asc(), Appointment.time.asc()).all()
    return jsonify([apt.to_dict() for apt in appointments]), 200


@appointments_bp.route('/booked-slots', methods=['GET'])
def get_booked_slots():
    doctor_id = request.args.get('doctor_id')
    date_str = request.args.get('date')

    if not doctor_id or not date_str:
        return jsonify({"error": "doctor_id and date parameters are required"}), 400

    active_apts = Appointment.query.filter_by(
        doctor_id=int(doctor_id),
        date=date_str
    ).filter(Appointment.status.in_(['pending', 'confirmed'])).all()

    booked_times = [apt.time for apt in active_apts]
    return jsonify({"doctor_id": int(doctor_id), "date": date_str, "booked_slots": booked_times}), 200


@appointments_bp.route('/<int:apt_id>/status', methods=['PATCH'])
@jwt_required()
def update_appointment_status(apt_id):
    current_user_id = int(get_jwt_identity())
    user = db.session.get(User, current_user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    apt = db.session.get(Appointment, apt_id)
    if not apt:
        return jsonify({"error": "Appointment not found"}), 404

    data = request.get_json() or {}
    new_status = data.get('status', '').strip().lower()

    valid_statuses = ['confirmed', 'cancelled', 'completed']
    if new_status not in valid_statuses:
        return jsonify({"error": f"Invalid status '{new_status}'. Allowed values: {', '.join(valid_statuses)}"}), 400

    # Rule: Cannot alter an already cancelled or completed appointment
    if apt.status in ['cancelled', 'completed']:
        return jsonify({"error": f"Cannot update appointment that is already {apt.status}."}), 400

    # Role Permission Check
    if user.role == 'patient':
        # Patient can only cancel their OWN appointment
        if apt.patient_id != user.id:
            return jsonify({"error": "Forbidden. You can only update your own appointments."}), 403
        if new_status != 'cancelled':
            return jsonify({"error": "Patients can only cancel appointments."}), 403
    elif user.role == 'doctor':
        # Doctor can confirm, cancel, or complete their OWN appointment
        doctor = Doctor.query.filter_by(user_id=user.id).first()
        if not doctor or apt.doctor_id != doctor.id:
            return jsonify({"error": "Forbidden. You can only manage appointments assigned to you."}), 403
    else:
        return jsonify({"error": "Forbidden. Invalid user role."}), 403

    # Apply status update
    apt.status = new_status
    db.session.commit()

    return jsonify({
        "message": f"Appointment status updated to '{new_status}' successfully",
        "appointment": apt.to_dict()
    }), 200
