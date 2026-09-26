# Sondos Note: guys this file is to handle the physical examination and returns findings based on what the student examines
# if you don't examine a body system, it will return "not examined" for that body system
# if you examine a body system, it will return the findings based on the examination techniques and the hidden case
# if you didn't understand read again, DONT PANICK ZOZ I WILL EXPLAIN TO U IN THE NEXT MEETING jsksks :)
def perform_assessment(case_data, technique):
    """
    Return the physical finding for the assessment technique
    selected by the student.
    """

    technique = technique.lower().strip()

    # Get hidden physical findings from the generated patient
    physical_findings = (
        case_data
        .get("hidden_case", {})
        .get("physical_findings", {})
    )

    # Techniques the student is allowed to perform
    allowed_techniques = [
        "inspection",
        "palpation",
        "percussion",
        "auscultation"
    ]

    if technique not in allowed_techniques:
        return {
            "success": False,
            "technique": technique,
            "finding": None,
            "message": "Invalid assessment technique."
        }

    # Get the finding for the selected technique
    findings = physical_findings.get(technique, [])

    if not findings:
        return {
            "success": True,
            "technique": technique,
            "finding": "No specific finding available for this assessment.",
            "message": None
        }

    # Convert list of findings into readable text
    if isinstance(findings, list):
        finding_text = " ".join(findings)
    else:
        finding_text = str(findings)

    return {
        "success": True,
        "technique": technique,
        "finding": finding_text,
        "message": None
    }

    # ============================================================
# TERMINAL TEST
# ============================================================

if __name__ == "__main__":

    from case_generator import generate_case

    print("\n======================================")
    print("     PHYSICAL ASSESSMENT TEST")
    print("======================================")

    print("\nGenerating patient case...")
    case = generate_case(
        system="cardiovascular",
        difficulty="moderate"
    )

    if not case:
        print("❌ Could not generate patient case.")
        exit()

    print("✅ Patient ready!")

    print("\nAvailable techniques:")
    print("1. Inspection")
    print("2. Palpation")
    print("3. Percussion")
    print("4. Auscultation")
    print("5. Exit")

    techniques = {
        "1": "inspection",
        "2": "palpation",
        "3": "percussion",
        "4": "auscultation"
    }

    while True:

        choice = input("\nChoose a technique (1-5): ").strip()

        if choice == "5":
            print("\nAssessment ended.")
            break

        technique = techniques.get(choice)

        if not technique:
            print("❌ Invalid choice.")
            continue

        result = perform_assessment(
            case,
            technique
        )

        print(f"\nTechnique: {technique.title()}")
        print(f"Finding: {result['finding']}")