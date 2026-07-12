from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import google.generativeai as genai

app = Flask(__name__)
CORS(app)

# 🔑 HARDCODE YOUR API KEY HERE (TEMPORARY FOR TESTING)
API_KEY = "AIzaSyB1234567890abcdefghijklmnopqrstuvwxyz"  # ← REPLACE with your actual AIza key!

# Configure Gemini with the hardcoded key
genai.configure(api_key=API_KEY)

# Use a model available in the free tier
model = genai.GenerativeModel('gemini-1.5-flash')

@app.route('/')
def home():
    return "Nursing Learning Module API is running! 🚀"

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get('message', '')

        if not user_message:
            return jsonify({'error': 'No message provided'}), 400

        system_prompt = """You are a nursing educator for the Physical Assessment & Health History course.
Answer questions based ONLY on the provided course textbook and clinical scenarios.
If you don't know the answer or if the question is outside the course content, say so clearly.
Be clear, educational, and helpful in your responses."""

        full_prompt = f"{system_prompt}\n\nUser Question: {user_message}"

        response = model.generate_content(full_prompt)
        ai_reply = response.text

        return jsonify({'reply': ai_reply})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)