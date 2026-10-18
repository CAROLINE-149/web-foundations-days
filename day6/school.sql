

-- DAY 6: SCHOOL DATABASE
-- SQLite-compatible SQL


-- Enable foreign key enforcement in SQLite.
PRAGMA foreign_keys = ON;

-- Drop existing tables so this script can be
-- run repeatedly without table conflicts.
DROP TABLE IF EXISTS enrolments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS students;


-- 1. CREATE TABLES


-- Students: stores student information.
CREATE TABLE students (
    student_id INTEGER PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);

-- Courses: stores information about courses.
CREATE TABLE courses (
    course_id INTEGER PRIMARY KEY,
    course_name TEXT NOT NULL,
    course_code TEXT NOT NULL UNIQUE,
    credits INTEGER NOT NULL CHECK (credits > 0)
);

-- Enrolments: connects students to courses.
-- A student can enrol in many courses, and a
-- course can have many students.
CREATE TABLE enrolments (
    enrolment_id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    enrolment_date TEXT NOT NULL,
    grade TEXT,

    FOREIGN KEY (student_id)
        REFERENCES students(student_id),

    FOREIGN KEY (course_id)
        REFERENCES courses(course_id),

    -- Prevent duplicate enrolment in a course.
    UNIQUE (student_id, course_id)
);


-- 2. INSERT SAMPLE STUDENTS


INSERT INTO students
    (student_id, first_name, last_name, email)
VALUES
    (1, 'Amina', 'Otieno', 'amina@example.com'),
    (2, 'Brian', 'Kamau', 'brian@example.com'),
    (3, 'Grace', 'Wanjiku', 'grace@example.com'),
    (4, 'David', 'Omondi', 'david@example.com');


-- 3. INSERT SAMPLE COURSES


INSERT INTO courses
    (course_id, course_name, course_code, credits)
VALUES
    (1, 'Database Systems', 'CS201', 3),
    (2, 'Web Development', 'CS202', 4),
    (3, 'Computer Networks', 'CS203', 3);


-- 4. INSERT SAMPLE ENROLMENTS


INSERT INTO enrolments
    (enrolment_id, student_id, course_id,
     enrolment_date, grade)
VALUES
    (1, 1, 1, '2026-09-01', 'A'),
    (2, 1, 2, '2026-09-02', 'B'),
    (3, 2, 1, '2026-09-01', 'B'),
    (4, 2, 3, '2026-09-03', 'A'),
    (5, 3, 2, '2026-09-02', 'A'),
    (6, 3, 3, '2026-09-03', NULL);


-- 5. QUERY: ALL COURSES FOR ONE STUDENT
-- Find courses taken by Amina Otieno.


SELECT
    s.first_name,
    s.last_name,
    c.course_name,
    c.course_code,
    e.grade
FROM students AS s
JOIN enrolments AS e
    ON s.student_id = e.student_id
JOIN courses AS c
    ON e.course_id = c.course_id
WHERE s.first_name = 'Amina'
  AND s.last_name = 'Otieno';


-- 6. QUERY: ALL STUDENTS ON ONE COURSE
-- Find students enrolled in Web Development.


SELECT
    s.student_id,
    s.first_name,
    s.last_name,
    s.email
FROM students AS s
JOIN enrolments AS e
    ON s.student_id = e.student_id
JOIN courses AS c
    ON e.course_id = c.course_id
WHERE c.course_name = 'Web Development';


-- 7. QUERY: NUMBER OF STUDENTS PER COURSE
-- Include courses with zero enrolments.


SELECT
    c.course_name,
    COUNT(e.student_id) AS student_count
FROM courses AS c
LEFT JOIN enrolments AS e
    ON c.course_id = e.course_id
GROUP BY c.course_id, c.course_name
ORDER BY c.course_name;


-- 8. QUERY: STUDENTS WITH NO ENROLMENTS


SELECT
    s.student_id,
    s.first_name,
    s.last_name,
    s.email
FROM students AS s
LEFT JOIN enrolments AS e
    ON s.student_id = e.student_id
WHERE e.student_id IS NULL;


-- 9. UPDATE ONE ENROLMENT'S GRADE
-- Change Brian's Database Systems grade to A.


UPDATE enrolments
SET grade = 'A'
WHERE student_id = 2
  AND course_id = 1;

-- Verify the grade update.
SELECT
    s.first_name,
    s.last_name,
    c.course_name,
    e.grade
FROM enrolments AS e
JOIN students AS s
    ON e.student_id = s.student_id
JOIN courses AS c
    ON e.course_id = c.course_id
WHERE e.student_id = 2
  AND e.course_id = 1;
