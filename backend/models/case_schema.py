# Sondos Note: this is low key an empty patient form :)
CASE_SCHEMA = {
    "case_id": "",
    "system": "",
    "difficulty": "",

    # Information the student is allowed to see
    "student_view": {
        "patient_name": "",
        "age": 0,
        "sex": "",
        "occupation": "",
        "setting": "",
        "chief_complaint": ""
    },

    # Information hidden from the student
    "hidden_case": {
        "condition": "",

        "history": {
            "presenting_complaint": "",

            "pqrst": {
                "provocation_palliation": "",
                "quality": "",
                "region_radiation": "",
                "severity": "",
                "timing": ""
            },

            "review_of_systems": [],
            "past_medical_history": [],
            "medications": [],
            "allergies": [],
            "family_history": [],
            "social_history": [],
            "adl_impact": ""
        },

        "physical_findings": {
            "general_appearance": "",
            "vital_signs": {
                "blood_pressure": "",
                "heart_rate": "",
                "respiratory_rate": "",
                "temperature": "",
                "oxygen_saturation": ""
            },

            "inspection": [],
            "palpation": [],
            "percussion": [],
            "auscultation": []
        },

        "expected_problems": [],

        "referral": {
            "decision": "",
            "urgency": "",
            "reason": ""
        }
    },

    # Filled with the rubric for the selected body system
    "rubric": []
}