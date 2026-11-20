-- =====================================================================
-- 06_dcl_tcl.sql  |  DCL (roles / privileges) and TCL (transactions)
-- =====================================================================
USE exam_system;

-- ---------------- DCL ----------------
CREATE USER IF NOT EXISTS 'exam_student'@'localhost' IDENTIFIED BY 'Student@123';
CREATE USER IF NOT EXISTS 'exam_teacher'@'localhost' IDENTIFIED BY 'Teacher@123';

-- students: read-only on reports, may only write their own answers
GRANT SELECT ON exam_system.vw_student_results TO 'exam_student'@'localhost';
GRANT SELECT ON exam_system.exams TO 'exam_student'@'localhost';
GRANT INSERT ON exam_system.responses TO 'exam_student'@'localhost';

-- teachers: manage the question bank and exams, read every report
GRANT SELECT, INSERT, UPDATE, DELETE ON exam_system.questions TO 'exam_teacher'@'localhost';
GRANT SELECT, INSERT, UPDATE ON exam_system.exams TO 'exam_teacher'@'localhost';
GRANT SELECT ON exam_system.vw_subject_performance TO 'exam_teacher'@'localhost';
GRANT EXECUTE ON PROCEDURE exam_system.sp_process_result TO 'exam_teacher'@'localhost';

GRANT SELECT ON exam_system.responses TO 'exam_teacher'@'localhost';
REVOKE SELECT ON exam_system.responses FROM 'exam_teacher'@'localhost';   -- REVOKE example
SHOW GRANTS FOR 'exam_student'@'localhost';

-- ---------------- TCL ----------------
-- Example 1: COMMIT - publish an exam only if it has questions
START TRANSACTION;
UPDATE exams SET status = 'published' WHERE exam_id = 5;
SAVEPOINT after_publish;
UPDATE exams SET pass_marks = 3 WHERE exam_id = 5;
ROLLBACK TO SAVEPOINT after_publish;      -- undo only the pass-marks change
COMMIT;

-- Example 2: ROLLBACK - a mistaken bulk update is cancelled
START TRANSACTION;
UPDATE results SET marks_obtained = 0;
SELECT COUNT(*) AS zeroed FROM results WHERE marks_obtained = 0;
ROLLBACK;
SELECT COUNT(*) AS zeroed_after_rollback FROM results WHERE marks_obtained = 0;
