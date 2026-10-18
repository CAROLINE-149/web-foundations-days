
# School Database Design

## 1. Table Descriptions

### Students

The `students` table stores each student's personal and contact
information. The primary key is `student_id`, which uniquely identifies
each student. The `email` field is required and must be unique so that
two students cannot register with the same email address.

### Courses

The `courses` table stores the courses offered by the school. The
primary key is `course_id`. Each course has a name, a unique course code,
and a positive number of credits.

### Enrolments

The `enrolments` table records which students take which courses. It
contains foreign keys referencing `students` and `courses`, an
enrolment date, and an optional grade. The combination of `student_id`
and `course_id` must be unique to prevent duplicate enrolments.

## 2. Relationships

### Students and Enrolments: One-to-Many

One student can have many enrolment records because they can take
several courses. Each enrolment belongs to one student. Therefore,
the relationship between students and enrolments is one-to-many.

### Courses and Enrolments: One-to-Many

One course can have many enrolment records because multiple students
can take the same course. Each enrolment refers to one course.
Therefore, the relationship between courses and enrolments is
one-to-many.

### Students and Courses: Many-to-Many

Students and courses have a many-to-many relationship. One student can
take many courses, and one course can have many students.

A join table called `enrolments` is needed to represent this
relationship in a relational database. It stores the foreign keys
`student_id` and `course_id`, along with information specific to each
enrolment, such as the date and grade. The join table also allows the
database to prevent duplicate enrolments.

## 3. Recommended Index

I would add an index on `enrolments.course_id`:

    CREATE INDEX idx_enrolments_course_id
    ON enrolments(course_id);

This index can improve queries that find all students taking a
particular course and queries that count enrolments per course.
The existing unique constraint on `(student_id, course_id)` does
not provide the same leading-column index for searches by
`course_id` alone.

## 4. SQL or NoSQL?

I would choose SQL for this school system because students, courses,
and enrolments have clear relationships and structured data. A
relational database supports primary keys, foreign keys, unique
constraints, and transactions that help maintain data integrity.
SQL joins also make it straightforward to retrieve students taking
a course or calculate enrolment counts. NoSQL could be useful for
some less structured data, but a relational database such as SQLite
is a suitable choice for this system.
