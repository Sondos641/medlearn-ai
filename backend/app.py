from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from groq import Groq
import os

# Load environment variables from .env
load_dotenv()

# Get Groq API key from .env
API_KEY = os.getenv("GROQ_API_KEY")

if not API_KEY:
    raise ValueError("GROQ_API_KEY was not found in .env")

# Create Groq client
client = Groq(api_key=API_KEY)

# Create Flask app
app = Flask(__name__)
CORS(app)


@app.route("/")
def home():
    return "Nursing Learning Module API is running! 🚀"


@app.route("/chat", methods=["POST"])
def chat():
    try:
        # Get JSON sent from frontend
        data = request.get_json()

        if not data:
            return jsonify({"error": "No data received"}), 400

        user_message = data.get("message", "").strip()

        if not user_message:
            return jsonify({"error": "No message provided"}), 400

        # Instructions for the AI
        system_prompt = """
You are a nursing educator for the Physical Assessment & Health History course.

Your job is to help nursing students understand course concepts clearly.

Explain answers in a simple, educational, and student-friendly way.

If a question is outside nursing, physical assessment, health history,
or the provided course material, say that it is outside the course content.

Do not invent medical facts.
"""

        # Send request to Groq
        response = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": user_message
                }
            ],
            temperature=0.3
        )

        # Get AI response
        ai_reply = response.choices[0].message.content

        return jsonify({
            "reply": ai_reply
        })

    except Exception as e:
        print("ERROR:", str(e))

        return jsonify({
            "error": str(e)
        }), 500


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )