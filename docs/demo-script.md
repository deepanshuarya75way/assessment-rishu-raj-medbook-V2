# MedBook – 5-Minute Demonstration Walkthrough Script

This script provides a step-by-step guide for presenting MedBook during project evaluation or video submission.

---

## Part 1: Project Overview & Landing Page (1 Minute)
1. **Open Application**: Navigate to `http://localhost:5173/`.
2. **Present Value Proposition**: Explain that MedBook solves phone-tag scheduling, lack of specialist awareness, and notebook appointment tracking.
3. **Hero Banner & Features**: Highlight the clean modern medical interface, quick CTA buttons, and key feature badges.
4. **Specializations Grid**: Scroll through the 9 medical departments (Cardiology, Dermatology, Neurology, Orthopedics, Pediatrics, Gynecology, ENT, General Physician, Psychiatry).

---

## Part 2: AI Health Assistant Demo (1.5 Minutes)
1. **Trigger Floating Widget**: Click the floating **AI Health Assistant** bot button at the bottom-right corner of any page.
2. **Test Symptom Triage**:
   - Type: `"I have chest pain and I feel a bit breathless"`
   - Click Send.
3. **Showcase AI Intelligence**:
   - Point out that the assistant analyzes symptoms using keyword scoring and recommends a **Cardiologist**.
   - Note the **Medical Disclaimer** included in every symptom response.
   - Point out the **Live Doctor Recommendation Cards** rendered directly inside the chat bubble with direct `"Book Now"` links.
4. **Test Emergency Warning**:
   - Type: `"My friend is unconscious and cannot breathe"`
   - Observe the immediate high-priority **🚨 EMERGENCY WARNING** prompting the user to call 112/108 emergency services.

---

## Part 3: Patient Booking Flow (1.5 Minutes)
1. **Log In as Patient**:
   - Go to `/login`.
   - Click the **"Patient Demo"** quick-fill button (`patient1@example.com` / `password123`).
   - Click **Sign In**.
2. **Search Doctors**:
   - Navigate to `/doctors`.
   - Use the specialization filter dropdown to select **Dermatologist** or search by doctor name `"Dr. Vikram"`.
   - Click **"Book Now"**.
3. **Select Slot & Book**:
   - Pick an available working date. Show how invalid non-working weekdays trigger a helpful warning message.
   - Select a 30-minute time slot (e.g. `10:00`). Show how already booked slots are automatically disabled.
   - Enter consultation reason: `"Skin rash and itching on arm for 3 days"`.
   - Click **Confirm Appointment**.
4. **Verify Booking**:
   - Observe automatic redirect to `/my-appointments`.
   - Point out the colored **Pending** status badge, appointment details, fee, and option to cancel if needed.

---

## Part 4: Doctor Dashboard & Management (1 Minute)
1. **Log Out & Switch Role**:
   - Click **Logout** from top navigation bar.
   - Go to `/login`.
   - Click **"Doctor Demo"** quick-fill button (`dr.ananya@medbook.com` / `doctorpassword`).
   - Click **Sign In**.
2. **Review Dashboard Stats**:
   - Observe the real-time statistics cards: **Pending Requests**, **Confirmed Slots**, **Completed Visits**, and **Earned Revenue (₹)**.
3. **Manage Incoming Requests**:
   - Use the status filter tabs (**All**, **Pending**, **Confirmed**, **Completed**).
   - Find the patient booking request.
   - Click **"Confirm Slot"** to update status to **Confirmed**.
   - Show how the status badge changes immediately and stats update in real-time.

---

## Summary of Key Highlights
- **End-to-End Three-Tier Workflow**: Seamless integration between Patients, AI Assistant, and Doctors.
- **Robust Validation**: Weekday availability checking, past-date restriction, and double-booking prevention.
- **Zero API Key Requirement**: Rule-based AI symptom matcher with stubbed LLM API call for future expansion.
