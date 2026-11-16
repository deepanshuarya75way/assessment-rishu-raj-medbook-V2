from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from extensions import db
from models import User

def role_required(*roles):
    """
    Decorator to enforce role-based access control.
    Accepts one or more roles e.g. @role_required('patient') or @role_required('doctor', 'patient')
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            if isinstance(user_id, dict):
                user_id = user_id.get("id")

            user = db.session.get(User, int(user_id))
            if not user:
                return jsonify({"error": "User not found"}), 404

            if user.role not in roles:
                return jsonify({"error": f"Forbidden. Required role: {', '.join(roles)}"}), 403
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator
