import os
import json
import uuid
from dotenv import load_dotenv
from groq import Groq

from models.case_schema import CASE_SCHEMA
from retrieval import retrieve_textbook_context


# Load environment variables
load_dotenv()

API_KEY = os.getenv("GROQ_API_KEY")

if not API_KEY:
    raise ValueError("GROQ_API_KEY was not found in .env")


# Create Groq client
client = Groq(api_key=API_KEY)


def generate_case(system="cardiovascular", difficulty="moderate"):

    # ---------------------------------------------------------
    # STEP 1: Retrieve relevant information from the textbook
    # ---------------------------------------------------------

    textbook_query = f"""
    {system} health assessment.
    Relevant subjective data, health history, symptoms,
    physical examination techniques, normal findings,
    abnormal findings, risk factors, and referral indicators.
    """

    textbook_context = retrieve_textbook_context(
        textbook_query,
        n_results=5
    )


    # ---------------------------------------------------------
    # STEP 2: Build the case-generation prompt
    # ---------------------------------------------------------

    prompt = f"""
You are a clinical case generator for nursing students.

Generate ONE new and realistic patient case for a nursing
health-assessment simulation.

BODY SYSTEM:
{system}

DIFFICULTY:
{difficulty}


TEXTBOOK CONTEXT:

{textbook_context}


GROUNDING RULES:

- Use the textbook context above as the clinical source of truth.
- The generated patient's history and physical findings must be
  clinically consistent with the textbook context.
- Do not invent clinical assessment findings that contradict
  the provided textbook context.
- Use only assessment techniques appropriate to the body system.
- If the provided textbook context does not support a specific
  clinical detail, avoid making unsupported claims.


IMPORTANT RULES:

- Generate a NEW patient.
- Use realistic Bahraini or Arabic patient names written in English.
- Use realistic occupations and backgrounds appropriate for patients
  in Bahrain.
- Use a healthcare setting appropriate for Bahrain.
- Do not reveal the diagnosis in student_view.
- The patient information must be internally consistent.
- Physical findings must match the patient's condition.
- Do not include impossible or contradictory findings.
- Do not give the student hints.
- The hidden_case contains information available only to
  the virtual patient and evaluator.
- student_view contains ONLY information the student is
  allowed to know before beginning the assessment.


The case must be suitable for a student performing:

1. Health interview
2. Physical assessment
3. Identification of patient problems
4. Referral or management decision


Return ONLY valid JSON.

Do not include Markdown.

Do not write ```json.

Use EXACTLY this structure:

{json.dumps(CASE_SCHEMA, indent=2)}
"""


    # ---------------------------------------------------------
    # STEP 3: Ask Groq to generate the case
    # ---------------------------------------------------------

    response = client.chat.completions.create(
    model="openai/gpt-oss-20b",
    messages=[
        {
            "role": "system",
            "content": (
                "You generate structured clinical nursing "
                "simulation cases grounded in the supplied "
                "medical textbook context. Follow the requested "
                "JSON structure exactly."
            ),
        },
        {
            "role": "user",
            "content": prompt,
        },
    ],
    temperature=0.5,
    max_tokens=5000,
)


    # ---------------------------------------------------------
    # STEP 4: Get AI response
    # ---------------------------------------------------------

    raw_response = response.choices[0].message.content


    # ---------------------------------------------------------
    # STEP 5: Convert response into Python JSON
    # ---------------------------------------------------------

    try:
        case = json.loads(raw_response)

    except json.JSONDecodeError:

        print("\n❌ AI returned invalid JSON.")

        print("\nAI RESPONSE:")
        print(raw_response)

        return None


    # ---------------------------------------------------------
    # STEP 6: Add system-generated information
    # ---------------------------------------------------------

    case["case_id"] = f"CVS-{uuid.uuid4().hex[:8].upper()}"
    case["system"] = system
    case["difficulty"] = difficulty


    return case


# -------------------------------------------------------------
# TEST THE CASE GENERATOR
# -------------------------------------------------------------

if __name__ == "__main__":

    print("\nGenerating textbook-grounded Cardiovascular case...\n")

    generated_case = generate_case(
        system="cardiovascular",
        difficulty="moderate",
    )

    if generated_case:

        print("✅ CASE GENERATED SUCCESSFULLY\n")

        print(
            json.dumps(
                generated_case,
                indent=2,
                ensure_ascii=False,
            )
        )