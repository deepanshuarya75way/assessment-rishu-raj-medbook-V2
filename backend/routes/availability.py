
from datetime import datetime

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import Doctor, DoctorBlackout
from extensions import db
from utils import role_required
from utils.availability import find_clashing_appointments, to_minutes


availability_bp = Blueprint('availability_bp', __name__)


# --------------------------------------------------
# GET CURRENT DOCTOR
# --------------------------------------------------

def get_current_doctor():
    user_id = get_jwt_identity()
    return Doctor.query.filter_by(user_id=user_id).first()


# --------------------------------------------------
# VALIDATE BLACKOUT DATA
# --------------------------------------------------

def validate_blackout_data(data):

    start_date = data.get('start_date')
    end_date = data.get('end_date')
    start_time = data.get('start_time')
    end_time = data.get('end_time')
    category = data.get('category', 'leave')
    note = data.get('note')

    if not start_date or not end_date:
        return None, "start_date and end_date are required"

    try:
        datetime.strptime(start_date, "%Y-%m-%d")
        datetime.strptime(end_date, "%Y-%m-%d")

    except (ValueError, TypeError):
        return None, "Dates must be in YYYY-MM-DD format"

    if end_date < start_date:
        return None, "end_date must be greater than or equal to start_date"

    if (start_time is None) != (end_time is None):
        return None, "Both start_time and end_time must be provided together"

    if start_time is not None and end_time is not None:

        try:
            start_minutes = to_minutes(start_time)
            end_minutes = to_minutes(end_time)

            if datetime.strptime(
                start_time, "%H:%M"
            ).strftime("%H:%M") != start_time:
                return None, "Times must be in HH:MM format"

            if datetime.strptime(
                end_time, "%H:%M"
            ).strftime("%H:%M") != end_time:
                return None, "Times must be in HH:MM format"

        except (ValueError, TypeError):
            return None, "Times must be in HH:MM format"

        if end_minutes <= start_minutes:
            return None, "end_time must be after start_time"

    if category not in ['leave', 'conference', 'emergency', 'other']:
        return None, "Invalid category"

    if note is not None and not isinstance(note, str):
        return None, "note must be a string"

    return {
        "start_date": start_date,
        "end_date": end_date,
        "start_time": start_time,
        "end_time": end_time,
        "category": category,
        "note": note
    }, None


# --------------------------------------------------
# FIND BLACKOUT CLASHES
# --------------------------------------------------

def _find_blackout_clashes(blackout):

    return find_clashing_appointments(
        doctor_id=blackout.doctor_id,
        start_date=blackout.start_date,
        end_date=blackout.end_date,
        start_time=blackout.start_time,
        end_time=blackout.end_time
    )


# --------------------------------------------------
# BLACKOUT RESPONSE
# --------------------------------------------------

def blackout_response(blackout):

    data = blackout.to_dict()

    clashes = _find_blackout_clashes(blackout)

    data['clash_count'] = len(clashes)

    return data


# --------------------------------------------------
# CLASH RESPONSE
# --------------------------------------------------

def clash_response(blackout, clashes):

    return {
        "error": (
            "Existing appointments conflict with this unavailable period. "
            "Please review the affected appointments before confirming."
        ),
        "requires_confirmation": True,
        "blackout": blackout.to_dict(),
        "clash_count": len(clashes),
        "clashing_appointments": [
            appointment.to_dict()
            for appointment in clashes
        ]
    }


# --------------------------------------------------
# GET OWNED BLACKOUT
# --------------------------------------------------

def get_owned_blackout(blackout_id, doctor):

    blackout = DoctorBlackout.query.get(blackout_id)

    if not blackout:
        return None, (
            jsonify({"error": "Blackout not found"}),
            404
        )

    if blackout.doctor_id != doctor.id:
        return None, (
            jsonify({"error": "Forbidden"}),
            403
        )

    return blackout, None


# --------------------------------------------------
# GET ALL DOCTOR BLACKOUTS
# --------------------------------------------------

@availability_bp.route('/blackouts', methods=['GET'])
@jwt_required()
@role_required('doctor')
def list_blackouts():

    doctor = get_current_doctor()

    if not doctor:
        return jsonify({
            "error": "Doctor profile not found"
        }), 404

    blackouts = DoctorBlackout.query.filter_by(
        doctor_id=doctor.id
    ).order_by(
        DoctorBlackout.start_date,
        DoctorBlackout.start_time
    ).all()

    return jsonify([
        blackout_response(blackout)
        for blackout in blackouts
    ]), 200


# --------------------------------------------------
# CREATE BLACKOUT
# --------------------------------------------------

@availability_bp.route('/blackouts', methods=['POST'])
@jwt_required()
@role_required('doctor')
def create_blackout():

    doctor = get_current_doctor()

    if not doctor:
        return jsonify({
            "error": "Doctor profile not found"
        }), 404

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "error": "Request body must be a valid JSON object"
        }), 400

    validated_data, error = validate_blackout_data(data)

    if error:
        return jsonify({"error": error}), 400

    confirm_clashes = data.get('confirm_clashes', False)

    if not isinstance(confirm_clashes, bool):
        return jsonify({
            "error": "confirm_clashes must be a boolean"
        }), 400

    # Create a temporary blackout for clash checking.
    # It is not saved to the database yet.

    blackout = DoctorBlackout(
        doctor_id=doctor.id,
        **validated_data
    )

    clashes = _find_blackout_clashes(blackout)

    # Warn doctor before saving a conflicting blackout.

    if clashes and not confirm_clashes:
        return jsonify(
            clash_response(blackout, clashes)
        ), 409

    # Save only after validation and clash confirmation.

    db.session.add(blackout)
    db.session.commit()

    return jsonify({
        "message": "Unavailable period created successfully",
        "blackout": blackout_response(blackout)
    }), 201


# --------------------------------------------------
# UPDATE BLACKOUT
# --------------------------------------------------

@availability_bp.route('/blackouts/<int:id>', methods=['PUT'])
@jwt_required()
@role_required('doctor')
def update_blackout(id):

    doctor = get_current_doctor()

    if not doctor:
        return jsonify({
            "error": "Doctor profile not found"
        }), 404

    blackout, error_response = get_owned_blackout(id, doctor)

    if error_response:
        return error_response

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "error": "Request body must be a valid JSON object"
        }), 400

    validated_data, error = validate_blackout_data(data)

    if error:
        return jsonify({"error": error}), 400

    confirm_clashes = data.get('confirm_clashes', False)

    if not isinstance(confirm_clashes, bool):
        return jsonify({
            "error": "confirm_clashes must be a boolean"
        }), 400

    # Check the proposed changes without modifying
    # the existing database object.

    proposed_blackout = DoctorBlackout(
        doctor_id=doctor.id,
        **validated_data
    )

    clashes = _find_blackout_clashes(proposed_blackout)

    if clashes and not confirm_clashes:
        return jsonify(
            clash_response(proposed_blackout, clashes)
        ), 409

    # Apply changes after clash confirmation.

    for key, value in validated_data.items():
        setattr(blackout, key, value)

    db.session.commit()

    return jsonify({
        "message": "Unavailable period updated successfully",
        "blackout": blackout_response(blackout)
    }), 200


# --------------------------------------------------
# VIEW CLASHING APPOINTMENTS
# --------------------------------------------------

@availability_bp.route('/blackouts/<int:id>/clashes', methods=['GET'])
@jwt_required()
@role_required('doctor')
def view_blackout_clashes(id):

    doctor = get_current_doctor()

    if not doctor:
        return jsonify({
            "error": "Doctor profile not found"
        }), 404

    blackout, error_response = get_owned_blackout(id, doctor)

    if error_response:
        return error_response

    clashes = _find_blackout_clashes(blackout)

    return jsonify({
        "blackout": blackout.to_dict(),
        "clash_count": len(clashes),
        "clashing_appointments": [
            appointment.to_dict()
            for appointment in clashes
        ]
    }), 200


# --------------------------------------------------
# DELETE / UNBLOCK BLACKOUT
# --------------------------------------------------

@availability_bp.route(
    '/blackouts/<int:id>',
    methods=['DELETE']
)
@availability_bp.route(
    '/blackouts/<int:id>/clashes',
    methods=['DELETE']
)
@jwt_required()
@role_required('doctor')
def delete_blackout(id):

    doctor = get_current_doctor()

    if not doctor:
        return jsonify({
            "error": "Doctor profile not found"
        }), 404

    blackout, error_response = get_owned_blackout(id, doctor)

    if error_response:
        return error_response

    clashes = _find_blackout_clashes(blackout)

    response_data = {
        "message": "Unavailable period removed successfully",
        "blackout": blackout.to_dict(),
        "clashing_appointments": [
            appointment.to_dict()
            for appointment in clashes
        ]
    }

    db.session.delete(blackout)
    db.session.commit()

    return jsonify(response_data), 200
