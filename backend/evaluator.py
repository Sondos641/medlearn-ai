# Sondos Note:
# Evaluates the student's complete Practice session using the clinical rubric
# and generates a score out of 100 with personalized feedback
import json
import os

from dotenv import load_dotenv
from groq import Groq


# ============================================================
# GROQ SETUP
# ============================================================

load_dotenv()

API_KEY = os.getenv("GROQ_API_KEY")

if not API_KEY:
    raise ValueError("GROQ_API_KEY was not found in .env")

client = Groq(api_key=API_KEY)


# ============================================================
# CALCULATE FINAL SCORE
# ============================================================

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

    percentage = (
        earned_points / maximum_points
    ) * 100

    return round(percentage, 1)


# ============================================================
# BUILD SESSION EVIDENCE
# ============================================================

def build_session_evidence(session):
    """
    Prepare the student's work for evaluation.
    """

    evidence = {
        "case_id": session.get("case_id"),

        "system": session.get(
            "case",
            {}
        ).get(
            "system",
            ""
        ),

        "interview": session.get(
            "interview",
            []
        ),

        "physical_assessment": session.get(
            "physical_assessment",
            []
        ),

        "student_report": session.get(
            "student_report",
            {}
        )
    }

    return evidence