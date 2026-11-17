
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(20), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='patient') # 'patient' or 'doctor'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    doctor_profile = db.relationship('Doctor', backref='user', uselist=False, cascade="all, delete-orphan")
    patient_appointments = db.relationship('Appointment', foreign_keys='Appointment.patient_id', backref='patient', lazy=True)
    chat_logs = db.relationship('ChatLog', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        doctor_id = self.doctor_profile.id if self.doctor_profile else None
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "role": self.role,
            "doctor_id": doctor_id,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class Doctor(db.Model):
    __tablename__ = 'doctors'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    specialization = db.Column(db.String(100), nullable=False, index=True)
    qualification = db.Column(db.String(150), nullable=False)
    experience_years = db.Column(db.Integer, nullable=False)
    fee = db.Column(db.Numeric(10, 2), nullable=False)
    available_days = db.Column(db.String(100), nullable=False) # e.g. "Mon,Tue,Wed,Thu,Fri"
    available_from = db.Column(db.String(10), nullable=False) # e.g. "09:00"
    available_to = db.Column(db.String(10), nullable=False)   # e.g. "17:00"
    bio = db.Column(db.Text, nullable=True)

    # Relationships
    appointments = db.relationship('Appointment', foreign_keys='Appointment.doctor_id', backref='doctor', lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.user.name if self.user else "",
            "email": self.user.email if self.user else "",
            "phone": self.user.phone if self.user else "",
            "specialization": self.specialization,
            "qualification": self.qualification,
            "experience_years": self.experience_years,
            "fee": float(self.fee) if self.fee is not None else 0.0,
            "available_days": self.available_days,
            "available_from": self.available_from,
            "available_to": self.available_to,
            "bio": self.bio or ""
        }


class Appointment(db.Model):
    __tablename__ = 'appointments'

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id'), nullable=False)
    date = db.Column(db.String(10), nullable=False) # "YYYY-MM-DD"
    time = db.Column(db.String(10), nullable=False) # "HH:MM"
    reason = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='pending') # 'pending', 'confirmed', 'cancelled', 'completed'
    status_note = db.Column(db.Text, nullable=True)
    rescheduled_from = db.Column(db.String(20), nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "patient_name": self.patient.name if self.patient else "",
            "patient_phone": self.patient.phone if self.patient else "",
            "patient_email": self.patient.email if self.patient else "",
            "doctor_id": self.doctor_id,
            "doctor_name": self.doctor.user.name if (self.doctor and self.doctor.user) else "",
            "doctor_specialization": self.doctor.specialization if self.doctor else "",
            "doctor_fee": float(self.doctor.fee) if (self.doctor and self.doctor.fee) else 0.0,
            "date": self.date,
            "time": self.time,
            "reason": self.reason,
            "status": self.status,
            "status_note": self.status_note,
            "rescheduled_from": self.rescheduled_from,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class DoctorBlackout(db.Model):
    __tablename__ = 'doctor_blackouts'

    id = db.Column(db.Integer, primary_key=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id'), nullable=False, index=True)
    start_date = db.Column(db.String(10), nullable=False)
    end_date = db.Column(db.String(10), nullable=False)
    start_time = db.Column(db.String(5), nullable=True)
    end_time = db.Column(db.String(5), nullable=True)
    category = db.Column(db.String(30), default='leave')
    note = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    doctor = db.relationship('Doctor', backref=db.backref('blackouts', cascade="all, delete-orphan"))

    def to_dict(self):
        return {
            "id": self.id,
            "doctor_id": self.doctor_id,
            "start_date": self.start_date,
            "end_date": self.end_date,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "category": self.category,
            "note": self.note or "",
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "all_day": self.start_time is None
        }


class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    appointment_id = db.Column(db.Integer, db.ForeignKey('appointments.id'), nullable=True)
    type = db.Column(db.String(30), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "appointment_id": self.appointment_id,
            "type": self.type,
            "message": self.message,
            "is_read": self.is_read,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class ChatLog(db.Model):
    __tablename__ = 'chat_logs'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    message = db.Column(db.Text, nullable=False)
    response = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "message": self.message,
            "response": self.response,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
