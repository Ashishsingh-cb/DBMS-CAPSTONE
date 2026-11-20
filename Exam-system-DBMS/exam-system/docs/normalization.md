# Normalization (1NF to BCNF)

We start from the single sheet an examination cell might keep in Excel.

## Unnormalized table

`EXAM_SHEET(roll_no, student_name, dept_name, semester, subject_code, subject_name, teacher_name, exam_title, exam_date, total_marks, q_ids, answers, marks_obtained, grade)`

Problems: `q_ids` and `answers` hold lists in one cell; student, subject and teacher details repeat on every row.

## 1NF - atomic values, no repeating groups

Split `q_ids` / `answers` into one row per (attempt, question). Every column now holds a single value and each row is identifiable.

`RESPONSE_SHEET(roll_no, exam_id, question_id, selected_option, student_name, dept_name, semester, subject_code, subject_name, teacher_name, exam_title, total_marks, question_text, correct_option, ...)`
Candidate key: `(roll_no, exam_id, question_id)`

## 2NF - remove partial dependencies

Non-key attributes must depend on the **whole** key.

| Attribute | Depends on | Action |
|---|---|---|
| `student_name, dept_name, semester` | `roll_no` only | move to **students** |
| `exam_title, total_marks, subject_code` | `exam_id` only | move to **exams** |
| `question_text, correct_option, marks` | `question_id` only | move to **questions** |
| `selected_option` | full key | stays in **responses** |

## 3NF - remove transitive dependencies

Non-key attributes must depend on the key and nothing else.

- `students`: `roll_no -> dept_id -> dept_name` so `dept_name` moves to **departments**.
- `exams`: `exam_id -> subject_id -> subject_name, teacher_id -> teacher_name`. Subject and teacher facts move to **subjects** and **teachers**.
- `results`: `marks_obtained -> percentage -> grade`. We still store `grade` because it is a snapshot at processing time (a deliberate, documented denormalization so old grades don't change if the grading scale does).

## BCNF - every determinant is a candidate key

Check each table's functional dependencies:

| Table | Determinants | Candidate key? |
|---|---|---|
| users | `user_id`, `email` | both candidate keys |
| students | `student_id`, `roll_no`, `user_id` | all candidate keys |
| subjects | `subject_id`, `subject_code` | both candidate keys |
| exam_questions | `(exam_id, question_id)` | the only key |
| attempts | `attempt_id`, `(exam_id, student_id)` | both candidate keys |
| responses | `response_id`, `(attempt_id, question_id)` | both candidate keys |
| results | `result_id`, `attempt_id` | both candidate keys |

No dependency has a determinant that is not a candidate key, so the final schema is in **BCNF**.

### Why `exam_questions` exists
An exam has many questions and a question can be reused in many exams (M:N). Storing a list of question ids inside `exams` would break 1NF, so the junction table is required.
