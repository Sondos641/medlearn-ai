# Sondos Note:
# Evaluates the student's complete Practice session using the clinical rubric
# and generates a score out of 100 with personalized feedback
import json
import os
from pathlib import Path

from dotenv import load_dotenv
from groq import Groq

load_dotenv()

API_KEY = os.getenv("GROQ_API_KEY")

if not API_KEY:
    raise ValueError("GROQ_API_KEY was not found in .env")

client = Groq(api_key=API_KEY)


def load_rubric(system):
    """
    Load the scoring rubric for the selected body system.
    """

    rubric_path = (
        Path(__file__).resolve().parent
        / "rubrics"
        / f"{system.lower()}.json"
    )

    if not rubric_path.exists():
        raise FileNotFoundError(
            f"No rubric found for system: {system}"
        )

    with open(rubric_path, "r", encoding="utf-8") as file:
        rubric = json.load(file)

    return rubric

def flatten_rubric(rubric):
    """
    Convert rubric sections into one list of criteria
    so each criterion can be evaluated individually.
    """

    criteria = []

    for section in rubric["sections"]:

        section_name = section["name"]

        for criterion in section["criteria"]:

            criteria.append({
                "id": criterion["id"],
                "section": section_name,
                "criterion": criterion["criterion"],
                "max_score": criterion["max_score"]
            })

    return criteria


def calculate_score(criteria):
    """
    Calculate a normalized score out of 100.

    Criteria marked not_applicable are excluded from
    the available marks.
    """

    earned_points = 0
    maximum_points = 0

    for criterion in criteria:
        if criterion.get("not_applicable", False):
            continue

        earned_points += criterion.get("score", 0)
        maximum_points += criterion.get("max_score", 0)

    if maximum_points == 0:
        return 0

    percentage = (earned_points / maximum_points) * 100

    return round(percentage, 1)



def build_session_evidence(session):
    """
    Prepare the student's work for evaluation.
    """

    evidence = {
        "case_id": session.get("case_id"),
        "system": session.get("case", {}).get("system", ""),
        "interview": session.get("interview", []),
        "physical_assessment": session.get("physical_assessment", []),
        "student_report": session.get("student_report", {})
    }

    return evidence

def evaluate_session(session):
    """
    Evaluate a completed Practice session against
    the official rubric.

    The AI evaluates each rubric criterion using:
    - the student's recorded interview
    - physical assessment actions
    - student report
    - the hidden correct case

    Python calculates the final score.
    """
    print("DEBUG: UPDATED EVALUATOR IS RUNNING", flush=True)
    # --------------------------------------------------------
    # 1. Load rubric
    # --------------------------------------------------------

    system = session.get("case", {}).get(
        "system",
        "cardiovascular"
    )

    rubric = load_rubric(system)
    criteria = flatten_rubric(rubric)

    # --------------------------------------------------------
    # 2. Build student evidence
    # --------------------------------------------------------

    student_evidence = build_session_evidence(session)

    # --------------------------------------------------------
    # 3. Get hidden correct case
    # --------------------------------------------------------

    hidden_case = (
        session
        .get("case", {})
        .get("hidden_case", {})
    )

    # --------------------------------------------------------
    # 4. Create evaluator prompt
    # --------------------------------------------------------

    system_prompt = """

FOCUSED CLINICAL ASSESSMENT SAFETY RULES:

1. Decide whether each criterion is clinically applicable
   BEFORE considering the student's performance.

2. Never mark a criterion N/A just because the student
   did not perform it.

3. Essential patient-safety assessments must remain
   applicable, even if the student skipped them.

4. A normal examination finding does not automatically
   make its assessment unnecessary.

5. Do not require students to identify abnormalities
   that are absent from the hidden patient case.

6. If the simulator does not provide a way to demonstrate
   a specific technique, that technique must not be
   penalized as missing.

7. Interview, documentation, clinical reasoning, and
   referral criteria should remain applicable whenever
   the case provides an opportunity to demonstrate them.

8. When marking a criterion N/A, explain the specific
   clinical or interface-related reason.

You are the clinical assessment evaluator for MedLearn AI.

Your job is to evaluate a nursing student's completed clinical
assessment session using the provided official scoring rubric.

IMPORTANT SCORING RULES:

1. Evaluate EVERY rubric criterion separately.


2. Each criterion must receive one of these scores:
   0 = Applicable but not performed or incorrect
   1 = Applicable and partially performed
   2 = Applicable and correctly performed

   Also return a boolean field named "not_applicable"
   for every criterion.

   Set "not_applicable": true ONLY when:
   - The assessment is not clinically indicated for
     this specific patient and is not required for safety.
   - OR the criterion requires an interaction that the
     simulator does not allow the student to demonstrate.

   Set "not_applicable": false for all other criteria.

   IMPORTANT:
   - Never mark an essential assessment as not applicable
     simply because the student skipped it.
   - Base clinical relevance on the hidden case, not on
     which actions the student chose to perform.
   - Normal findings can be clinically important.
   - An assessment is not automatically unnecessary
     just because its expected result is normal.
   - When not_applicable is true, return score 0 and
     explain why the criterion does not apply.


3. Give credit ONLY for actions that are supported by the
   recorded student evidence.

4. Never assume that the student performed an action that is
   not recorded.

5. A patient response is NOT proof that the student performed
   some other assessment action.

6. For interview criteria, evaluate the student's actual
   questions and communication.

7. For physical assessment criteria, evaluate ONLY the
   physical assessment actions explicitly recorded.

8. Do not give credit for a specific physical examination
   technique merely because a broad or different technique
   was performed.

9. For report criteria, evaluate ONLY what the student wrote
   in the submitted student report.

10. Blank report fields receive no credit for criteria that
    require documentation.

11. Use the hidden case only as the correct clinical reference.
    Do NOT treat information from the hidden case as something
    the student discovered unless the student evidence shows it.

12. Do not invent student actions, questions, findings,
    documentation, or clinical reasoning.

13. The final numerical score will be calculated by Python.
    Do NOT calculate the final percentage yourself.

Return ONLY valid JSON.

The response must have this exact structure:


{
    "criteria": [
        {
            "id": 1,
            "score": 0,
            "not_applicable": false,
            "evidence": "Specific evidence from the student session, or No evidence",
            "reason": "Explain the score or why this criterion is not applicable"
        }
    ],
    "did_well": [],
    "missed": [],
    "partially_completed": [],
    "focus_topics": [],
    "report_feedback": ""
}

You must return one result for EVERY rubric criterion.
"""

    evaluation_data = {
        "rubric": criteria,
        "student_evidence": student_evidence,
        "correct_hidden_case": hidden_case
    }

    # --------------------------------------------------------
    # 5. Ask Groq to evaluate
    # --------------------------------------------------------

    response = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": json.dumps(
                        evaluation_data,
                        indent=2
                    )
                }
            ],
            temperature=0.1,
            max_tokens=7000,
            response_format={"type": "json_object"}
        )
    
    raw_response = response.choices[0].message.content

    if not raw_response:
        raise ValueError(
            "Evaluator returned an empty response."
        )

    # --------------------------------------------------------
    # 6. Convert AI response to Python
    # --------------------------------------------------------

    try:
        evaluation = json.loads(raw_response)

    except json.JSONDecodeError:

        # Sometimes a model may wrap JSON in markdown.
        cleaned_response = (
            raw_response
            .replace("```json", "")
            .replace("```", "")
            .strip()
        )

        evaluation = json.loads(cleaned_response)

    # --------------------------------------------------------
    # 7. Validate returned criteria
    # --------------------------------------------------------

    returned_criteria = evaluation.get(
        "criteria",
        []
    )

    if len(returned_criteria) != len(criteria):
        raise ValueError(
            "Evaluator did not return all rubric criteria. "
            f"Expected {len(criteria)}, "
            f"received {len(returned_criteria)}."
        )

    expected_ids = {
        criterion["id"]
        for criterion in criteria
    }

    returned_ids = {
        criterion.get("id")
        for criterion in returned_criteria
    }

    if expected_ids != returned_ids:
        raise ValueError(
            "Evaluator returned incorrect rubric criterion IDs."
        )

    # --------------------------------------------------------
    # 8. Validate every score
    # --------------------------------------------------------

    rubric_lookup = {
        criterion["id"]: criterion
        for criterion in criteria
    }

    validated_criteria = []

    for result in returned_criteria:

        criterion_id = result.get("id")
        score = result.get("score")


        not_applicable = result.get("not_applicable", False)

        if not isinstance(not_applicable, bool):
            raise ValueError(
                f"Invalid not_applicable value for criterion {criterion_id}"
            )

        if not_applicable and score != 0:
            raise ValueError(
                f"Criterion {criterion_id} is N/A but has a nonzero score."
            )


        if score not in [0, 1, 2]:
            raise ValueError(
                f"Invalid score for criterion "
                f"{criterion_id}: {score}"
            )

        official_criterion = rubric_lookup[
            criterion_id
        ]


        protected_sections = {
            "Interview and History",
            "Student Report and Documentation",
            "Referral Decision",
        }

        if official_criterion["section"] in protected_sections:
            not_applicable = False

        # These skills cannot currently be demonstrated
        # through the available Practice assessment actions.
        interface_unsupported_criteria = {16,24,31}

        if criterion_id in interface_unsupported_criteria:
            not_applicable = True
            score = 0

        # Core cardiovascular assessments remain applicable.
        # Missing an essential action must not become N/A.
        essential_cardiovascular_criteria = {
            21,  # Heart auscultation with diaphragm
            26,  # Upper extremity pulses
        }

        if (
            system == "cardiovascular"
            and criterion_id in essential_cardiovascular_criteria
        ):
            not_applicable = False


        validated_criteria.append({
            "id": criterion_id,
            "section": official_criterion["section"],
            "criterion": official_criterion["criterion"],
            "score": score,
            "not_applicable": not_applicable,
            "max_score": official_criterion["max_score"],
            "evidence": result.get(
                "evidence",
                "No evidence"
            ),
            "reason": result.get(
                "reason",
                ""
            )
        })

    
    def map_feedback_items(items):
        mapped_items = []

        for item in items:
            try:
                criterion_id = int(item)
            except (ValueError, TypeError):
                mapped_items.append(item)
                continue

            official_criterion = rubric_lookup.get(criterion_id)

            if official_criterion:
                mapped_items.append(
                    official_criterion["criterion"]
                )
            else:
                mapped_items.append(item)

        return mapped_items

    # Build feedback from Python-validated scores,
    # not from the AI's potentially inconsistent lists.
    did_well = []
    missed = []
    partially_completed = []
    not_applicable_items = []

    for item in validated_criteria:
        if item["not_applicable"]:
            not_applicable_items.append(item["criterion"])
        elif item["score"] == item["max_score"]:
            did_well.append(item["criterion"])
        elif item["score"] == 0:
            missed.append(item["criterion"])
        else:
            partially_completed.append(item["criterion"])





    # --------------------------------------------------------
    # 9. Python calculates final score
    # --------------------------------------------------------

    final_score = calculate_score(
        validated_criteria
    )

    print(
        "DEBUG N/A IDs:",
        [item["id"] for item in validated_criteria if item["not_applicable"]],
        flush=True
    )


    # --------------------------------------------------------
    # 10. Build final evaluation
    # --------------------------------------------------------

    final_evaluation = {
        "score": final_score,
        "total_marks": rubric["total_marks"],
        "criteria": validated_criteria,
        "feedback": {
            "did_well": did_well,
            "missed": missed,
            "partially_completed": partially_completed,
            "not_applicable": not_applicable_items,
            "focus_topics": map_feedback_items(
                evaluation.get("focus_topics", [])
            ),
            "report_feedback": evaluation.get(
                "report_feedback", ""
            )
    }
    }

    return final_evaluation
    
if __name__ == "__main__":

    rubric = load_rubric("cardiovascular")

    criteria = flatten_rubric(rubric)

    print("System:", rubric["system"])
    print("Number of sections:", len(rubric["sections"]))
    print("Number of criteria:", len(criteria))

    total = sum(
        criterion["max_score"]
        for criterion in criteria
    )

    print("Total rubric marks:", total)

    print("\nFirst criterion:")
    print(criteria[0])

    print("\nLast criterion:")
    print(criteria[-1])