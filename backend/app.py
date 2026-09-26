from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from groq import Groq
import os


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
# HOME
# ============================================================

@app.route("/")
def home():
    return "Nursing Learning Module API is running! 🚀"


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

        # ====================================================
        # DEBUGGING
        # ====================================================

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
# RUN SERVER
# ============================================================

if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True,
    )