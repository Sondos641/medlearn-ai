
import os
import json
import uuid
import random
from collections import deque

from dotenv import load_dotenv
from groq import Groq

from models.case_schema import CASE_SCHEMA
from retrieval import retrieve_textbook_context


load_dotenv()

API_KEY = os.getenv("GROQ_API_KEY")

if not API_KEY:
    raise ValueError("GROQ_API_KEY was not found in .env")

client = Groq(api_key=API_KEY)


# ---------------------------------------------------------
# SCENARIO LIBRARY
# ---------------------------------------------------------
# These are candidate presentations, not validated diagnoses.
# Each case must still be grounded in retrieved textbook content.

SCENARIOS = {
    "cardiovascular": [
        "palpitations",
        "dizziness with irregular heartbeat",
        "bilateral leg swelling",
        "high blood pressure assessment",
        "exertional chest discomfort",
        "fainting episode",
    ],
    "respiratory": [
        "persistent cough",
        "wheezing and shortness of breath",
        "fever with productive cough",
        "breathing difficulty during exercise",
        "chest tightness with respiratory symptoms",
    ],
    "neurological": [
        "recurrent headaches",
        "migraine-like symptoms",
        "dizziness and balance problems",
        "numbness in one hand",
        "sudden weakness and speech difficulty",
        "seizure-like episode",
    ],
    "abdominal": [
        "upper abdominal pain",
        "lower abdominal pain",
        "nausea and vomiting",
        "constipation and abdominal discomfort",
        "diarrhea and dehydration symptoms",
        "pain after eating",
    ],
    "musculoskeletal": [
        "lower back pain",
        "knee pain after physical activity",
        "shoulder pain",
        "joint stiffness",
        "ankle injury",
        "wrist pain and swelling",
    ],
    "heent": [
        "ear pain",
        "nasal congestion and facial pressure",
        "sore throat",
        "neck swelling",
        "recurrent sinus symptoms",
    ],
    "femt": [
        "blurred vision",
        "eye redness and discomfort",
        "mouth ulcers",
        "difficulty swallowing",
        "eye irritation",
    ],
}


SYSTEM_ALIASES = {
    "cvs": "cardiovascular",
    "resp": "respiratory",
    "neuro": "neurological",
    "abd": "abdominal",
    "gi": "abdominal",
    "msk": "musculoskeletal",
}

SYSTEM_CODES = {
    "cardiovascular": "CVS",
    "respiratory": "RESP",
    "neurological": "NEURO",
    "abdominal": "ABD",
    "musculoskeletal": "MSK",
    "heent": "HEENT",
    "femt": "FEMT",
}

# Track recent choices within the current server process.
RECENT_SCENARIOS = deque(maxlen=8)

AGE_GROUPS = {
    "child": (6, 12),
    "teen": (13, 17),
    "young_adult": (18, 35),
    "adult": (36, 59),
    "older_adult": (60, 85),
}

# Initial rollout: adult cases only until pediatric
# assessment actions and rubrics have been reviewed.
ENABLED_AGE_GROUPS = [
    "young_adult",
    "adult",
    "older_adult",
]


def choose_scenario(system):
    options = SCENARIOS[system]

    available = [
        condition for condition in options
        if (system, condition) not in RECENT_SCENARIOS
    ]

    if not available:
        available = options

    condition = random.choice(available)
    RECENT_SCENARIOS.append((system, condition))

    age_group = random.choice(ENABLED_AGE_GROUPS)
    minimum, maximum = AGE_GROUPS[age_group]

    return {
        "condition": condition,
        "age": random.randint(minimum, maximum),
        "age_group": age_group,
        "sex": random.choice(["male", "female"]),
    }


def generate_case(system="cardiovascular", difficulty="moderate"):

    system = SYSTEM_ALIASES.get(
        system.lower().strip(),
        system.lower().strip()
    )

    if system not in SCENARIOS:
        raise ValueError(f"Unsupported body system: {system}")

    difficulty = difficulty.lower().strip()

    if difficulty not in ["easy", "medium", "moderate", "hard"]:
        raise ValueError("Unsupported difficulty")

    if difficulty == "moderate":
        difficulty = "medium"

    # ---------------------------------------------------------
    # STEP 1: Choose patient and presentation
    # ---------------------------------------------------------

    plan = choose_scenario(system)

    # ---------------------------------------------------------
    # STEP 2: Retrieve focused textbook context
    # ---------------------------------------------------------

    textbook_query = f"""
    {system} nursing health assessment.
    Patient presenting with {plan['condition']}.
    Relevant health history, symptoms, risk factors,
    physical examination, normal and abnormal findings,
    differential considerations and referral indicators.
    """

    textbook_context = retrieve_textbook_context(
        textbook_query,
        n_results=3
    )

    textbook_context = str(textbook_context)[:6000]

    if not textbook_context or not str(textbook_context).strip():
        raise ValueError(
            "No textbook context was retrieved for this case."
        )

    # ---------------------------------------------------------
    # STEP 3: Build prompt
    # ---------------------------------------------------------

    prompt = f"""
You are generating a fictional clinical simulation case
for nursing students.

BODY SYSTEM: {system}
DIFFICULTY: {difficulty}

PATIENT REQUIREMENTS:
- Age: {plan['age']}
- Sex: {plan['sex']}
- Age group: {plan['age_group']}
- Presenting complaint: {plan['condition']}

The patient's age, sex and presenting complaint MUST match
the requirements above.

TEXTBOOK CONTEXT:
{textbook_context}

CLINICAL GROUNDING RULES:
- Use the retrieved textbook context to support clinical facts.
- Do not contradict the supplied textbook context.
- Do not invent unsupported examination findings.
- Use appropriate assessments for this body system.
- If the textbook does not adequately support this
  presentation, do not fabricate clinical details.
- Keep symptoms, history, findings and underlying condition
  medically consistent.
- The selected complaint is a presentation, not necessarily
  the final diagnosis.

PATIENT RULES:
- Generate a fictional Bahraini or Arabic patient identity.
- Use realistic backgrounds and healthcare settings.
- Keep the patient consistent throughout the case.
- Do not reveal the diagnosis in student_view.
- student_view must contain only initial patient information.
- hidden_case must contain information needed by the
  virtual patient and evaluator.
- Include appropriate abnormal and normal findings.
- Do not make every case a medical emergency.
- Do not make every case a chest-pain presentation.

DIFFICULTY:
Easy: Common presentation with relatively clear findings.
Medium: Requires focused assessment and interpretation.
Hard: More complex history, competing explanations,
or clinically significant warning signs.

The case must support:
1. Health interview
2. Physical assessment
3. Identification of clinical problems
4. Referral or management decision

Return ONLY valid JSON.
No Markdown or code fences.

Use this JSON structure:
{json.dumps(CASE_SCHEMA, indent=2)}
"""

    # ---------------------------------------------------------
    # STEP 4: Generate and check the case
    # ---------------------------------------------------------

    for attempt in range(2):
        response = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Generate structured fictional nursing "
                        "simulation cases using supplied textbook "
                        "context. Follow the requested JSON schema."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            temperature=0.4,
            max_tokens=2500,
        )

        raw_response = response.choices[0].message.content

        try:
            case = json.loads(raw_response)
        except (json.JSONDecodeError, TypeError):
            print("Invalid JSON. Retrying...")
            continue

        if not isinstance(case, dict):
            continue

        student_view = case.get("student_view")

        if not isinstance(student_view, dict):
            continue

        # Check key demographic constraints.
        try:
            generated_age = int(student_view.get("age"))
        except (ValueError, TypeError):
            continue

        generated_sex = str(
            student_view.get("sex", "")
        ).lower().strip()

        if generated_age != plan["age"]:
            continue

        if generated_sex != plan["sex"]:
            continue

        # Verify basic required sections.
        if not isinstance(case.get("hidden_case"), dict):
            continue

        case["case_id"] = (
            f"{SYSTEM_CODES[system]}-"
            f"{uuid.uuid4().hex[:8].upper()}"
        )
        case["system"] = system
        case["difficulty"] = difficulty

        return case

    print("Could not generate a valid case.")
    return None


# ---------------------------------------------------------
# TEST
# ---------------------------------------------------------

if __name__ == "__main__":

    for i in range(3):
        case = generate_case(
            system="cardiovascular",
            difficulty="medium"
        )

        if case:
            patient = case["student_view"]

            print(f"\nCASE {i + 1}")
            print("Name:", patient.get("patient_name"))
            print("Age:", patient.get("age"))
            print("Sex:", patient.get("sex"))
            print(
                "Complaint:",
                patient.get("chief_complaint")
            )
