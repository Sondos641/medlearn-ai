
import sqlite3
import random

from database import DB_PATH, init_db

# Initialize database and ensure faculty_id exists
init_db()

# Connect to the database
with sqlite3.connect(DB_PATH) as conn:
    conn.row_factory = sqlite3.Row

    # Get the four faculty members
    faculty = conn.execute("""
        SELECT id, name, email
        FROM users
        WHERE role = 'faculty'
    """).fetchall()

    if len(faculty) != 4:
        raise Exception("Expected exactly 4 faculty accounts.")

    # Get all authorized students
    students = conn.execute("""
        SELECT id, name, email
        FROM users
        WHERE role = 'student'
    """).fetchall()

    if len(students) != 25:
        raise Exception(f"Expected 25 students, found {len(students)}.")

    # Shuffle students randomly
    students = list(students)
    random.shuffle(students)

    # Find Dr. Marwan
    marwan = next(
        (member for member in faculty if member["name"] == "Dr. Marwan"),
        None
    )

    if not marwan:
        raise Exception("Dr. Marwan was not found.")

    # Assign 7 to Marwan and 6 to each other instructor
    other_faculty = [
        member for member in faculty
        if member["id"] != marwan["id"]
    ]

    random.shuffle(other_faculty)

    assignments = [
        (marwan, 7),
        (other_faculty[0], 6),
        (other_faculty[1], 6),
        (other_faculty[2], 6),
    ]

    # Update student assignments
    start = 0

    for instructor, count in assignments:
        group = students[start:start + count]

        for student in group:
            conn.execute("""
                UPDATE users
                SET faculty_id = ?
                WHERE id = ? AND role = 'student'
            """, (instructor["id"], student["id"]))

        start += count

        print(f"\n{instructor['name']} - {count} students:")

        for student in group:
            print(f"  {student['name']} ({student['email']})")

    conn.commit()

print("\nStudent assignment completed successfully!")
