from flask import Blueprint, request, jsonify
from models import Doctor, User
from extensions import db

doctors_bp = Blueprint('doctors', __name__)

@doctors_bp.route('', methods=['GET'])
def get_doctors():
    specialization = request.args.get('specialization', '').strip()
    q = request.args.get('q', '').strip()

    query = Doctor.query.join(User, Doctor.user_id == User.id)

    if specialization:
        query = query.filter(Doctor.specialization.ilike(f"%{specialization}%"))

    if q:
        search_filter = (
            User.name.ilike(f"%{q}%") |
            Doctor.specialization.ilike(f"%{q}%") |
            Doctor.qualification.ilike(f"%{q}%")
        )
        query = query.filter(search_filter)

    doctors = query.all()
    return jsonify([doc.to_dict() for doc in doctors]), 200


@doctors_bp.route('/specializations', methods=['GET'])
def get_specializations():
    # Query distinct non-empty specializations
    results = db.session.query(Doctor.specialization).distinct().all()
    specializations = sorted([r[0] for r in results if r[0]])
    return jsonify(specializations), 200


@doctors_bp.route('/<int:doctor_id>', methods=['GET'])
def get_doctor_by_id(doctor_id):
    doctor = db.session.get(Doctor, doctor_id)
    if not doctor:
        return jsonify({"error": "Doctor not found"}), 404
    return jsonify(doctor.to_dict()), 200
