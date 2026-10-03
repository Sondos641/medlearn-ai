# Sondos Note:
# This code combines the conversation and physical assessment.
# It keeps one patient throughout the Practice session,
# records the student's actions, collects the final report,
# and will later hold the final evaluation.

from case_generator import generate_case
from virtual_patient import get_patient_response

from physical_assessment import (
    perform_assessment,
    CARDIOVASCULAR_ACTIONS
)

from evaluator import (
    build_session_evidence,
    load_rubric,
    evaluate_session
)
# ============================================================
# START PRACTICE SESSION
# ============================================================

def start_practice_session(system="cardiovascular", difficulty="moderate"):
    """
    Generate ONE patient and create a new Practice session.
    """

    print("\nGenerating patient case...")

    case = generate_case(
        system=system,
        difficulty=difficulty
    )

    if not case:
        raise ValueError("Could not generate patient case.")

    session = {
        "case_id": case["case_id"],
        "case": case,

        # Stores student questions and patient answers
        "interview": [],

        # Stores physical assessments performed by the student
        "physical_assessment": [],

        # Final student report
        "student_report": None,

        # AI evaluation will be added later
        "evaluation": None
    }

    return session


# ============================================================
# STUDENT REPORT
# ============================================================

def collect_student_report():
    """
    Collect the student's final clinical assessment report.
    """

    print("\n======================================")
    print("          STUDENT REPORT")
    print("======================================")

    print(
        "\nComplete your report based on the interview "
        "and physical assessment.\n"
    )

    interview_summary = input(
        "Interview Summary:\n> "
    ).strip()

    physical_findings = input(
        "\nPhysical Assessment Findings:\n> "
    ).strip()

    identified_problems = input(
        "\nIdentified Problems:\n> "
    ).strip()

    supporting_evidence = input(
        "\nSupporting Evidence:\n> "
    ).strip()

    referral_decision = input(
        "\nReferral / Management Decision:\n> "
    ).strip()

    report = {
        "interview_summary": interview_summary,
        "physical_findings": physical_findings,
        "identified_problems": identified_problems,
        "supporting_evidence": supporting_evidence,
        "referral_decision": referral_decision
    }

    return report


# ============================================================
# PRACTICE SESSION
# ============================================================

if __name__ == "__main__":

    print("\n======================================")
    print("        MEDLEARN PRACTICE MODE")
    print("======================================")

    try:

        # ====================================================
        # GENERATE ONE PATIENT
        # ====================================================

        session = start_practice_session(
            system="cardiovascular",
            difficulty="moderate"
        )

        case = session["case"]
        student_view = case["student_view"]

        print("\n✅ Patient ready!")

        print("\n--------------------------------------")
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

        # Keep ONE conversation history for the whole session.
        # The patient remembers previous questions even if the
        # student switches to physical assessment and comes back.
        conversation_history = []

        session_ended = False

        # ====================================================
        # MAIN PRACTICE LOOP
        # ====================================================

        while not session_ended:

            print("\n======================================")
            print("          PRACTICE SESSION")
            print("======================================")

            print("1. 💬 Talk to Patient")
            print("2. 🩺 Physical Assessment")
            print("3. 🛑 End Session")

            choice = input(
                "\nChoose an option (1-3): "
            ).strip()

            # =================================================
            # TALK TO PATIENT
            # =================================================

            if choice == "1":

                print("\n--------------------------------------")
                print("TALK TO PATIENT")
                print("--------------------------------------")

                print(
                    "Ask questions freely. "
                    "Type 'back' to return to the Practice menu.\n"
                )

                while True:

                    student_message = input(
                        "Student: "
                    ).strip()

                    if student_message.lower() == "back":
                        break

                    if not student_message:
                        continue

                    try:

                        patient_reply = get_patient_response(
                            case,
                            student_message,
                            conversation_history
                        )

                        print(
                            f"\nPatient: "
                            f"{patient_reply}\n"
                        )

                        # Save conversation memory
                        conversation_history.append({
                            "role": "user",
                            "content": student_message
                        })

                        conversation_history.append({
                            "role": "assistant",
                            "content": patient_reply
                        })

                        # Save evidence for future evaluation
                        session["interview"].append({
                            "student_question": student_message,
                            "patient_response": patient_reply
                        })

                    except Exception as e:

                        print(
                            "\n❌ Interview error:",
                            str(e)
                        )

                        # =================================================
            # PHYSICAL ASSESSMENT
            # =================================================

            elif choice == "2":

                print("\n--------------------------------------")
                print("PHYSICAL ASSESSMENT")
                print("--------------------------------------")

                print(
                    "Choose the specific cardiovascular "
                    "assessment you want to perform."
                )

                print(
                    "You can perform multiple assessments "
                    "before returning to the Practice menu.\n"
                )

                while True:

                    print("\n--------------------------------------")
                    print("CARDIOVASCULAR ASSESSMENT")
                    print("--------------------------------------")

                    for number, action_info in (
                        CARDIOVASCULAR_ACTIONS.items()
                    ):

                        tool_text = ""

                        if action_info["tool"]:

                            tool_text = (
                                f" "
                                f"[{action_info['tool'].title()}]"
                            )

                        print(
                            f"{number}. "
                            f"{action_info['label']}"
                            f"{tool_text}"
                        )

                    print("16. Back to Practice Menu")

                    assessment_choice = input(
                        "\nChoose an assessment action "
                        "(1-16): "
                    ).strip()

                    if assessment_choice == "16":
                        break

                    result = perform_assessment(
                        case,
                        assessment_choice
                    )

                    if not result["success"]:

                        print(
                            f"\n❌ {result['message']}"
                        )

                        continue

                    print("\n--------------------------------------")

                    print(
                        f"Action: "
                        f"{result['label']}"
                    )

                    print(
                        f"Technique: "
                        f"{result['technique'].title()}"
                    )

                    print(
                        f"Area: "
                        f"{result['area']}"
                    )

                    if result["tool"]:

                        print(
                            f"Tool: "
                            f"{result['tool'].title()}"
                        )

                    print(
                        f"Finding: "
                        f"{result['finding']}"
                    )

                    # Save detailed evidence for AI evaluation
                    session["physical_assessment"].append({
                        "action": result["action"],
                        "label": result["label"],
                        "technique": result["technique"],
                        "area": result["area"],
                        "tool": result["tool"],
                        "finding": result["finding"]
                    })

            elif choice == "3":

                print(
                    "\n⚠️ Are you sure you want to "
                    "end the Practice session?"
                )

                confirm = input(
                    "Type 'yes' to confirm: "
                ).strip().lower()

                if confirm == "yes":

                    # Stop patient interaction
                    session_ended = True

                    # Open the final Student Report
                    session["student_report"] = (
                        collect_student_report()
                    )

                else:

                    print(
                        "\nReturning to Practice session..."
                    )

            # =================================================
            # INVALID MAIN MENU OPTION
            # =================================================

            else:

                print("❌ Invalid choice.")

        # ====================================================
        # SESSION FINISHED
        # ====================================================

        print("\n======================================")
        print("          SESSION ENDED")
        print("======================================")

        print(
            f"\nCase ID: "
            f"{session['case_id']}"
        )

        print(
            f"Interview questions recorded: "
            f"{len(session['interview'])}"
        )

        print(
            f"Physical assessments recorded: "
            f"{len(session['physical_assessment'])}"
        )

        # ====================================================
        # DISPLAY SUBMITTED REPORT
        # ====================================================

        print("\n--------------------------------------")
        print("SUBMITTED STUDENT REPORT")
        print("--------------------------------------")

        report = session["student_report"]

        print(
            f"\nInterview Summary:\n"
            f"{report['interview_summary']}"
        )

        print(
            f"\nPhysical Assessment Findings:\n"
            f"{report['physical_findings']}"
        )

        print(
            f"\nIdentified Problems:\n"
            f"{report['identified_problems']}"
        )

        print(
            f"\nSupporting Evidence:\n"
            f"{report['supporting_evidence']}"
        )

        print(
            f"\nReferral / Management Decision:\n"
            f"{report['referral_decision']}"
        )

        print(
            "\n✅ Student report submitted successfully."
        )

        # ====================================================
        # PREPARE DATA FOR AI EVALUATION
        # ====================================================

        evidence = build_session_evidence(session)

        rubric = load_rubric(
            session["case"]["system"]
        )

        print("\n======================================")
        print("       EVALUATION DATA READY")
        print("======================================")

        print(
            f"\nCase ID: "
            f"{evidence['case_id']}"
        )

        print(
            f"System: "
            f"{evidence['system']}"
        )

        print(
            f"Interview questions: "
            f"{len(evidence['interview'])}"
        )

        print(
            f"Physical assessment actions: "
            f"{len(evidence['physical_assessment'])}"
        )

        print(
            f"Report submitted: "
            f"{bool(evidence['student_report'])}"
        )

        print(
            f"Rubric sections loaded: "
            f"{len(rubric['sections'])}"
        )

        print(
            "\n✅ Practice session evidence and rubric "
            "are ready for AI evaluation."
        )
        # ====================================================
        # RUN AI EVALUATION
        # ====================================================

        print("\n🤖 Evaluating student performance...")

        evaluation = evaluate_session(session)

        session["evaluation"] = evaluation

        print("\n======================================")
        print("          PRACTICE RESULT")
        print("======================================")

        print(
            f"\nFinal Score: "
            f"{evaluation['score']}/100"
        )

        print("\n--------------------------------------")
        print("WHAT YOU DID WELL")
        print("--------------------------------------")

        for item in evaluation["feedback"]["did_well"]:
            print(f"• {item}")

        print("\n--------------------------------------")
        print("MISSED")
        print("--------------------------------------")

        for item in evaluation["feedback"]["missed"]:
            print(f"• {item}")

        print("\n--------------------------------------")
        print("PARTIALLY COMPLETED")
        print("--------------------------------------")

        for item in evaluation["feedback"]["partially_completed"]:
            print(f"• {item}")

        print("\n--------------------------------------")
        print("TOPICS TO FOCUS ON")
        print("--------------------------------------")

        for item in evaluation["feedback"]["focus_topics"]:
            print(f"• {item}")

        print("\n--------------------------------------")
        print("REPORT FEEDBACK")
        print("--------------------------------------")

        print(
            evaluation["feedback"]["report_feedback"]
        )

    except Exception as e:

        print(
            "\n❌ PRACTICE SESSION ERROR:",
            str(e)
        )