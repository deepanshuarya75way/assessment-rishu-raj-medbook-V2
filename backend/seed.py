import sys
import os

# Ensure backend folder is in path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from extensions import db
from models import User, Doctor, Appointment, ChatLog

def seed_database():
    app = create_app()
    with app.app_context():
        print("Clearing existing database tables...")
        db.drop_all()
        db.create_all()

        print("Seeding Users and Doctors...")
        # 1. Create Patients
        patient1 = User(
            name="Rahul Sharma",
            email="patient1@example.com",
            phone="+91 9876543210",
            role="patient"
        )
        patient1.set_password("password123")

        patient2 = User(
            name="Priya Patel",
            email="patient2@example.com",
            phone="+91 9876543211",
            role="patient"
        )
        patient2.set_password("password123")

        db.session.add_all([patient1, patient2])
        db.session.commit()

        # 2. Doctors Data List
        doctors_data = [
            {
                "name": "Dr. Ananya Roy",
                "email": "dr.ananya@medbook.com",
                "phone": "+91 9811122233",
                "password": "doctorpassword",
                "specialization": "Cardiologist",
                "qualification": "MBBS, MD (Cardiology), DM",
                "experience_years": 14,
                "fee": 1200.00,
                "available_days": "Mon,Tue,Wed,Thu,Fri",
                "available_from": "09:00",
                "available_to": "16:00",
                "bio": "Senior Consultant Cardiologist specializing in interventional cardiology, heart rhythm disorders, and preventive cardiac care."
            },
            {
                "name": "Dr. Vikram Mehta",
                "email": "dr.vikram@medbook.com",
                "phone": "+91 9822233344",
                "password": "doctorpassword",
                "specialization": "Dermatologist",
                "qualification": "MBBS, MD (Dermatology & Venereology)",
                "experience_years": 9,
                "fee": 850.00,
                "available_days": "Mon,Wed,Fri,Sat",
                "available_from": "10:00",
                "available_to": "17:00",
                "bio": "Expert clinical dermatologist focusing on acne treatments, eczema, hair loss therapy, and modern skin rejuvenation."
            },
            {
                "name": "Dr. Sunita Rao",
                "email": "dr.sunita@medbook.com",
                "phone": "+91 9833344455",
                "password": "doctorpassword",
                "specialization": "Neurologist",
                "qualification": "MBBS, MD, DM (Neurology)",
                "experience_years": 16,
                "fee": 1500.00,
                "available_days": "Tue,Thu,Sat",
                "available_from": "09:30",
                "available_to": "15:30",
                "bio": "Leading neurologist with extensive experience in migraine treatment, stroke management, and nerve disorder therapy."
            },
            {
                "name": "Dr. Rajesh Gupta",
                "email": "dr.rajesh@medbook.com",
                "phone": "+91 9844455566",
                "password": "doctorpassword",
                "specialization": "Orthopedic",
                "qualification": "MBBS, MS (Orthopedics), M.Ch",
                "experience_years": 11,
                "fee": 1000.00,
                "available_days": "Mon,Tue,Wed,Thu,Fri",
                "available_from": "11:00",
                "available_to": "18:00",
                "bio": "Orthopedic surgeon specializing in joint replacement, sports injury rehab, back pain, and bone fracture restoration."
            },
            {
                "name": "Dr. Sneha Verma",
                "email": "dr.sneha@medbook.com",
                "phone": "+91 9855566677",
                "password": "doctorpassword",
                "specialization": "Pediatrician",
                "qualification": "MBBS, MD (Pediatrics), DCH",
                "experience_years": 8,
                "fee": 700.00,
                "available_days": "Mon,Tue,Wed,Thu,Fri,Sat",
                "available_from": "09:00",
                "available_to": "16:00",
                "bio": "Compassionate child specialist with expertise in pediatric growth tracking, newborn care, immunizations, and child fever."
            },
            {
                "name": "Dr. Meera Kapoor",
                "email": "dr.meera@medbook.com",
                "phone": "+91 9866677788",
                "password": "doctorpassword",
                "specialization": "Gynecologist",
                "qualification": "MBBS, MS (Obstetrics & Gynecology)",
                "experience_years": 13,
                "fee": 1100.00,
                "available_days": "Mon,Wed,Thu,Sat",
                "available_from": "10:00",
                "available_to": "16:00",
                "bio": "Senior gynecologist and obstetrician providing comprehensive women's healthcare, PCOS management, and high-risk pregnancy care."
            },
            {
                "name": "Dr. Amit Joshi",
                "email": "dr.amit@medbook.com",
                "phone": "+91 9877788899",
                "password": "doctorpassword",
                "specialization": "ENT Specialist",
                "qualification": "MBBS, MS (Otorhinolaryngology)",
                "experience_years": 10,
                "fee": 900.00,
                "available_days": "Tue,Wed,Fri,Sat",
                "available_from": "10:00",
                "available_to": "17:00",
                "bio": "Ear, Nose, Throat surgeon specializing in sinus surgery, hearing restoration, tonsil infection, and throat care."
            },
            {
                "name": "Dr. Suresh Iyer",
                "email": "dr.suresh@medbook.com",
                "phone": "+91 9888899900",
                "password": "doctorpassword",
                "specialization": "General Physician",
                "qualification": "MBBS, MD (General Medicine)",
                "experience_years": 12,
                "fee": 500.00,
                "available_days": "Mon,Tue,Wed,Thu,Fri,Sat",
                "available_from": "08:00",
                "available_to": "18:00",
                "bio": "Primary care physician dedicated to holistic health management, chronic disease prevention, seasonal illness, and general checkups."
            },
            {
                "name": "Dr. Neha Sharma",
                "email": "dr.neha@medbook.com",
                "phone": "+91 9899900011",
                "password": "doctorpassword",
                "specialization": "Psychiatrist",
                "qualification": "MBBS, MD (Psychiatry)",
                "experience_years": 9,
                "fee": 1300.00,
                "available_days": "Mon,Tue,Thu,Fri",
                "available_from": "11:00",
                "available_to": "17:00",
                "bio": "Consultant psychiatrist specializing in anxiety disorders, depression therapy, stress management, and sleep wellness."
            }
        ]

        created_doctors = []
        for doc_info in doctors_data:
            user = User(
                name=doc_info["name"],
                email=doc_info["email"],
                phone=doc_info["phone"],
                role="doctor"
            )
            user.set_password(doc_info["password"])
            db.session.add(user)
            db.session.flush()

            doctor = Doctor(
                user_id=user.id,
                specialization=doc_info["specialization"],
                qualification=doc_info["qualification"],
                experience_years=doc_info["experience_years"],
                fee=doc_info["fee"],
                available_days=doc_info["available_days"],
                available_from=doc_info["available_from"],
                available_to=doc_info["available_to"],
                bio=doc_info["bio"]
            )
            db.session.add(doctor)
            created_doctors.append(doctor)

        db.session.commit()

        # 3. Seed Sample Appointments
        print("Seeding Sample Appointments...")
        apt1 = Appointment(
            patient_id=patient1.id,
            doctor_id=created_doctors[0].id, # Dr. Ananya Roy (Cardiologist)
            date="2026-10-20",
            time="10:00",
            reason="Chest discomfort and mild palpitations during exercise",
            status="pending"
        )
        apt2 = Appointment(
            patient_id=patient2.id,
            doctor_id=created_doctors[1].id, # Dr. Vikram Mehta (Dermatologist)
            date="2026-10-21",
            time="11:00",
            reason="Skin rash and persistent itching on forearm",
            status="confirmed"
        )
        apt3 = Appointment(
            patient_id=patient1.id,
            doctor_id=created_doctors[7].id, # Dr. Suresh Iyer (General Physician)
            date="2026-10-15",
            time="09:00",
            reason="Routine health checkup and blood pressure monitoring",
            status="completed"
        )
        db.session.add_all([apt1, apt2, apt3])
        db.session.commit()

        print("\n========================================================")
        print("         MEDBOOK DATABASE SEEDED SUCCESSFULLY!          ")
        print("========================================================")
        print("DEMO CREDENTIALS:")
        print("--------------------------------------------------------")
        print("PATIENT 1:")
        print("  Email:    patient1@example.com")
        print("  Password: password123")
        print("PATIENT 2:")
        print("  Email:    patient2@example.com")
        print("  Password: password123")
        print("\nDOCTORS (Password for all: doctorpassword):")
        for d in created_doctors:
            print(f"  - {d.specialization:18s} | {d.user.name:20s} | Email: {d.user.email}")
        print("========================================================\n")

if __name__ == "__main__":
    seed_database()
