# Sondos Note: guys this file is to handle the physical examination and returns findings based on what the student examines
# if you don't examine a body system, it will return "not examined" for that body system
# if you examine a body system, it will return the findings based on the examination techniques and the hidden case
# if you didn't understand read again, DONT PANICK ZOZ I WILL EXPLAIN TO U IN THE NEXT MEETING jsksks :)


# ============================================================
# CARDIOVASCULAR PHYSICAL ASSESSMENT ACTIONS
# ============================================================

CARDIOVASCULAR_ACTIONS = {
    "1": {
        "action": "inspect_precordium",
        "technique": "inspection",
        "area": "precordium",
        "tool": None,
        "label": "Inspect precordium"
    },

    "2": {
        "action": "palpate_apex",
        "technique": "palpation",
        "area": "apex beat",
        "tool": None,
        "label": "Palpate apex beat"
    },

    "3": {
        "action": "check_lv_heave",
        "technique": "palpation",
        "area": "precordium",
        "tool": None,
        "label": "Check for LV heave"
    },

    "4": {
        "action": "check_thrills",
        "technique": "palpation",
        "area": "cardiac valve areas",
        "tool": None,
        "label": "Check for thrills"
    },

    "5": {
        "action": "auscultate_heart_diaphragm",
        "technique": "auscultation",
        "area": "five cardiac valve areas",
        "tool": "diaphragm",
        "label": "Auscultate heart with diaphragm"
    },

    "6": {
        "action": "auscultate_apex_bell",
        "technique": "auscultation",
        "area": "apex",
        "tool": "bell",
        "label": "Auscultate apex with bell"
    },

    "7": {
        "action": "assess_jvp",
        "technique": "inspection",
        "area": "jugular venous pressure",
        "tool": None,
        "label": "Assess JVP at 45 degrees"
    },

    "8": {
        "action": "auscultate_carotids",
        "technique": "auscultation",
        "area": "carotid arteries",
        "tool": "bell",
        "label": "Auscultate carotids"
    },

    "9": {
        "action": "inspect_upper_extremities",
        "technique": "inspection",
        "area": "upper extremities",
        "tool": None,
        "label": "Inspect upper extremities"
    },

    "10": {
        "action": "palpate_upper_pulses",
        "technique": "palpation",
        "area": "upper extremity pulses",
        "tool": None,
        "label": "Palpate upper extremity pulses"
    },

    "11": {
        "action": "inspect_lower_extremities",
        "technique": "inspection",
        "area": "lower extremities",
        "tool": None,
        "label": "Inspect lower extremities"
    },

    "12": {
        "action": "palpate_lower_pulses",
        "technique": "palpation",
        "area": "lower extremity pulses",
        "tool": None,
        "label": "Palpate lower extremity pulses"
    },

    "13": {
        "action": "grade_edema",
        "technique": "palpation",
        "area": "lower extremities",
        "tool": None,
        "label": "Assess and grade edema"
    },

    "14": {
        "action": "capillary_refill_upper",
        "technique": "palpation",
        "area": "upper extremities",
        "tool": None,
        "label": "Assess upper extremity capillary refill"
    },

    "15": {
        "action": "capillary_refill_lower",
        "technique": "palpation",
        "area": "lower extremities",
        "tool": None,
        "label": "Assess lower extremity capillary refill"
    }
}


# ============================================================
# HELPER FUNCTION
# ============================================================

def _combine_findings(findings):
    """
    Convert findings into one readable string.
    """

    if not findings:
        return ""

    if isinstance(findings, list):
        return " ".join(str(item) for item in findings)

    return str(findings)


# ============================================================
# FIND RELEVANT HIDDEN FINDING
# ============================================================

def _find_relevant_finding(physical_findings, action_info):
    """
    Find the most relevant hidden-case finding for the exact
    physical assessment action performed by the student.

    This is a temporary bridge while generated cases still store
    findings under broad categories such as inspection,
    palpation, percussion, and auscultation.
    """

    technique = action_info["technique"]
    action = action_info["action"]

    technique_findings = _combine_findings(
        physical_findings.get(technique, [])
    )

    all_findings = " ".join([
        _combine_findings(
            physical_findings.get("inspection", [])
        ),
        _combine_findings(
            physical_findings.get("palpation", [])
        ),
        _combine_findings(
            physical_findings.get("percussion", [])
        ),
        _combine_findings(
            physical_findings.get("auscultation", [])
        )
    ]).strip()

    # --------------------------------------------------------
    # ACTION-SPECIFIC KEYWORDS
    # --------------------------------------------------------

    keywords = {
        "inspect_precordium": [
            "precordium",
            "scar",
            "contour",
            "visible",
            "apex"
        ],

        "palpate_apex": [
            "apex",
            "apical",
            "displaced"
        ],

        "check_lv_heave": [
            "heave",
            "lift"
        ],

        "check_thrills": [
            "thrill"
        ],

        "auscultate_heart_diaphragm": [
            "s1",
            "s2",
            "murmur",
            "rhythm",
            "heart rate"
        ],

        "auscultate_apex_bell": [
            "s3",
            "s4",
            "gallop"
        ],

        "assess_jvp": [
            "jvp",
            "jugular",
            "venous"
        ],

        "auscultate_carotids": [
            "carotid",
            "bruit"
        ],

        "inspect_upper_extremities": [
            "upper extrem",
            "clubbing",
            "cyanosis",
            "pallor"
        ],

        "palpate_upper_pulses": [
            "radial",
            "brachial",
            "upper pulse"
        ],

        "inspect_lower_extremities": [
            "lower extrem",
            "leg",
            "ankle",
            "skin",
            "edema",
            "oedema"
        ],

        "palpate_lower_pulses": [
            "femoral",
            "popliteal",
            "posterior tibial",
            "dorsalis pedis",
            "lower pulse"
        ],

        "grade_edema": [
            "edema",
            "oedema",
            "pitting"
        ],

        "capillary_refill_upper": [
            "capillary refill"
        ],

        "capillary_refill_lower": [
            "capillary refill"
        ]
    }

    action_keywords = keywords.get(
        action,
        []
    )

    # Break the hidden findings into smaller pieces.
    possible_findings = []

    for category in [
        "inspection",
        "palpation",
        "percussion",
        "auscultation"
    ]:

        values = physical_findings.get(
            category,
            []
        )

        if isinstance(values, list):
            possible_findings.extend(
                str(value) for value in values
            )

        elif values:
            possible_findings.append(
                str(values)
            )

    # Find only findings related to the exact action.
    matched_findings = []

    for finding in possible_findings:

        finding_lower = finding.lower()

        if any(
            keyword in finding_lower
            for keyword in action_keywords
        ):
            matched_findings.append(finding)

    if matched_findings:
        return " ".join(matched_findings)

    # If nothing action-specific was found, do NOT reveal all
    # findings from the broad technique.
    if technique_findings:
        return (
            "Assessment performed, but no specific "
            "finding for this exact area is available "
            "in the generated case."
        )

    if all_findings:
        return (
            "Assessment performed. No specific finding "
            "for this exact action is available."
        )

    return "No specific finding available for this assessment."


# ============================================================
# PERFORM PHYSICAL ASSESSMENT
# ============================================================

def perform_assessment(case_data, action):
    """
    Perform one specific physical assessment action.

    Returns structured evidence containing:
    - action
    - technique
    - area
    - tool
    - finding
    """

    action = str(action).strip()

    # Allow either menu number or action name.
    if action in CARDIOVASCULAR_ACTIONS:

        action_info = CARDIOVASCULAR_ACTIONS[action]

    else:

        action_info = None

        for item in CARDIOVASCULAR_ACTIONS.values():

            if item["action"] == action.lower():
                action_info = item
                break

    if not action_info:

        return {
            "success": False,
            "action": action,
            "technique": None,
            "area": None,
            "tool": None,
            "finding": None,
            "message": "Invalid physical assessment action."
        }

    physical_findings = (
        case_data
        .get("hidden_case", {})
        .get("physical_findings", {})
    )

    finding = _find_relevant_finding(
        physical_findings,
        action_info
    )

    return {
        "success": True,
        "action": action_info["action"],
        "label": action_info["label"],
        "technique": action_info["technique"],
        "area": action_info["area"],
        "tool": action_info["tool"],
        "finding": finding,
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

    while True:

        print("\n--------------------------------------")
        print("CARDIOVASCULAR ASSESSMENT")
        print("--------------------------------------")

        for number, action_info in CARDIOVASCULAR_ACTIONS.items():

            tool_text = ""

            if action_info["tool"]:
                tool_text = (
                    f" [{action_info['tool'].title()}]"
                )

            print(
                f"{number}. "
                f"{action_info['label']}"
                f"{tool_text}"
            )

        print("16. Exit")

        choice = input(
            "\nChoose an assessment action (1-16): "
        ).strip()

        if choice == "16":
            print("\nAssessment ended.")
            break

        result = perform_assessment(
            case,
            choice
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