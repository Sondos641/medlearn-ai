# Sondos Note:
# This code combines the conversation and physical assessment.
# It keeps one patient throughout the Practice session,
# records the student's actions, collects the final report,
# and will later hold the final evaluation.

from case_generator import generate_case
from virtual_patient import get_patient_response
from physical_assessment import perform_assessment


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

                techniques = {
                    "1": "inspection",
                    "2": "palpation",
                    "3": "percussion",
                    "4": "auscultation"
                }

                print("\n--------------------------------------")
                print("PHYSICAL ASSESSMENT")
                print("--------------------------------------")

                print("1. Inspection")
                print("2. Palpation")
                print("3. Percussion")
                print("4. Auscultation")
                print("5. Back to Practice Menu")

                while True:

                    assessment_choice = input(
                        "\nChoose a technique (1-5): "
                    ).strip()

                    if assessment_choice == "5":
                        break

                    technique = techniques.get(
                        assessment_choice
                    )

                    if not technique:
                        print("❌ Invalid choice.")
                        continue

                    result = perform_assessment(
                        case,
                        technique
                    )

                    print(
                        f"\nTechnique: "
                        f"{technique.title()}"
                    )

                    print(
                        f"Finding: "
                        f"{result['finding']}"
                    )

                    # Save evidence for future evaluation
                    session["physical_assessment"].append({
                        "technique": technique,
                        "finding": result["finding"]
                    })

            # =================================================
            # END SESSION
            # =================================================

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

        print(
            "\nNext step: AI Evaluation /100 🎯"
        )

    except Exception as e:

        print(
            "\n❌ PRACTICE SESSION ERROR:",
            str(e)
        )