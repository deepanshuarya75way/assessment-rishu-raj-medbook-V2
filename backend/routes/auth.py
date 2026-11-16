import re
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from extensions import db
from models import User, Doctor

auth_bp = Blueprint('auth', __name__)

EMAIL_REGEX = r'^[\w\.-]+@[\w\.-]+\.\w+$'

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    phone = data.get('phone', '').strip()
    password = data.get('password', '')
    role = data.get('role', 'patient').strip().lower()

    if not name or not email or not phone or not password:
        return jsonify({"error": "Name, email, phone, and password are required."}), 400

    if not re.match(EMAIL_REGEX, email):
        return jsonify({"error": "Invalid email format."}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long."}), 400

    if role not in ['patient', 'doctor']:
        return jsonify({"error": "Role must be either 'patient' or 'doctor'."}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email address is already registered."}), 409

    # If role is doctor, validate doctor-specific fields
    if role == 'doctor':
        specialization = data.get('specialization', '').strip()
        qualification = data.get('qualification', '').strip()
        experience_years = data.get('experience_years')
        fee = data.get('fee')
        available_days = data.get('available_days', '').strip()
        available_from = data.get('available_from', '').strip()
        available_to = data.get('available_to', '').strip()

        if not specialization or not qualification or experience_years is None or fee is None or not available_days or not available_from or not available_to:
            return jsonify({"error": "All doctor profile fields (specialization, qualification, experience, fee, days, working hours) are required."}), 400

        try:
            experience_years = int(experience_years)
            fee = float(fee)
        except ValueError:
            return jsonify({"error": "Experience must be an integer and fee must be a valid number."}), 400

    try:
        new_user = User(
            name=name,
            email=email,
            phone=phone,
            role=role
        )
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.flush()

        doctor_profile = None
        if role == 'doctor':
            doctor_profile = Doctor(
                user_id=new_user.id,
                specialization=data.get('specialization', '').strip(),
                qualification=data.get('qualification', '').strip(),
                experience_years=int(data.get('experience_years')),
                fee=float(data.get('fee')),
                available_days=data.get('available_days', '').strip(),
                available_from=data.get('available_from', '').strip(),
                available_to=data.get('available_to', '').strip(),
                bio=data.get('bio', '').strip()
            )
            db.session.add(doctor_profile)

        db.session.commit()

        # Create JWT token
        access_token = create_access_token(identity=str(new_user.id))
        user_dict = new_user.to_dict()

        return jsonify({
            "message": "User registered successfully",
            "access_token": access_token,
            "user": user_dict
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to register user: {str(e)}"}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password."}), 401

    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        "access_token": access_token,
        "user": user.to_dict()
    }), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    current_user_id = get_jwt_identity()
    user = db.session.get(User, int(current_user_id))
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": user.to_dict()}), 200
