# MedBook Entity Relationship (ER) Diagram

Below is the Mermaid ER Diagram representing the 4 core database tables in MedBook (`users`, `doctors`, `appointments`, `chat_logs`) and their foreign key relationships.

```mermaid
erDiagram
    users ||--o| doctors : "has 1-to-1 doctor profile"
    users ||--o{ appointments : "books as patient"
    doctors ||--o{ appointments : "receives bookings"
    users ||--o{ chat_logs : "logs chat history (nullable)"

    users {
        int id PK "Auto Increment"
        string name "NOT NULL"
        string email "UNIQUE, NOT NULL"
        string phone "NOT NULL"
        string password_hash "NOT NULL"
        enum role "patient | doctor"
        datetime created_at "DEFAULT CURRENT_TIMESTAMP"
    }

    doctors {
        int id PK "Auto Increment"
        int user_id FK "FK -> users.id, UNIQUE"
        string specialization "Cardiologist, Dermatologist, etc."
        string qualification "Degree/Certifications"
        int experience_years "Years of practice"
        decimal fee "Consultation Fee in INR"
        string available_days "e.g. Mon,Tue,Wed,Thu,Fri"
        string available_from "HH:MM (24-hour)"
        string available_to "HH:MM (24-hour)"
        text bio "Optional overview"
    }

    appointments {
        int id PK "Auto Increment"
        int patient_id FK "FK -> users.id"
        int doctor_id FK "FK -> doctors.id"
        string date "YYYY-MM-DD"
        string time "HH:MM"
        text reason "Patient consultation reason"
        enum status "pending | confirmed | cancelled | completed"
        datetime created_at "DEFAULT CURRENT_TIMESTAMP"
    }

    chat_logs {
        int id PK "Auto Increment"
        int user_id FK "FK -> users.id (NULLABLE)"
        text message "User input query"
        text response "AI assistant reply"
        datetime created_at "DEFAULT CURRENT_TIMESTAMP"
    }
```

## Entity Constraints & Business Rules
1. **1-to-1 User to Doctor**: Each record in `doctors` is tied uniquely to a `users` record where `role = 'doctor'`.
2. **Double Booking Prevention**: The `appointments` table enforces a unique index on `(doctor_id, date, time)` for non-cancelled appointments.
3. **Nullable Chat Logs**: Guests can use the AI Assistant before logging in; in this case `chat_logs.user_id` is set to `NULL`.
