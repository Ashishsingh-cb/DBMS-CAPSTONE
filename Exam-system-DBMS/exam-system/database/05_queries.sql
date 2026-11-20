-- =====================================================================
-- 05_queries.sql  |  Syllabus coverage: joins, subqueries, set ops, window, CTE
-- Run each block separately in MySQL Workbench / VS Code SQL extension
-- =====================================================================
USE exam_system;

-- ===================== JOINS =====================
-- Q1  INNER JOIN (4 tables): student-wise result sheet
SELECT s.roll_no, s.full_name, sb.subject_name, e.title, r.marks_obtained, e.total_marks, r.grade, r.result_status
FROM results r
INNER JOIN students s  ON s.student_id = r.student_id
INNER JOIN exams e     ON e.exam_id = r.exam_id
INNER JOIN subjects sb ON sb.subject_id = e.subject_id
ORDER BY s.roll_no, e.start_time;

-- Q2  LEFT OUTER JOIN: students and exams they have NOT attempted yet (NULL = missing)
SELECT s.full_name, e.title, r.marks_obtained
FROM students s
CROSS JOIN exams e
LEFT JOIN results r ON r.student_id = s.student_id AND r.exam_id = e.exam_id
WHERE r.result_id IS NULL AND e.status IN ('published','closed')
ORDER BY s.full_name;

-- Q3  RIGHT OUTER JOIN: every subject, even if no exam has been held
SELECT sb.subject_name, COUNT(e.exam_id) AS exams_held
FROM exams e RIGHT JOIN subjects sb ON sb.subject_id = e.subject_id
GROUP BY sb.subject_id, sb.subject_name;

-- Q4  FULL OUTER JOIN (emulated with UNION, since MySQL has no FULL JOIN)
SELECT t.full_name, sb.subject_name FROM teachers t LEFT JOIN subjects sb ON sb.teacher_id = t.teacher_id
UNION
SELECT t.full_name, sb.subject_name FROM teachers t RIGHT JOIN subjects sb ON sb.teacher_id = t.teacher_id;

-- Q5  SELF JOIN: pairs of students in the same semester who scored equal marks in an exam
SELECT a.full_name AS student_1, b.full_name AS student_2, a.exam_title, a.marks_obtained
FROM vw_student_results a
JOIN vw_student_results b
  ON a.exam_id = b.exam_id AND a.marks_obtained = b.marks_obtained AND a.student_id < b.student_id;

-- ===================== SUBQUERIES =====================
-- Q6  Nested subquery: students who scored above the overall average percentage
SELECT s.full_name, r.percentage
FROM results r JOIN students s ON s.student_id = r.student_id
WHERE r.percentage > (SELECT AVG(percentage) FROM results);

-- Q7  Correlated subquery: each student's best result compared to their own average
SELECT s.full_name, r.exam_id, r.percentage
FROM results r JOIN students s ON s.student_id = r.student_id
WHERE r.percentage = (SELECT MAX(r2.percentage) FROM results r2 WHERE r2.student_id = r.student_id);

-- Q8  EXISTS: students who failed at least one exam
SELECT full_name FROM students s
WHERE EXISTS (SELECT 1 FROM results r WHERE r.student_id = s.student_id AND r.result_status = 'FAIL');

-- Q9  IN / NOT IN: questions never used in any exam
SELECT question_id, question_text FROM questions
WHERE question_id NOT IN (SELECT question_id FROM exam_questions);

-- ===================== SET OPERATIONS =====================
-- Q10 UNION: everyone who appeared in the DBMS or the OS exam
SELECT student_id FROM results WHERE exam_id = 1
UNION
SELECT student_id FROM results WHERE exam_id = 3;

-- Q11 INTERSECT: students who passed BOTH DBMS (1) and Data Structures (2)
SELECT student_id FROM results WHERE exam_id = 1 AND result_status = 'PASS'
INTERSECT
SELECT student_id FROM results WHERE exam_id = 2 AND result_status = 'PASS';

-- Q12 EXCEPT (MINUS): appeared in exam 1 but NOT in exam 3
SELECT student_id FROM results WHERE exam_id = 1
EXCEPT
SELECT student_id FROM results WHERE exam_id = 3;

-- ===================== WINDOW FUNCTIONS =====================
-- Q13 RANK / DENSE_RANK / ROW_NUMBER inside each exam
SELECT exam_id, full_name, marks_obtained,
       RANK()       OVER w AS rnk,
       DENSE_RANK() OVER w AS dense_rnk,
       ROW_NUMBER() OVER w AS row_no
FROM vw_student_results
WINDOW w AS (PARTITION BY exam_id ORDER BY marks_obtained DESC);

-- Q14 LAG: improvement of each student from the previous exam
SELECT s.full_name, e.title, r.percentage,
       r.percentage - LAG(r.percentage) OVER (PARTITION BY r.student_id ORDER BY e.start_time) AS change_vs_previous
FROM results r JOIN students s ON s.student_id = r.student_id JOIN exams e ON e.exam_id = r.exam_id;

-- Q15 Running average per student + NTILE quartiles per exam
SELECT s.full_name, e.title, r.percentage,
       ROUND(AVG(r.percentage) OVER (PARTITION BY r.student_id ORDER BY e.start_time), 2) AS running_avg,
       NTILE(4) OVER (PARTITION BY r.exam_id ORDER BY r.percentage DESC) AS quartile
FROM results r JOIN students s ON s.student_id = r.student_id JOIN exams e ON e.exam_id = r.exam_id;

-- ===================== CTEs =====================
-- Q16 CTE: topper of every subject
WITH ranked AS (
    SELECT subject_name, full_name, percentage,
           RANK() OVER (PARTITION BY subject_id ORDER BY percentage DESC) AS rnk
    FROM vw_student_results
)
SELECT subject_name, full_name, percentage FROM ranked WHERE rnk = 1;

-- Q17 Chained CTEs: students whose average is above their semester's average
WITH student_avg AS (
    SELECT student_id, full_name, semester, AVG(percentage) AS avg_pct FROM vw_student_results
    GROUP BY student_id, full_name, semester
), sem_avg AS (
    SELECT semester, AVG(avg_pct) AS sem_pct FROM student_avg GROUP BY semester
)
SELECT sa.full_name, ROUND(sa.avg_pct,2) AS avg_pct, ROUND(sm.sem_pct,2) AS semester_avg
FROM student_avg sa JOIN sem_avg sm ON sm.semester = sa.semester
WHERE sa.avg_pct > sm.sem_pct;

-- Q18 Hardest questions (analysis view)
SELECT * FROM vw_question_analysis WHERE times_answered > 0 ORDER BY success_pct ASC LIMIT 5;
