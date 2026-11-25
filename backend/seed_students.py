
import random
from database import init_db, register_user, get_user_by_email

init_db()
# Dummy student names
student_names = [
    "Sara Ahmed",
    "Noor Ali",
    "Fatima Hassan",
    "Maryam Khalid",
    "Aisha Mohammed",
    "Huda Salman",
    "Dana Ibrahim",
    "Layla Yousif",
    "Mariam Abdulla",
    "Reem Isa",
    "Zain Ali",
    "Ahmed Hasan",
    "Yusuf Khalid",
    "Hamad Ahmed",
    "Omar Salman",
    "Ali Mohammed",
    "Khalid Yousif",
    "Basma Isa",
    "Rana Ibrahim",
    "Eman Abdulla",
    "Maha Hassan",
    "Noura Ahmed",
    "Jana Salman",
    "Fatima Ali",
    "Sarah Mohammed"
]

# Enrollment years for the dummy students
enrollment_years = [2022, 2023, 2024, 2025]

# Temporary password assigned to all dummy students
TEMP_PASSWORD = "Student@2026"

created_count = 0

print("\n--- Creating Dummy Student Dataset ---\n")

for name in student_names:

    # Generate a unique 9-digit student ID
    while True:
        year = random.choice(enrollment_years)
        suffix = random.randint(10000, 99999)

        student_number = f"{year}{suffix}"
        email = f"{student_number}@stu.uob.edu.bh"

        if not get_user_by_email(email):
            break

    try:
        user = register_user(name, email, TEMP_PASSWORD)
        created_count += 1

        print(f"Name: {name}")
        print(f"Email: {email}")
        print(f"Password: {TEMP_PASSWORD}")
        print("-" * 40)

    except Exception as e:
        print(f"Error creating {name}: {e}")

print(f"\nSuccessfully created {created_count} students.")
