
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Notification
from extensions import db

notifications_bp = Blueprint('notifications_bp', __name__)


@notifications_bp.route('', methods=['GET'])
@jwt_required()
def get_notifications():
    user_id = get_jwt_identity()

    unread_count = Notification.query.filter_by(
        user_id=user_id,
        is_read=False
    ).count()

    notifications = Notification.query.filter_by(
        user_id=user_id
    ).order_by(
        Notification.created_at.desc()
    ).limit(50).all()

    return jsonify({
        "unread_count": unread_count,
        "notifications": [
            notification.to_dict()
            for notification in notifications
        ]
    }), 200


@notifications_bp.route('/<int:notification_id>/read', methods=['PATCH'])
@jwt_required()
def mark_notification_read(notification_id):
    user_id = get_jwt_identity()

    notification = Notification.query.filter_by(
        id=notification_id,
        user_id=user_id
    ).first()

    if not notification:
        return jsonify({"error": "Notification not found"}), 404

    notification.is_read = True
    db.session.commit()

    return jsonify(notification.to_dict()), 200


@notifications_bp.route('/read-all', methods=['POST'])
@jwt_required()
def mark_all_notifications_read():
    user_id = get_jwt_identity()

    Notification.query.filter_by(
        user_id=user_id,
        is_read=False
    ).update(
        {"is_read": True},
        synchronize_session=False
    )

    db.session.commit()

    return jsonify({
        "message": "All notifications are marked as read"
    }), 200
