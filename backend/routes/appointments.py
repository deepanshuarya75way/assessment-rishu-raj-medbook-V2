from datetime import datetime

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models import Appointment, Doctor, User, Notification
from utils import role_required
from utils.availability import (
    get_blocked_info,
    is_slot_blocked,
    format_slot
)

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

ACTIVE_STATUSES = ['pending', 'confirmed']


def get_current_user_id():
    """Helper to safely extract user ID from JWT identity whether it is int, str, or dict."""
    identity = get_jwt_identity()
    if isinstance(identity, dict):
        return int(identity.get("id"))
    return int(identity)


def validate_slot(doctor, date_str, time_str, exclude_apt_id=None):
    """
    Validate an appointment slot.

    Returns:
        (error_message, status_code) if invalid.
        (None, None) if valid.
    """
    # 1. Validate date format and ensure date is not in the past.
    try:
        booking_date = datetime.strptime(
            date_str, "%Y-%m-%d"
        ).date()
    except (ValueError, TypeError):
        return "Invalid date format. Use YYYY-MM-DD.", 400

    today = datetime.now().date()

    if booking_date < today:
        return "Appointment date cannot be in the past.", 400

    # 2. Validate doctor availability on the selected weekday.
    weekday_name = DAY_MAP[booking_date.weekday()]

    allowed_days = [
        day.strip()
        for day in (doctor.available_days or "").split(",")
        if day.strip()
    ]

    if allowed_days and weekday_name not in allowed_days:
        return (
            f"Doctor is not available on {weekday_name}s. "
            f"Available days: {doctor.available_days}",
            400
        )

    # 3. Validate time format and doctor's working hours.
    try:
        booking_time = datetime.strptime(
            time_str, "%H:%M"
        ).time()

        doctor_from = datetime.strptime(
            doctor.available_from, "%H:%M"
        ).time()

        doctor_to = datetime.strptime(
            doctor.available_to, "%H:%M"
        ).time()

    except (ValueError, TypeError):
        return (
            "Invalid time format. Use HH:MM in 24-hour format.",
            400
        )

    if not (doctor_from <= booking_time <= doctor_to):
        return (
            f"Time slot must be within doctor's working hours "
            f"({doctor.available_from} - {doctor.available_to}).",
            400
        )

    # 4. Check doctor blackout periods.
    if is_slot_blocked(doctor.id, date_str, time_str):
        return (
            "The doctor is unavailable this date/time due to a blackout period. "
            "Please choose a different slot.",
            409
        )

    # 5. Check whether another active appointment occupies this slot.
    existing_query = Appointment.query.filter_by(
        doctor_id=doctor.id,
        date=date_str,
        time=time_str
    ).filter(
        Appointment.status.in_(ACTIVE_STATUSES)
    )

    if exclude_apt_id is not None:
        existing_query = existing_query.filter(
            Appointment.id != exclude_apt_id
        )

    existing_apt = existing_query.first()

    if existing_apt:
        return (
            "This time slot is already booked. "
            "Please choose a different date or time.",
            409
        )

    return None, None


@appointments_bp.route('', methods=['POST'])
@jwt_required()
@role_required('patient')
def book_appointment():
    try:
        current_user_id = get_current_user_id()
        data = request.get_json() or {}

        doctor_id = data.get('doctor_id')
        date_str = data.get('date', '').strip()
        time_str = data.get('time', '').strip()
        reason = data.get('reason', '').strip()

        if not doctor_id or not date_str or not time_str or not reason:
            return jsonify({
                "error": "doctor_id, date, time, and reason are required."
            }), 400

        doctor = db.session.get(Doctor, doctor_id)

        if not doctor:
            return jsonify({"error": "Doctor not found."}), 404

        error_message, status_code = validate_slot(
            doctor, date_str, time_str
        )

        if error_message:
            return jsonify({"error": error_message}), status_code

        new_apt = Appointment(
            patient_id=current_user_id,
            doctor_id=int(doctor_id),
            date=date_str,
            time=time_str,
            reason=reason,
            status='pending'
        )

        db.session.add(new_apt)
        db.session.commit()

        return jsonify(new_apt.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        print(f"CRITICAL BOOKING ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Internal server error during booking: {str(e)}"}), 500


@appointments_bp.route('/mine', methods=['GET'])
@jwt_required()
@role_required('patient')
def get_my_appointments():
    try:
        current_user_id = get_current_user_id()
    except Exception as e:
        return jsonify({"error": f"Invalid authentication token identity: {str(e)}"}), 401

    appointments = Appointment.query.filter_by(
        patient_id=current_user_id
    ).order_by(
        Appointment.date.desc(),
        Appointment.time.desc()
    ).all()

    return jsonify([
        apt.to_dict() for apt in appointments
    ]), 200


@appointments_bp.route('/doctor', methods=['GET'])
@jwt_required()
@role_required('doctor')
def get_doctor_appointments():
    try:
        current_user_id = get_current_user_id()
    except Exception as e:
        return jsonify({"error": f"Invalid authentication token identity: {str(e)}"}), 401

    doctor = Doctor.query.filter_by(
        user_id=current_user_id
    ).first()

    if not doctor:
        return jsonify({
            "error": "Doctor profile not found for current user."
        }), 404

    appointments = Appointment.query.filter_by(
        doctor_id=doctor.id
    ).order_by(
        Appointment.date.asc(),
        Appointment.time.asc()
    ).all()

    return jsonify([
        apt.to_dict() for apt in appointments
    ]), 200


@appointments_bp.route('/booked-slots', methods=['GET'])
def get_booked_slots():
    doctor_id = request.args.get('doctor_id')
    date_str = request.args.get('date')

    if not doctor_id or not date_str:
        return jsonify({
            "error": "doctor_id and date parameters are required"
        }), 400

    try:
        doctor_id = int(doctor_id)
        datetime.strptime(date_str, "%Y-%m-%d")
    except (ValueError, TypeError):
        return jsonify({
            "error": "Invalid doctor_id or date format."
        }), 400

    doctor = db.session.get(Doctor, doctor_id)

    if not doctor:
        return jsonify({"error": "Doctor not found."}), 404

    active_apts = Appointment.query.filter_by(
        doctor_id=doctor_id,
        date=date_str
    ).filter(
        Appointment.status.in_(ACTIVE_STATUSES)
    ).all()

    booked_times = [
        apt.time for apt in active_apts
    ]

    day_blocked, block_slots = get_blocked_info(
        doctor, date_str
    )

    return jsonify({
        "doctor_id": doctor_id,
        "date": date_str,
        "booked_slots": booked_times,
        "block_slots": block_slots,
        "day_blocked": day_blocked
    }), 200


@appointments_bp.route('/<int:apt_id>/status', methods=['PATCH'])
@jwt_required()
def update_appointment_status(apt_id):
    try:
        current_user_id = get_current_user_id()
    except Exception as e:
        return jsonify({"error": f"Invalid authentication token identity: {str(e)}"}), 401

    user = db.session.get(User, current_user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    apt = db.session.get(Appointment, apt_id)

    if not apt:
        return jsonify({"error": "Appointment not found"}), 404

    data = request.get_json() or {}

    new_status = data.get('status', '').strip().lower()
    note = data.get('note', '').strip()

    valid_statuses = [
        'confirmed',
        'cancelled',
        'completed'
    ]

    if new_status not in valid_statuses:
        return jsonify({
            "error": (
                f"Invalid status '{new_status}'. "
                f"Allowed values: {', '.join(valid_statuses)}"
            )
        }), 400

    if apt.status in ['cancelled', 'completed']:
        return jsonify({
            "error": f"Cannot update appointment that is already {apt.status}."
        }), 400

    # Role permission checks.
    if user.role == 'patient':

        if apt.patient_id != user.id:
            return jsonify({
                "error": "Forbidden. You can only update your own appointments."
            }), 403

        if new_status != 'cancelled':
            return jsonify({
                "error": "Patients can only cancel appointments."
            }), 403

    elif user.role == 'doctor':

        doctor = Doctor.query.filter_by(
            user_id=user.id
        ).first()

        if not doctor or apt.doctor_id != doctor.id:
            return jsonify({
                "error": "Forbidden. You can only manage appointments assigned to you."
            }), 403

    else:
        return jsonify({
            "error": "Forbidden. Invalid user role."
        }), 403

    # Save cancellation reason and notify patient when doctor cancels.
    if user.role == 'doctor' and new_status == 'cancelled':

        apt.status_note = note or None

        message = (
            f"Your appointment with {apt.doctor.user.name} "
            f"on {format_slot(apt.date, apt.time)} "
            f"was cancelled by the doctor."
        )

        if note:
            message += f" Reason: {note}"

        notification = Notification(
            user_id=apt.patient_id,
            appointment_id=apt.id,
            type='appointment_cancelled',
            message=message
        )

        db.session.add(notification)

    apt.status = new_status

    db.session.commit()

    return jsonify({
        "message": (
            f"Appointment status updated to '{new_status}' successfully"
        ),
        "appointment": apt.to_dict()
    }), 200


@appointments_bp.route('/<int:apt_id>/reschedule', methods=['PATCH'])
@jwt_required()
@role_required('doctor')
def reschedule_appointment(apt_id):
    try:
        current_user_id = get_current_user_id()
    except Exception as e:
        return jsonify({"error": f"Invalid authentication token identity: {str(e)}"}), 401

    doctor = Doctor.query.filter_by(
        user_id=current_user_id
    ).first()

    if not doctor:
        return jsonify({
            "error": "Doctor profile not found for current user."
        }), 404

    apt = db.session.get(Appointment, apt_id)

    if not apt:
        return jsonify({
            "error": "Appointment not found"
        }), 404

    if apt.doctor_id != doctor.id:
        return jsonify({
            "error": "Forbidden. You can only manage appointments assigned to you."
        }), 403

    if apt.status not in ACTIVE_STATUSES:
        return jsonify({
            "error": "Only pending or confirmed appointments can be rescheduled."
        }), 400

    data = request.get_json() or {}

    new_date = data.get('date', '').strip()
    new_time = data.get('time', '').strip()
    note = data.get('note', '').strip()

    if not new_date or not new_time:
        return jsonify({
            "error": "date and time are required."
        }), 400

    if new_date == apt.date and new_time == apt.time:
        return jsonify({
            "error": "New date and time must be different from the current appointment."
        }), 400

    error_message, status_code = validate_slot(
        doctor,
        new_date,
        new_time,
        exclude_apt_id=apt.id
    )

    if error_message:
        return jsonify({
            "error": error_message
        }), status_code

    old_date = apt.date
    old_time = apt.time

    apt.rescheduled_from = f"{old_date} {old_time}"
    apt.date = new_date
    apt.time = new_time
    apt.status_note = note or None

    message = (
        f"Your appointment with {doctor.user.name} "
        f"was moved from {format_slot(old_date, old_time)} "
        f"to {format_slot(new_date, new_time)}."
    )

    if note:
        message += f" Reason: {note}"

    notification = Notification(
        user_id=apt.patient_id,
        appointment_id=apt.id,
        type='appointment_rescheduled',
        message=message
    )

    db.session.add(notification)
    db.session.commit()

    return jsonify({
        "message": "Appointment rescheduled successfully",
        "appointment": apt.to_dict()
    }), 200