import os
import sqlalchemy
from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
from extensions import db, jwt

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Enable CORS for all frontend origins
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Check DB Connection and setup fallback to SQLite if MySQL is unreachable
    db_uri = app.config.get("SQLALCHEMY_DATABASE_URI", "")
    if db_uri.startswith("mysql"):
        try:
            engine = sqlalchemy.create_engine(db_uri, connect_args={"connect_timeout": 2})
            with engine.connect() as conn:
                pass
            print(f"[DB INFO] Successfully connected to MySQL at {db_uri}")
        except Exception as e:
            db_file_path = os.path.join(os.path.dirname(__file__), "medbook.db")
            fallback_uri = f"sqlite:///{db_file_path}"
            app.config["SQLALCHEMY_DATABASE_URI"] = fallback_uri
            print(f"[DB NOTICE] MySQL connection failed ({e}). Falling back to SQLite at {fallback_uri}")

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)

    # JWT Error handlers for consistent JSON error response format
    @jwt.unauthorized_loader
    def unauthorized_response(callback):
        return jsonify({"error": "Missing or invalid Authorization header token"}), 401

    @jwt.invalid_token_loader
    def invalid_token_response(callback):
        return jsonify({"error": "Invalid or corrupted access token"}), 401

    @jwt.expired_token_loader
    def expired_token_response(jwt_header, jwt_payload):
        return jsonify({"error": "Access token has expired. Please log in again."}), 401

    # Global Error Handlers
    @app.errorhandler(404)
    def handle_404(e):
        return jsonify({"error": "Requested resource not found"}), 404

    @app.errorhandler(500)
    def handle_500(e):
        return jsonify({"error": "Internal server error occurred"}), 500

    # Register Blueprints
    from routes.auth import auth_bp
    from routes.doctors import doctors_bp
    from routes.appointments import appointments_bp
    from routes.availability import availability_bp
    from routes.assistant import assistant_bp
    from routes.notifications import notifications_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(doctors_bp, url_prefix="/api/doctors")
    app.register_blueprint(appointments_bp, url_prefix="/api/appointments")
    app.register_blueprint(availability_bp, url_prefix="/api")
    app.register_blueprint(assistant_bp, url_prefix="/api/assistant")
    app.register_blueprint(notifications_bp, url_prefix="/api/notifications")

    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({"status": "ok", "message": "MedBook API is running"}), 200

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5001, debug=True)