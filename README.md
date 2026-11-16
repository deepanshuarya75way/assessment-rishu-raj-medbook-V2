# MedBook – AI-Powered Online Doctor Appointment System

[![Python](https://img.shields.io/badge/Python-3.13-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.1.0-green.svg)](https://flask.palletsprojects.com/)
[![React](https://img.shields.io/badge/React-19.0-cyan.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-purple.svg)](https://vitejs.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg)](https://www.mysql.com/)

**MedBook** is a production-ready, three-tier online doctor appointment platform built for college project submission. It connects patients with qualified medical specialists, streamlines booking workflows, and provides an instant symptom-to-specialist AI assistant.

---

## 🌟 Key Features

1. **Role-Based Portals**: Separate workflows for **Patients** (find doctors, book 30-min slots, view/cancel appointments) and **Doctors** (manage requests, confirm slots, mark visits completed, track revenue).
2. **AI Symptom Assistant**: Rule-based keyword matching algorithm across 9 medical specializations, instant emergency warning detection (112/108 India), live top 3 doctor recommendations, and automatic chat logging.
3. **Double-Booking & Schedule Protection**: Validates doctor weekday availability, operating hours (`available_from` - `available_to`), prevents booking past dates, and enforces unique slot restrictions.
4. **JWT Security & Password Hashing**: Hashed passwords using Werkzeug security, JWT authentication tokens with 24-hour expiry, and backend decorator role enforcement (`patient` vs `doctor`).
5. **Zero Friction Database**: Runs on MySQL with SQLAlchemy ORM + PyMySQL, and includes automatic SQLite fallback support for instant local execution without database setup headaches.

---

## 🛠️ Tech Stack

- **Frontend**: React 19 (Vite), React Router v6, Axios, Tailwind CSS v4, Lucide Icons
- **Backend**: Python 3.13, Flask (Blueprints architecture), Flask-SQLAlchemy, Flask-JWT-Extended, PyMySQL, Werkzeug, Pytest
- **Database**: MySQL (`database/schema.sql`) / SQLite (`backend/medbook.db` fallback)
- **AI Triage**: Rule-based keyword & intent analyzer with stubbed `call_llm_api()` function for swapping OpenAI / Anthropic APIs via `USE_LLM=true`

---

## 📁 Repository Folder Structure

```
medbook/
├── backend/
│   ├── app.py                  # Flask app factory, CORS, JWT error handlers, blueprints
│   ├── config.py               # Reads .env (DB URL, JWT secrets, USE_LLM flag)
│   ├── extensions.py           # SQLAlchemy (db) and JWTManager (jwt) instances
│   ├── models.py               # User, Doctor, Appointment, ChatLog SQLAlchemy models
│   ├── routes/
│   │   ├── auth.py             # Register, login, me endpoints
│   │   ├── doctors.py          # Doctors directory, search, specializations list
│   │   ├── appointments.py     # Booking flow, weekday/slot validation, status updates
│   │   └── assistant.py        # Rule-based AI symptom matcher & stubbed call_llm_api()
│   ├── utils/decorators.py     # @role_required('patient'/'doctor') authorization decorator
│   ├── seed.py                 # Seeding script with 2 patients, 9 doctors, demo appointments
│   ├── tests/                  # Pytest suite for auth, double-booking, permissions, AI assistant
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/axios.js        # Axios instance with JWT bearer token interceptor & 401 redirect
│   │   ├── context/AuthContext.jsx # React AuthContext for state & persistence
│   │   ├── components/         # Navbar, Footer, DoctorCard, StatusBadge, ProtectedRoute, ChatWidget
│   │   ├── pages/              # Home, Login, Register, Doctors, DoctorDetail, BookAppointment, MyAppointments, DoctorDashboard, NotFound
│   │   ├── App.jsx, main.jsx, index.css
│   └── package.json, vite.config.js, .env.example
├── database/
│   └── schema.sql              # Clean MySQL DDL SQL schema
├── docs/
│   ├── ER-diagram.md           # Mermaid ER diagram
│   └── demo-script.md          # 5-minute presentation script
└── README.md
```

---

## 🔑 Demo Login Credentials

Run `python backend/seed.py` to seed the database with the following demo credentials:

### 👤 Patients (Password for all: `password123`)
| Name | Email | Role |
| :--- | :--- | :--- |
| **Rahul Sharma** | `patient1@example.com` | Patient |
| **Priya Patel** | `patient2@example.com` | Patient |

### 🩺 Doctors (Password for all: `doctorpassword`)
| Specialization | Doctor Name | Email | Qualification | Fee (₹) |
| :--- | :--- | :--- | :--- | :--- |
| **Cardiologist** | Dr. Ananya Roy | `dr.ananya@medbook.com` | MBBS, MD (Cardiology), DM | ₹1,200 |
| **Dermatologist** | Dr. Vikram Mehta | `dr.vikram@medbook.com` | MBBS, MD (Dermatology) | ₹850 |
| **Neurologist** | Dr. Sunita Rao | `dr.sunita@medbook.com` | MBBS, MD, DM (Neurology) | ₹1,500 |
| **Orthopedic** | Dr. Rajesh Gupta | `dr.rajesh@medbook.com` | MBBS, MS (Orthopedics) | ₹1,000 |
| **Pediatrician** | Dr. Sneha Verma | `dr.sneha@medbook.com` | MBBS, MD (Pediatrics) | ₹700 |
| **Gynecologist** | Dr. Meera Kapoor | `dr.meera@medbook.com` | MBBS, MS (OB-GYN) | ₹1,100 |
| **ENT Specialist** | Dr. Amit Joshi | `dr.amit@medbook.com` | MBBS, MS (ENT) | ₹900 |
| **General Physician** | Dr. Suresh Iyer | `dr.suresh@medbook.com` | MBBS, MD (Gen Med) | ₹500 |
| **Psychiatrist** | Dr. Neha Sharma | `dr.neha@medbook.com` | MBBS, MD (Psychiatry) | ₹1,300 |

---

## 🚀 Setup & Execution Guide (Windows / Mac / Linux)

### Prerequisites
- **Python** 3.10+ installed
- **Node.js** v18+ & **npm** installed
- **MySQL Server** (optional; if MySQL is not running locally, backend automatically falls back to SQLite `backend/medbook.db`)

---

### Step 1: Clone Repository & Backend Setup

```bash
# Navigate to project directory
cd medbook/backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows (Command Prompt):
# venv\Scripts\activate.bat

# Upgrade pip & install backend dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

---

### Step 2: Database Configuration & Seeding

#### Option A: MySQL (Default)
1. Start your local MySQL service (e.g. XAMPP / MariaDB / Brew MySQL).
2. Create database using schema SQL:
   ```bash
   mysql -u root -p < ../database/schema.sql
   ```
3. Set your connection string in `backend/.env`:
   ```env
   DATABASE_URL=mysql+pymysql://root:password@localhost/medbook_db
   SECRET_KEY=medbook_super_secret_jwt_key_2026
   JWT_SECRET_KEY=medbook_super_secret_jwt_key_2026
   USE_LLM=false
   ```

#### Option B: SQLite (Automatic Fallback)
If MySQL is not installed or unreachable, the system automatically creates `backend/medbook.db`.

#### Run Seed Script:
```bash
python seed.py
```
*(This creates database tables and inserts demo patients, 9 doctors, and sample appointments).*

---

### Step 3: Start Backend Flask Server

```bash
python app.py
```
Backend REST API will run on `http://localhost:5001`.

---

### Step 4: Frontend Setup & Start Dev Server

Open a new terminal window:

```bash
cd medbook/frontend

# Install node dependencies
npm install

# Start Vite React development server
npm run dev
```
Frontend Web App will run on `http://localhost:5173`.

---

### Step 5: Run Backend Pytest Test Suite

To run automated unit tests:

```bash
cd medbook/backend
pytest tests/ -v
```

---

## 📡 REST API Reference Table

All API endpoints return JSON and use consistent error formats (`{"error": "message"}`).

| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | None | Public | Register new patient or doctor account |
| `POST` | `/api/auth/login` | None | Public | User login, returns JWT token & user profile |
| `GET` | `/api/auth/me` | JWT | Any | Get current logged-in user profile |
| `GET` | `/api/doctors` | None | Public | Search doctors by `?specialization=` & `?q=` |
| `GET` | `/api/doctors/:id` | None | Public | Get doctor public profile details |
| `GET` | `/api/doctors/specializations` | None | Public | Get distinct list of specializations |
| `POST` | `/api/appointments` | JWT | Patient | Book appointment (validates date, weekday, slot) |
| `GET` | `/api/appointments/mine` | JWT | Patient | List patient's booked appointments |
| `GET` | `/api/appointments/doctor` | JWT | Doctor | List doctor's incoming appointment requests |
| `GET` | `/api/appointments/booked-slots` | None | Public | Get list of taken slots for doctor on date |
| `PATCH`| `/api/appointments/:id/status` | JWT | Doctor/Patient | Update appointment status (`confirmed`/`cancelled`/`completed`) |
| `POST` | `/api/assistant/chat` | Optional | Any | Rule-based AI symptom analysis & recommendations |

---

## 🤖 AI Assistant Keyword & Intent Map

| Department | Target Keywords |
| :--- | :--- |
| **Cardiologist** | chest pain, heart, palpitation, breathless, shortness of breath, blood pressure, bp |
| **Dermatologist** | skin, rash, acne, itching, pimple, hair fall, eczema, allergy on skin |
| **Neurologist** | headache, migraine, seizure, dizziness, numbness, memory loss |
| **Orthopedic** | bone, joint, knee, back pain, fracture, shoulder, neck pain, arthritis |
| **Pediatrician** | child, baby, infant, kid fever, vaccination |
| **Gynecologist** | pregnancy, periods, menstrual, pcos, women's health |
| **ENT Specialist** | ear, throat, nose, sinus, tonsil, hearing |
| **Psychiatrist** | anxiety, depression, stress, sleep problem, panic |
| **General Physician**| fever, cold, cough, flu, fatigue, weakness, body ache, stomach (default fallback) |

### 🚨 Emergency Trigger Keywords
`severe chest pain`, `unconscious`, `heavy bleeding`, `suicide`, `can't breathe`, `stroke`, `heart attack`.
*Response*: Immediate high-priority warning alerting user to call **112 / 108 (India Emergency)** or visit the nearest hospital.

---

## 🔮 Future Scope & Extension Points

1. **Real LLM Integration**: Un-comment the OpenAI / Anthropic client code in `backend/routes/assistant.py` and set `USE_LLM=true` in `.env`.
2. **Live Calendar & Time-Slot Dragging**: Integrate FullCalendar or Date-fns for interactive calendar drag-and-drop booking.
3. **Admin Analytics Dashboard**: Add admin user role to view platform revenue charts, doctor ratings, and system logs.
4. **Cloud Deployment**: Containerize with Docker & Docker-Compose for deployment to AWS ECS / Google Cloud Run / Vercel + Render.
