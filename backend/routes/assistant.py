import re
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from models import Doctor, ChatLog
from extensions import db

assistant_bp = Blueprint('assistant', __name__)

# Keyword to Specialization Map
SPECIALIZATION_KEYWORDS = {
    "Cardiologist": [
        "chest pain", "heart", "palpitation", "breathless", "shortness of breath", 
        "blood pressure", "bp", "cardiac", "chest tight"
    ],
    "Dermatologist": [
        "skin", "rash", "acne", "itching", "pimple", "hair fall", "eczema", 
        "allergy on skin", "derma", "scalp", "skin lesion"
    ],
    "Neurologist": [
        "headache", "migraine", "seizure", "dizziness", "numbness", "memory loss", 
        "neuro", "brain", "paralysis", "tremor"
    ],
    "Orthopedic": [
        "bone", "joint", "knee", "back pain", "fracture", "shoulder", "neck pain", 
        "arthritis", "sprain", "ligament"
    ],
    "Pediatrician": [
        "child", "baby", "infant", "kid fever", "vaccination", "pediatric", 
        "toddler", "childhood"
    ],
    "Gynecologist": [
        "pregnancy", "periods", "menstrual", "pcos", "women's health", "gynec", 
        "uterus", "cramps", "ovarian"
    ],
    "ENT Specialist": [
        "ear", "throat", "nose", "sinus", "tonsil", "hearing", "earache", "sore throat"
    ],
    "Psychiatrist": [
        "anxiety", "depression", "stress", "sleep problem", "panic", "mental health", 
        "insomnia", "mood swing"
    ],
    "General Physician": [
        "fever", "cold", "cough", "flu", "fatigue", "weakness", "body ache", "stomach", 
        "headache mild", "vomiting", "nausea", "indigestion"
    ]
}

EMERGENCY_KEYWORDS = [
    "severe chest pain", "unconscious", "heavy bleeding", "suicide", "can't breathe",
    "cannot breathe", "stroke", "heart attack", "poison", "unresponsive"
]

DISCLAIMER = "\n\n⚠️ Disclaimer: I am an AI symptom guide and not a medical doctor. This guidance is for informational purposes only. Please consult a qualified medical professional."

EMERGENCY_MESSAGE = "🚨 URGENT EMERGENCY WARNING: Your message mentions severe or critical symptoms. Please seek immediate emergency medical treatment! Call emergency services (112 or 108 in India) or go to the nearest hospital immediately."


def call_llm_api(message: str, context: dict = None) -> str:
    """
    STUB FUNCTION for future LLM integration (e.g. Anthropic Claude or OpenAI GPT-4).
    To use a real LLM:
    1. Install `anthropic` or `openai` package.
    2. Set USE_LLM=true in your .env file and set ANTHROPIC_API_KEY / OPENAI_API_KEY.
    3. Uncomment the integration block below.
    """
    # Example OpenAI Integration:
    # import openai
    # response = openai.ChatCompletion.create(
    #     model="gpt-4o-mini",
    #     messages=[
    #         {"role": "system", "content": "You are a helpful medical symptom triage assistant for MedBook."},
    #         {"role": "user", "content": message}
    #     ]
    # )
    # return response.choices[0].message.content
    
    # Example Anthropic Integration:
    # import anthropic
    # client = anthropic.Anthropic()
    # response = client.messages.create(
    #     model="claude-3-5-sonnet-20241022",
    #     max_tokens=300,
    #     messages=[{"role": "user", "content": message}]
    # )
    # return response.content[0].text

    return f"Stub LLM Response for: '{message}'"


def analyze_intent_and_symptoms(message: str):
    normalized = re.sub(r'[^\w\s]', '', message.lower()).strip()

    # 1. Emergency Detection
    for kw in EMERGENCY_KEYWORDS:
        if kw in normalized:
            return {
                "type": "emergency",
                "reply": EMERGENCY_MESSAGE,
                "suggested_specialization": "Cardiologist",
                "doctors": []
            }

    # 2. Canned Intent Detection
    if any(g in normalized for g in ["hi", "hello", "hey", "good morning", "good evening", "greetings"]):
        return {
            "type": "intent",
            "reply": "Hello! I am your MedBook AI Health Assistant. Describe your symptoms (e.g. 'I have a headache' or 'I have chest pain') and I will help match you with the right specialist!",
            "suggested_specialization": None,
            "doctors": []
        }

    if any(b in normalized for b in ["how to book", "book appointment", "booking steps", "how do i book"]):
        return {
            "type": "intent",
            "reply": "To book an appointment:\n1. Search for a doctor or specialization on the Doctors page.\n2. Click 'Book Appointment'.\n3. Pick an available date and time slot, enter your reason, and submit!",
            "suggested_specialization": None,
            "doctors": []
        }

    if any(c in normalized for c in ["cancel appointment", "cancellation", "how to cancel"]):
        return {
            "type": "intent",
            "reply": "You can cancel any pending or confirmed appointment anytime by going to 'My Appointments' from the top navigation bar and clicking the 'Cancel' button.",
            "suggested_specialization": None,
            "doctors": []
        }

    if any(w in normalized for w in ["what can you do", "features", "who are you", "help"]):
        return {
            "type": "intent",
            "reply": "I can analyze your physical or mental symptoms, recommend the most suitable medical specialist, show you available doctors with their fees, and guide you on booking appointments!",
            "suggested_specialization": None,
            "doctors": []
        }

    if any(t in normalized for t in ["thank you", "thanks", "thank"]):
        return {
            "type": "intent",
            "reply": "You're very welcome! Stay healthy and feel free to ask if you have any more health questions.",
            "suggested_specialization": None,
            "doctors": []
        }

    # 3. Rule-based Symptom Scoring
    scores = {}
    for spec, keywords in SPECIALIZATION_KEYWORDS.items():
        score = 0
        for kw in keywords:
            if kw in normalized:
                # Give extra weight if exact phrase match
                score += 2 if len(kw.split()) > 1 else 1
        if score > 0:
            scores[spec] = score

    if scores:
        best_spec = max(scores, key=scores.get)
        reply_text = f"Based on your symptoms ('{message}'), you should consider consulting a **{best_spec}**.{DISCLAIMER}"
    else:
        # Fallback to General Physician if vague
        best_spec = "General Physician"
        reply_text = f"Your symptoms sound general or unclear. Could you provide a bit more detail? In the meantime, consulting a **General Physician** is recommended for a primary checkup.{DISCLAIMER}"

    return {
        "type": "symptom",
        "reply": reply_text,
        "suggested_specialization": best_spec,
        "doctors": []
    }


@assistant_bp.route('/chat', methods=['POST'])
def chat():
    # Attempt to extract user_id if token provided
    user_id = None
    try:
        verify_jwt_in_request(optional=True)
        identity = get_jwt_identity()
        if identity:
            user_id = int(identity)
    except Exception:
        user_id = None

    data = request.get_json() or {}
    message = data.get('message', '').strip()

    if not message:
        return jsonify({"error": "Message is required."}), 400

    # Check if LLM integration is enabled via env
    use_llm = current_app.config.get("USE_LLM", False)
    if use_llm:
        reply_text = call_llm_api(message)
        suggested_spec = "General Physician"
    else:
        analysis = analyze_intent_and_symptoms(message)
        reply_text = analysis["reply"]
        suggested_spec = analysis["suggested_specialization"]

    # Pull up to 3 live matching doctors if specialization recommended
    matched_doctors = []
    if suggested_spec:
        docs = Doctor.query.filter(Doctor.specialization.ilike(f"%{suggested_spec}%")).limit(3).all()
        matched_doctors = [
            {
                "id": d.id,
                "name": d.user.name if d.user else "Dr. Unknown",
                "specialization": d.specialization,
                "experience_years": d.experience_years,
                "fee": float(d.fee),
                "available_days": d.available_days
            }
            for d in docs
        ]

    # Log to chat_logs table
    try:
        log_entry = ChatLog(
            user_id=user_id,
            message=message,
            response=reply_text
        )
        db.session.add(log_entry)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"[CHAT LOG ERROR] Failed to log chat: {e}")

    return jsonify({
        "reply": reply_text,
        "suggested_specialization": suggested_spec,
        "doctors": matched_doctors
    }), 200
