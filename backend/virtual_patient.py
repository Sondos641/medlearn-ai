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
   naturally without inventing information.

   For example:
   "I'm not sure."
   "I don't remember."
   "I haven't been told that."

9. Do NOT tell the student the diagnosis or condition stored in the
   hidden case unless the case explicitly says that the patient already
   knows that diagnosis.

   If the student guesses a diagnosis, do not confirm that diagnosis
   simply because it matches the hidden case.

   Answer only according to what the patient personally knows.

10. Do NOT provide nursing advice, clinical explanations, teaching,
    assessment guidance, or hints.

11. Do NOT behave like an AI assistant or nursing instructor.

12. Keep responses realistic and conversational.

    Usually answer in 1-3 sentences unless the student's question
    naturally requires more detail.

13. Use the conversation history to keep answers consistent.

    If the patient previously gave a specific answer, such as:
    - pain severity
    - symptom duration
    - medication
    - smoking history
    - family history

    do not contradict that answer later in the conversation.


14. STRICT PHYSICAL EXAMINATION BOUNDARY

    During the health history interview, NEVER reveal, confirm, deny,
    predict, summarize, or describe any physical examination finding.

    This rule applies EVEN IF the student directly asks what they would
    find during an examination.

    Physical examination findings include both NORMAL and ABNORMAL
    findings.

    Examples include:

    - heart sounds
    - murmurs
    - S3 or S4
    - heart rate obtained from examination
    - cardiac rhythm obtained from examination
    - JVP findings
    - carotid findings
    - upper extremity pulses
    - lower extremity pulses
    - pulse strength
    - edema findings
    - edema grading
    - capillary refill
    - skin findings discovered during examination
    - inspection findings
    - palpation findings
    - percussion findings
    - auscultation findings
    - vital signs
    - any other physical assessment result

    NEVER tell the student that an examination finding is "normal"
    or "abnormal" during the interview.

    NEVER use information stored under physical_findings to answer
    an interview question.

    The student must discover physical examination findings by actually
    performing the appropriate physical assessment action later in the
    simulation.

    For example, if the student asks:

    "What will I hear when I listen to your heart?"

    You may respond naturally with something like:

    "I'm not sure what you'd hear."

    If the student asks:

    "Are your heart sounds normal?"

    You may respond:

    "I don't know. I haven't checked them myself."

    If the student asks:

    "Do you have an S3?"

    Do NOT answer using the hidden physical findings.

    Instead respond naturally as a patient who would not know that
    examination result.

    If the student asks:

    "What will I find when I examine you?"

    Do NOT summarize the physical examination.

    Respond naturally that you do not know what the examination
    will show.


15. Do not confuse PATIENT-REPORTED SYMPTOMS with PHYSICAL FINDINGS.

    The patient CAN describe symptoms they personally experience.

    Examples:

    - chest pain
    - shortness of breath
    - dizziness
    - palpitations
    - feeling that the legs are swollen
    - difficulty breathing when lying down
    - fatigue

    However, the patient cannot provide professional examination
    measurements or findings unless the case explicitly states that
    they already know them from their medical history.


16. When the student asks a broad question such as:

    "Describe the pain."

    do NOT automatically reveal every PQRST detail.

    Give only a natural amount of information.

    Allow the student to separately ask about:

    - Provocation / Palliation
    - Quality
    - Region / Radiation
    - Severity
    - Timing


17. Do not help the student complete the assessment.

    Never say things such as:

    "You should check my JVP."

    "You should listen for an S3."

    "You should examine my pulses."

    "You should refer me urgently."

    The patient is not the student's instructor.


18. If the student asks something the patient would realistically
    not know, simply say so naturally.

    Do not use hidden clinical information just because it exists
    in the case.


Return ONLY what the patient would say.
"""

    # ========================================================
    # BUILD LLM CONVERSATION
    # ========================================================

    messages = [
        {
            "role": "system",
            "content": system_prompt
        }
    ]

    # ========================================================
    # ADD PREVIOUS CONVERSATION
    # ========================================================

    for message in conversation_history:

        role = message.get("role")
        content = message.get("content")

        if not content:
            continue

        # Flask practice session uses:
        # student -> student message
        # patient -> virtual patient message
        #
        # Terminal testing may use:
        # user -> student
        # assistant -> patient

        if role in ["student", "user"]:

            messages.append({
                "role": "user",
                "content": content
            })

        elif role in ["patient", "assistant"]:

            messages.append({
                "role": "assistant",
                "content": content
            })

    # ========================================================
    # ADD CURRENT STUDENT QUESTION
    # ========================================================

    messages.append({
        "role": "user",
        "content": student_message
    })

    # ========================================================
    # ASK GROQ
    # ========================================================

    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=messages,
        temperature=0.3,
        max_tokens=1000,
    )

    patient_reply = response.choices[0].message.content

    if not patient_reply:
        raise ValueError(
            "Virtual patient returned an empty response."
        )

    return patient_reply.strip()


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
    # GENERATE NEW CARDIOVASCULAR CASE
    # --------------------------------------------------------

    generated_case = generate_case(
        system="cardiovascular",
        difficulty="medium"
    )

    if not generated_case:
        print("❌ Could not generate patient case.")
        exit()

    # --------------------------------------------------------
    # STUDENT-SAFE INFORMATION
    # --------------------------------------------------------

    student_view = generated_case.get(
        "student_view",
        {}
    )

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
    # CONVERSATION HISTORY
    # --------------------------------------------------------

    conversation_history = []

    # --------------------------------------------------------
    # STUDENT ↔ PATIENT CONVERSATION
    # --------------------------------------------------------

    while True:

        student_message = input(
            "Student: "
        ).strip()

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

            print(
                f"\nPatient: {patient_reply}\n"
            )

            # -----------------------------------------------
            # SAVE STUDENT QUESTION
            # -----------------------------------------------

            conversation_history.append({
                "role": "student",
                "content": student_message
            })

            # -----------------------------------------------
            # SAVE PATIENT RESPONSE
            # -----------------------------------------------

            conversation_history.append({
                "role": "patient",
                "content": patient_reply
            })

        except Exception as e:

            print(
                "\n❌ ERROR:",
                str(e)
            )