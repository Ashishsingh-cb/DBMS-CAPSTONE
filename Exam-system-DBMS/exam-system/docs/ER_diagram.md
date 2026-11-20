# ER Diagram

Paste the block below into https://mermaid.live (or the VS Code "Markdown Preview Mermaid Support" extension) to render and export it as an image for your report.

```mermaid
erDiagram
    DEPARTMENTS ||--o{ STUDENTS : "enrols"
    DEPARTMENTS ||--o{ TEACHERS : "employs"
    DEPARTMENTS ||--o{ SUBJECTS : "offers"
    USERS ||--o| STUDENTS : "logs in as"
    USERS ||--o| TEACHERS : "logs in as"
    TEACHERS ||--o{ SUBJECTS : "teaches"
    TEACHERS ||--o{ QUESTIONS : "authors"
    TEACHERS ||--o{ EXAMS : "creates"
    SUBJECTS ||--o{ QUESTIONS : "has"
    SUBJECTS ||--o{ EXAMS : "assessed by"
    EXAMS ||--|{ EXAM_QUESTIONS : "contains"
    QUESTIONS ||--o{ EXAM_QUESTIONS : "used in"
    EXAMS ||--o{ ATTEMPTS : "attempted in"
    STUDENTS ||--o{ ATTEMPTS : "makes"
    ATTEMPTS ||--o{ RESPONSES : "records"
    QUESTIONS ||--o{ RESPONSES : "answered in"
    ATTEMPTS ||--o| RESULTS : "produces"

    DEPARTMENTS { int dept_id PK  string dept_name UK }
    USERS { int user_id PK  string email UK  string password_hash  enum role }
    STUDENTS { int student_id PK  int user_id FK  string roll_no UK  string full_name  int dept_id FK  int semester }
    TEACHERS { int teacher_id PK  int user_id FK  string full_name  int dept_id FK }
    SUBJECTS { int subject_id PK  string subject_code UK  string subject_name  int semester  int dept_id FK  int teacher_id FK }
    QUESTIONS { int question_id PK  int subject_id FK  int created_by FK  text question_text  char correct_option  int marks  enum difficulty }
    EXAMS { int exam_id PK  int subject_id FK  int created_by FK  string title  datetime start_time  datetime end_time  int duration_min  int total_marks  int pass_marks  enum status }
    EXAM_QUESTIONS { int exam_id PK_FK  int question_id PK_FK }
    ATTEMPTS { int attempt_id PK  int exam_id FK  int student_id FK  datetime started_at  datetime submitted_at  enum status }
    RESPONSES { int response_id PK  int attempt_id FK  int question_id FK  char selected_option  bool is_correct  int marks_awarded }
    RESULTS { int result_id PK  int attempt_id FK_UK  int exam_id FK  int student_id FK  int marks_obtained  decimal percentage  char grade  enum result_status }
```

## Relationship summary

| Relationship | Cardinality | Implemented by |
|---|---|---|
| Department - Student / Teacher / Subject | 1 : N | `dept_id` foreign keys |
| User - Student / Teacher | 1 : 0..1 | `user_id` unique FK |
| Teacher - Subject | 1 : N | `subjects.teacher_id` |
| Exam - Question | **M : N** | junction table `exam_questions` (composite PK) |
| Student - Exam | **M : N** | resolved by `attempts` (unique per student and exam) |
| Attempt - Result | 1 : 1 | `results.attempt_id` UNIQUE |

## Integrity constraints used

- **PRIMARY KEY** on every table, **composite PK** on `exam_questions`
- **FOREIGN KEY** with `ON DELETE CASCADE` where children cannot exist alone
- **UNIQUE**: `users.email`, `students.roll_no`, `subjects.subject_code`, `(exam_id, student_id)` on attempts, `(attempt_id, question_id)` on responses
- **CHECK**: semester 1-8, `correct_option IN ('A'..'D')`, `end_time > start_time`, `marks > 0`
- **NOT NULL / DEFAULT / ENUM** for status columns
