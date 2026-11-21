from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from groq import Groq
from case_generator import generate_case
import os
import uuid
from virtual_patient import get_patient_response
from physical_assessment import perform_assessment
from evaluator import evaluate_session
from database import init_db, save_session, load_sessions, DB_PATH
import sqlite3
import json


# ============================================================
# SETUP
# ============================================================

load_dotenv()

API_KEY = os.getenv("GROQ_API_KEY")

if not API_KEY:
    raise ValueError("GROQ_API_KEY was not found in .env")

client = Groq(api_key=API_KEY)

app = Flask(__name__)
CORS(app)




# ============================================================
# TEMPORARY PRACTICE SESSION STORAGE
# ============================================================
# For the prototype, sessions are stored in memory.
# Later we can move these to the database.
#
# IMPORTANT:
# The complete generated case stays here on the backend.
# hidden_case is NEVER sent to the browser.

init_db()
practice_sessions = load_sessions()


# ============================================================
# HOME
# ============================================================

@app.route("/")
def home():
    return "MedLearn AI API is running! 🚀"


# ============================================================
# LEARNING CHAT
# ============================================================

@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "No data received"}), 400

        user_message = data.get("message", "").strip()

        if not user_message:
            return jsonify({"error": "No message provided"}), 400

        system_prompt = """
You are a nursing educator for the Physical Assessment & Health History course.

Your job is to help nursing students understand course concepts clearly.

Explain answers in a simple, educational, and student-friendly way.

If a question is outside nursing, physical assessment, health history,
or the provided course material, say that it is outside the course content.

Do not invent medical facts.
"""

        response = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": user_message,
                },
            ],
            temperature=0.3,
        )

        answer = response.choices[0].message.content

        return jsonify({
            "reply": answer
        })

    except Exception as e:
        print("CHAT ERROR:", str(e))

        return jsonify({
            "error": str(e)
        }), 500


# ============================================================
# ARABIC TRANSLATION
# ============================================================

@app.route("/translate", methods=["POST"])
def translate():

    print("🔥 TRANSLATE FUNCTION WAS CALLED 🔥")

    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "error": "No data received"
            }), 400

        text = data.get("text", "").strip()

        if not text:
            return jsonify({
                "error": "No text provided"
            }), 400

        translation_prompt = """
Translate the provided educational nursing content from English into clear,
natural Arabic for university nursing students.

Rules:

- Preserve the original meaning and medical accuracy.
- Do not add or remove medical information.
- Keep important medical and nursing terminology in English in parentheses
  after the Arabic term when useful for learning.
- Preserve headings, bullet points, numbered lists, and Markdown formatting.
- Do not translate citations, page numbers, URLs, or source identifiers.
- Return only the Arabic translation.
- Do not include an introduction.
- Do not include commentary.
"""

        response = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {
                    "role": "system",
                    "content": translation_prompt,
                },
                {
                    "role": "user",
                    "content": text,
                },
            ],
            temperature=0.1,
            max_tokens=6000,
        )

        print("\n========== TRANSLATION DEBUG ==========")

        print("FULL TRANSLATION RESPONSE:")
        print(response)

        print("\nTRANSLATION CONTENT:")
        print(repr(response.choices[0].message.content))

        print("=======================================\n")

        translation = response.choices[0].message.content

        return jsonify({
            "translation": translation
        })

    except Exception as e:

        print("\n❌ TRANSLATION ERROR:")
        print(str(e))

        return jsonify({
            "error": str(e)
        }), 500


# ============================================================
# PRACTICE - START SESSION
# ============================================================

@app.route("/practice/start", methods=["POST"])
def start_practice():
    try:
        data = request.get_json() or {}

        system = data.get("system", "cardiovascular").strip().lower()
        difficulty = data.get("difficulty", "medium").strip().lower()

        # ----------------------------------------------------
        # VALIDATE SYSTEM
        # ----------------------------------------------------

        allowed_systems = [
            "cardiovascular",
        ]

        if system not in allowed_systems:
            return jsonify({
                "error": "Unsupported body system"
            }), 400

        # ----------------------------------------------------
        # VALIDATE DIFFICULTY
        # ----------------------------------------------------

        allowed_difficulties = [
            "easy",
            "medium",
            "hard",
        ]

        if difficulty not in allowed_difficulties:
            return jsonify({
                "error": "Difficulty must be easy, medium, or hard"
            }), 400

        print("\n======================================")
        print("🩺 STARTING PRACTICE SESSION")
        print("System:", system)
        print("Difficulty:", difficulty)
        print("======================================")

        # ----------------------------------------------------
        # GENERATE THE REAL AI CASE
        # ----------------------------------------------------

        case_data = generate_case(
            system=system,
            difficulty=difficulty,
        )

        if not case_data:
            return jsonify({
                "error": "Failed to generate patient case"
            }), 500

        # ----------------------------------------------------
        # CREATE SESSION ID
        # ----------------------------------------------------

        session_id = str(uuid.uuid4())

        # ----------------------------------------------------
        # KEEP FULL CASE ON SERVER
        # ----------------------------------------------------

        practice_sessions[session_id] = {
      "user_id": data.get("user_id"),
      "case_data": case_data,
      "system": system,
      "difficulty": difficulty,
      "conversation_history": [],
      "assessment_history": [],
      "student_report": None,
      "evaluation": None,
}

        save_session(session_id, practice_sessions[session_id])

        # ----------------------------------------------------
        # ONLY SAFE PATIENT DATA GOES TO FRONTEND
        # ----------------------------------------------------

        student_view = case_data.get("student_view", {})

        patient = {
            "name": student_view.get("patient_name", ""),
            "age": student_view.get("age", ""),
            "sex": student_view.get("sex", ""),
            "occupation": student_view.get("occupation", ""),
            "setting": student_view.get("setting", ""),
            "chief_complaint": student_view.get(
                "chief_complaint",
                ""
            ),
        }

        print("✅ Practice case generated")
        print("Session ID:", session_id)
        print("Patient:", patient.get("name"))
        print("Hidden case remains on backend.")

        return jsonify({
            "success": True,
            "session_id": session_id,
            "system": system,
            "difficulty": difficulty,
            "patient": patient,
        })

    except Exception as e:

        print("\n❌ PRACTICE START ERROR:")
        print(str(e))

        return jsonify({
            "error": str(e)
        }), 500

# ============================================================
# PRACTICE - VIRTUAL PATIENT CHAT
# ============================================================

@app.route("/practice/<session_id>/chat", methods=["POST"])
def practice_chat(session_id):
    try:
        # ----------------------------------------------------
        # FIND THE PRACTICE SESSION
        # ----------------------------------------------------

        session = practice_sessions.get(session_id)

        if not session:
            return jsonify({
                "error": "Practice session not found or expired"
            }), 404

        # ----------------------------------------------------
        # GET STUDENT MESSAGE
        # ----------------------------------------------------

        data = request.get_json() or {}

        student_message = data.get("message", "").strip()

        if not student_message:
            return jsonify({
                "error": "No message provided"
            }), 400

        print("\n======================================")
        print("💬 PRACTICE PATIENT CHAT")
        print("Session ID:", session_id)
        print("Student:", student_message)
        print("======================================")

        # ----------------------------------------------------
        # GET SESSION DATA
        # ----------------------------------------------------

        case_data = session["case_data"]
        conversation_history = session["conversation_history"]

        # ----------------------------------------------------
        # ASK THE VIRTUAL PATIENT
        # ----------------------------------------------------

        patient_reply = get_patient_response(
            case_data=case_data,
            student_message=student_message,
            conversation_history=conversation_history,
        )

        if not patient_reply:
            return jsonify({
                "error": "Patient did not return a response"
            }), 500

        # ----------------------------------------------------
        # SAVE CONVERSATION
        # ----------------------------------------------------

        conversation_history.append({
            "role": "student",
            "content": student_message,
        })

        conversation_history.append({
            "role": "patient",
            "content": patient_reply,
        })
        save_session(session_id, session)

        print("Patient:", patient_reply)

        # ----------------------------------------------------
        # RETURN ONLY THE PATIENT REPLY
        # ----------------------------------------------------

        return jsonify({
            "success": True,
            "reply": patient_reply,
        })

    except Exception as e:

        print("\n❌ PRACTICE CHAT ERROR:")
        print(str(e))

        return jsonify({
            "error": str(e)
        }), 500

    # ============================================================
# PRACTICE - PHYSICAL ASSESSMENT
# ============================================================

@app.route("/practice/<session_id>/assessment", methods=["POST"])
def practice_assessment(session_id):
    try:
        # ----------------------------------------------------
        # FIND PRACTICE SESSION
        # ----------------------------------------------------

        session = practice_sessions.get(session_id)

        if not session:
            return jsonify({
                "error": "Practice session not found or expired"
            }), 404

        # ----------------------------------------------------
        # GET ASSESSMENT ACTION
        # ----------------------------------------------------

        data = request.get_json() or {}

        action = str(data.get("action", "")).strip()

        if not action:
            return jsonify({
                "error": "No assessment action provided"
            }), 400

        print("\n======================================")
        print("🩺 PHYSICAL ASSESSMENT")
        print("Session ID:", session_id)
        print("Action:", action)
        print("======================================")

        # ----------------------------------------------------
        # GET HIDDEN CASE
        # ----------------------------------------------------

        case_data = session["case_data"]

        # ----------------------------------------------------
        # PERFORM ASSESSMENT
        # ----------------------------------------------------

        result = perform_assessment(
            case_data=case_data,
            action=action
        )

        if not result.get("success"):
            return jsonify({
                "error": result.get(
                    "message",
                    "Invalid physical assessment action"
                )
            }), 400

        # ----------------------------------------------------
        # SAVE ASSESSMENT EVIDENCE
        # ----------------------------------------------------

        assessment_record = {
            "action": result["action"],
            "label": result["label"],
            "technique": result["technique"],
            "area": result["area"],
            "tool": result["tool"],
            "finding": result["finding"],
        }

        session["assessment_history"].append(
            assessment_record
        )
        save_session(session_id, session)

        print("Assessment:", result["label"])
        print("Finding:", result["finding"])

        # ----------------------------------------------------
        # RETURN ONLY THE RESULT OF THE ACTION PERFORMED
        # ----------------------------------------------------

        return jsonify({
            "success": True,
            "assessment": assessment_record
        })

    except Exception as e:

        print("\n❌ PHYSICAL ASSESSMENT ERROR:")
        print(str(e))

        return jsonify({
            "error": str(e)
        }), 500

# ============================================================
# PRACTICE - SUBMIT REPORT AND EVALUATE
# ============================================================

@app.route("/practice/<session_id>/submit", methods=["POST"])
def practice_submit(session_id):
    try:
        session = practice_sessions.get(session_id)

        if not session:
            return jsonify({
                "error": "Practice session not found or expired"
            }), 404

        data = request.get_json() or {}
        report = data.get("report") or {}

        required_fields = [
            "interview_summary",
            "physical_findings",
            "identified_problems",
            "supporting_evidence",
            "referral_decision",
        ]

        missing_fields = [
            field for field in required_fields
            if not str(report.get(field, "")).strip()
        ]

        if missing_fields:
            return jsonify({
                "error": "Please complete every report field before submitting."
            }), 400

        # Convert the browser/API session into the evidence structure
        # already expected by evaluator.py.
        conversation = session.get("conversation_history", [])
        interview = []
        pending_question = None

        for item in conversation:
            role = item.get("role")
            content = item.get("content", "")

            if role == "student":
                pending_question = content
            elif role == "patient" and pending_question is not None:
                interview.append({
                    "student_question": pending_question,
                    "patient_response": content,
                })
                pending_question = None

        evaluation_session = {
            "case_id": session["case_data"].get("case_id", session_id),
            "case": session["case_data"],
            "interview": interview,
            "physical_assessment": session.get("assessment_history", []),
            "student_report": report,
            "evaluation": None,
        }

        print("\n======================================")
        print("🤖 EVALUATING PRACTICE SESSION")
        print("Session ID:", session_id)
        print("Interview pairs:", len(interview))
        print("Physical actions:", len(session.get("assessment_history", [])))
        print("======================================")

        evaluation = evaluate_session(evaluation_session)

        if not evaluation:
            return jsonify({
                "error": "Evaluation did not return a result"
            }), 500

        session["student_report"] = report
        session["evaluation"] = evaluation
        save_session(session_id, session)

        return jsonify({
            "success": True,
            "evaluation": evaluation,
        })

    except Exception as e:
        print("\n❌ PRACTICE SUBMIT ERROR:")
        print(str(e))
        return jsonify({"error": str(e)}), 500


        # ============================================================
# STUDENT DASHBOARD - RECENT ACTIVITY
# ============================================================

@app.route("/student/<user_id>/activity", methods=["GET"])
def student_activity(user_id):
    try:
        with sqlite3.connect(DB_PATH) as conn:
            conn.row_factory = sqlite3.Row

            rows = conn.execute("""
                SELECT session_id, session_data, created_at
                FROM practice_sessions
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT 10
            """, (user_id,)).fetchall()

        activities = []

        for row in rows:
            session = json.loads(row["session_data"])
            case_data = session.get("case_data", {})
            student_view = case_data.get("student_view", {})
            evaluation = session.get("evaluation")

            activities.append({
                "session_id": row["session_id"],
                "title": student_view.get(
                    "chief_complaint",
                    "Practice Session"
                ),
                "score": evaluation.get("score") if evaluation else None,
                "completed": evaluation is not None,
                "created_at": row["created_at"],
            })

        return jsonify({
            "success": True,
            "activities": activities,
        })

    except Exception as e:
        print("STUDENT ACTIVITY ERROR:", str(e))
        return jsonify({"error": str(e)}), 500


    
@app.route("/student/<user_id>/practice/<session_id>", methods=["GET"])
def resume_practice(user_id, session_id):
    try:
        session = practice_sessions.get(session_id)

        if not session:
            return jsonify({
                "error": "Practice session not found"
            }), 404

        if str(session.get("user_id")) != str(user_id):
            return jsonify({
                "error": "You are not authorized to access this session"
            }), 403

        case_data = session.get("case_data", {})
        student_view = case_data.get("student_view", {})

        patient = {
            "name": student_view.get("patient_name", ""),
            "age": student_view.get("age", ""),
            "sex": student_view.get("sex", ""),
            "occupation": student_view.get("occupation", ""),
            "setting": student_view.get("setting", ""),
            "chief_complaint": student_view.get(
                "chief_complaint", ""
            ),
        }

        return jsonify({
            "success": True,
            "session_id": session_id,
            "patient": patient,
            "conversation_history": session.get(
                "conversation_history", []
            ),
            "assessment_history": session.get(
                "assessment_history", []
            ),
            "student_report": session.get("student_report"),
            "evaluation": session.get("evaluation"),
            "difficulty": session.get("difficulty"),
            "system": session.get("system"),
        })

    except Exception as e:
        print("RESUME PRACTICE ERROR:", str(e))
        return jsonify({"error": str(e)}), 500







# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True,
        use_reloader=False
    )