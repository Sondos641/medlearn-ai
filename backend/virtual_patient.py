from dotenv import load_dotenv
from groq import Groq
from case_generator import generate_case
import os
import json


# ============================================================
# SETUP
# ============================================================

load_dotenv()

API_KEY = os.getenv("GROQ_API_KEY")

if not API_KEY:
    raise ValueError("GROQ_API_KEY was not found in .env")

client = Groq(api_key=API_KEY)


# ============================================================
# VIRTUAL PATIENT
# ============================================================

def get_patient_response(
    case_data,
    student_message,
    conversation_history=None
):
    """
    Generate a realistic response from the virtual patient.

    The patient knows the hidden clinical case but should only reveal
    information when the nursing student asks an appropriate question.
    """

    if conversation_history is None:
        conversation_history = []

    hidden_case = case_data.get("hidden_case", {})
    student_view = case_data.get("student_view", {})

    patient_context = {
        "student_view": student_view,
        "hidden_case": hidden_case,
    }

    system_prompt = f"""
You are role-playing a virtual patient in a nursing education simulation.

The nursing student is conducting a health history interview.

PATIENT CASE:
{json.dumps(patient_context, indent=2, ensure_ascii=False)}

RULES:

1. Stay in character as the patient at all times.

2. Answer ONLY based on the provided patient case.

3. Do not invent symptoms, medical history, medications, allergies,
   family history, social history, or physical findings that are not
   supported by the case.

4. Do not reveal information unless the student's question reasonably
   asks for that information.

5. Do not volunteer important clinical information too early.

6. If the student asks a broad opening question such as:
   "What brings you here?"
   respond mainly with the chief complaint.

7. If the student asks a specific question about pain, symptoms,
   medications, allergies, family history, social history, or daily
   activities, answer using the corresponding information from the case.

8. If the requested information is not available in the case, respond
   naturally without inventing information. For example:
   "I'm not sure."
   "I don't remember."
   or another appropriate patient-style response.

9. Do NOT tell the student the diagnosis or condition stored in the
   hidden case unless the case explicitly says that the patient already
   knows that diagnosis.

10. Do NOT provide nursing advice, clinical explanations, teaching,
    assessment guidance, or hints.

11. Do NOT behave like an AI assistant or nursing instructor.

12. Keep responses realistic and conversational. Usually answer in
    1-3 sentences unless the student's question naturally requires
    more detail.

13. The student may ask follow-up questions. Use the conversation
    history to keep your answers consistent.

14. Physical examination findings must NOT be volunteered during the
    interview. Those findings belong to the physical assessment stage.

15. When the student asks a broad question such as "describe the pain",
    do not automatically reveal every PQRST detail. Give only a natural
    amount of information. Allow the student to ask follow-up questions
    about severity, radiation, timing, aggravating factors, and relieving
    factors separately.

Return ONLY what the patient would say.
"""

    messages = [
        {
            "role": "system",
            "content": system_prompt
        }
    ]

    # Add previous conversation
    for message in conversation_history:

        role = message.get("role")
        content = message.get("content")

        if role in ["user", "assistant"] and content:

            messages.append({
                "role": role,
                "content": content
            })

    # Add current student question
    messages.append({
        "role": "user",
        "content": student_message
    })

    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=messages,
        temperature=0.4,
        max_tokens=1500,
    )

    patient_reply = response.choices[0].message.content

    if not patient_reply:
        raise ValueError(
            "Virtual patient returned an empty response."
        )

    return patient_reply


# ============================================================
# TERMINAL TEST WITH AI-GENERATED CASE
# ============================================================

if __name__ == "__main__":

    print("\n======================================")
    print("       MEDLEARN PRACTICE MODE")
    print("======================================")

    print("\nGenerating a new patient case...")
    print("Please wait...\n")

    # --------------------------------------------------------
    # Generate a new textbook-grounded cardiovascular case
    # --------------------------------------------------------

    generated_case = generate_case(
        system="cardiovascular",
        difficulty="moderate"
    )

    if not generated_case:
        print("❌ Could not generate patient case.")
        exit()

    # --------------------------------------------------------
    # Get ONLY the information the student is allowed to see
    # --------------------------------------------------------

    student_view = generated_case.get("student_view", {})

    print("✅ Patient ready!\n")

    print("--------------------------------------")
    print("PATIENT INFORMATION")
    print("--------------------------------------")

    print(
        f"Name: "
        f"{student_view.get('patient_name', 'Unknown')}"
    )

    print(
        f"Age: "
        f"{student_view.get('age', 'Unknown')}"
    )

    print(
        f"Sex: "
        f"{student_view.get('sex', 'Unknown')}"
    )

    print(
        f"Occupation: "
        f"{student_view.get('occupation', 'Unknown')}"
    )

    print(
        f"Setting: "
        f"{student_view.get('setting', 'Unknown')}"
    )

    print(
        f"Chief Complaint: "
        f"{student_view.get('chief_complaint', 'Unknown')}"
    )

    print("--------------------------------------")

    print("\nBegin your health history interview.")
    print("Type 'exit' to stop.\n")

    # --------------------------------------------------------
    # Conversation history
    # --------------------------------------------------------

    conversation_history = []

    # --------------------------------------------------------
    # Student ↔ Patient conversation
    # --------------------------------------------------------

    while True:

        student_message = input("Student: ").strip()

        if student_message.lower() == "exit":

            print("\nSimulation ended.")
            break

        if not student_message:
            continue

        try:

            patient_reply = get_patient_response(
                generated_case,
                student_message,
                conversation_history
            )

            print(f"\nPatient: {patient_reply}\n")

            # Save student's question
            conversation_history.append({
                "role": "user",
                "content": student_message
            })

            # Save patient's response
            conversation_history.append({
                "role": "assistant",
                "content": patient_reply
            })

        except Exception as e:

            print("\n❌ ERROR:", str(e))