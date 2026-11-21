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
    Calculate the final score from rubric criteria.
    Each criterion must contain:
    - score
    - max_score
    """

    earned_points = 0
    maximum_points = 0

    for criterion in criteria:
        score = criterion.get("score", 0)
        max_score = criterion.get("max_score", 0)

        earned_points += score
        maximum_points += max_score

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
You are the clinical assessment evaluator for MedLearn AI.

Your job is to evaluate a nursing student's completed clinical
assessment session using the provided official scoring rubric.

IMPORTANT SCORING RULES:

1. Evaluate EVERY rubric criterion separately.

2. Each criterion must receive ONLY:
   0 = Not done
   1 = Partially performed
   2 = Performed correctly

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
            "evidence": "Specific evidence from the student session, or No evidence",
            "reason": "Short explanation for the score"
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
        max_tokens=6000
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

        if score not in [0, 1, 2]:
            raise ValueError(
                f"Invalid score for criterion "
                f"{criterion_id}: {score}"
            )

        official_criterion = rubric_lookup[
            criterion_id
        ]

        validated_criteria.append({
            "id": criterion_id,
            "section": official_criterion["section"],
            "criterion": official_criterion["criterion"],
            "score": score,
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




    # --------------------------------------------------------
    # 9. Python calculates final score
    # --------------------------------------------------------

    final_score = calculate_score(
        validated_criteria
    )


    # --------------------------------------------------------
    # 10. Build final evaluation
    # --------------------------------------------------------

    final_evaluation = {
        "score": final_score,
        "total_marks": rubric["total_marks"],
        "criteria": validated_criteria,
        "feedback": {
            "did_well": map_feedback_items(
                evaluation.get("did_well", [])
            ),
            "missed": map_feedback_items(
                evaluation.get("missed", [])
            ),
            "partially_completed": map_feedback_items(
                evaluation.get("partially_completed", [])
            ),
            "focus_topics": map_feedback_items(
                evaluation.get("focus_topics", [])
            ),
            "report_feedback": evaluation.get(
                "report_feedback",
                ""
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