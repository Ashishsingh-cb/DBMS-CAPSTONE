# ExamHall - Online Examination & Assessment Management System

DBMS capstone project. **React** front end, **Flask** API, **MySQL** database.

```
exam-system/
  database/   01_schema.sql  02_routines.sql  03_views.sql  04_seed.sql
              05_queries.sql 06_dcl_tcl.sql   07_dml_examples.sql
  backend/    app.py  setup_db.py  requirements.txt  .env.example
  frontend/   React + Vite app
  docs/       ER_diagram.md  normalization.md
```

## Features

**Student portal** - register and sign in, see only the exams for your department and semester, timed exam room with an OMR-style answer sheet, question navigator, flag-for-review, tab-switch warning, auto-submit at zero, instant result with class rank, percentile and question-by-question review, personal dashboard with charts.

**Teacher portal** - separate sign-in, question bank (add, edit, delete, search, filter), exam builder that picks questions from the bank, publish / close / reopen exams, ranked leaderboard per exam with CSV export, list of students who didn't attempt, student roster with semester rank, subject analytics and hardest-question analysis.

## Setup on Windows (VS Code terminal)

You need: **MySQL 8.0.31+**, **Python 3.10+**, **Node.js 18+**.

### 1. Backend + database (PowerShell)

```powershell
cd exam-system\backend
python -m venv venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

Open `.env` and put your MySQL root password in `DB_PASSWORD`. Then:

```powershell
python setup_db.py      # builds the database, triggers, views and demo data
python app.py           # API runs on http://localhost:5000
```

### 2. Frontend (a second terminal)

```powershell
cd exam-system\frontend
npm install
npm run dev             # opens http://localhost:5173
```

### Demo logins (password for all: `password123`)

| Role | Email |
|---|---|
| Teacher | prof.kapoor@college.edu (DBMS, OS) |
| Teacher | prof.rao@college.edu (Data Structures, Networks) |
| Student | aarav.sharma@college.edu (and 7 more students) |

Two exams are open for taking: *DBMS Mid-Semester Exam* and *Networks Quiz 1*. Past exams already have results so the rankings and charts are populated.

## Where each syllabus item lives

| Syllabus item | File |
|---|---|
| ER model | `docs/ER_diagram.md` |
| Relational model, keys, constraints, indexes | `database/01_schema.sql` |
| Normalization 1NF-BCNF | `docs/normalization.md` |
| DDL | `01_schema.sql`, `07_dml_examples.sql` (ALTER) |
| DML | `04_seed.sql`, `07_dml_examples.sql` |
| DCL | `06_dcl_tcl.sql` (CREATE USER, GRANT, REVOKE) |
| TCL | `06_dcl_tcl.sql` and procedure `sp_process_result` (START TRANSACTION, COMMIT, ROLLBACK, SAVEPOINT) |
| Inner / outer / self joins | `05_queries.sql` Q1 to Q5 |
| Nested and correlated subqueries | `05_queries.sql` Q6 to Q9 |
| UNION / INTERSECT / EXCEPT | `05_queries.sql` Q10 to Q12 |
| Views (4) | `03_views.sql` |
| Indexes (7) | bottom of `01_schema.sql` |
| Window functions | views + `05_queries.sql` Q13 to Q15 (RANK, DENSE_RANK, ROW_NUMBER, LAG, NTILE, PERCENT_RANK) |
| CTEs | `05_queries.sql` Q16 to Q17 |
| Triggers, stored procedure, function | `02_routines.sql` |

## How automated result processing works

1. Student submits. The API inserts one row per question into `responses`.
2. Trigger `trg_grade_response` checks each answer against `questions.correct_option` and sets `is_correct` and `marks_awarded`.
3. Procedure `sp_process_result` runs inside a transaction: totals the marks, closes the attempt, computes percentage, grade (`fn_grade`) and PASS/FAIL, and inserts the `results` row.
4. Views such as `vw_student_results` rank everyone with `RANK() OVER (PARTITION BY exam_id ORDER BY marks DESC)`.

## Troubleshooting

- **`Access denied for user 'root'`**: fix `DB_PASSWORD` in `backend\.env`.
- **`INTERSECT`/`EXCEPT` syntax error**: your MySQL is older than 8.0.31. Upgrade, or rewrite those with `IN` / `NOT IN`.
- **Script activation blocked in PowerShell**: run the `Set-ExecutionPolicy -Scope Process` line above in the same terminal.
- **Port 5000 busy**: change the port at the bottom of `app.py` and the proxy target in `frontend\vite.config.js`.
- Re-run `python setup_db.py` any time to reset the database to the demo data (it drops and recreates `exam_system`).
