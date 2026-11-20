-- =====================================================================
-- VIEWS  (performance reports & result analysis)
-- =====================================================================
USE exam_system;

-- VIEW 1: student-wise result sheet with RANK inside each exam (window function)
CREATE OR REPLACE VIEW vw_student_results AS
SELECT  r.result_id, r.exam_id, e.title AS exam_title, e.exam_type,
        sb.subject_id, sb.subject_code, sb.subject_name, sb.semester,
        s.student_id, s.roll_no, s.full_name,
        r.marks_obtained, e.total_marks, r.percentage, r.grade, r.result_status,
        RANK()       OVER (PARTITION BY r.exam_id ORDER BY r.marks_obtained DESC) AS exam_rank,
        DENSE_RANK() OVER (PARTITION BY r.exam_id ORDER BY r.marks_obtained DESC) AS dense_exam_rank,
        PERCENT_RANK() OVER (PARTITION BY r.exam_id ORDER BY r.marks_obtained)    AS percentile
FROM results r
JOIN exams e     ON e.exam_id = r.exam_id
JOIN subjects sb ON sb.subject_id = e.subject_id
JOIN students s  ON s.student_id = r.student_id;

-- VIEW 2: subject-wise performance report
CREATE OR REPLACE VIEW vw_subject_performance AS
SELECT  sb.subject_id, sb.subject_code, sb.subject_name, sb.semester,
        COUNT(r.result_id)                              AS attempts,
        ROUND(AVG(r.percentage),2)                      AS avg_percentage,
        MAX(r.percentage)                               AS highest,
        MIN(r.percentage)                               AS lowest,
        ROUND(100*SUM(r.result_status='PASS')/NULLIF(COUNT(r.result_id),0),2) AS pass_rate
FROM subjects sb
LEFT JOIN exams e   ON e.subject_id = sb.subject_id
LEFT JOIN results r ON r.exam_id = e.exam_id
GROUP BY sb.subject_id, sb.subject_code, sb.subject_name, sb.semester;

-- VIEW 3: semester-wise student report card (average across all exams)
CREATE OR REPLACE VIEW vw_semester_report AS
SELECT  s.student_id, s.roll_no, s.full_name, sb.semester,
        COUNT(r.result_id) AS exams_taken,
        ROUND(AVG(r.percentage),2) AS avg_percentage,
        DENSE_RANK() OVER (PARTITION BY sb.semester ORDER BY AVG(r.percentage) DESC) AS semester_rank
FROM results r
JOIN students s  ON s.student_id = r.student_id
JOIN exams e     ON e.exam_id = r.exam_id
JOIN subjects sb ON sb.subject_id = e.subject_id
GROUP BY s.student_id, s.roll_no, s.full_name, sb.semester;

-- VIEW 4: question difficulty analysis (how many students got it right)
CREATE OR REPLACE VIEW vw_question_analysis AS
SELECT  q.question_id, q.subject_id, q.question_text, q.difficulty,
        COUNT(rs.response_id) AS times_answered,
        SUM(rs.is_correct)    AS times_correct,
        ROUND(100*SUM(rs.is_correct)/NULLIF(COUNT(rs.response_id),0),1) AS success_pct
FROM questions q
LEFT JOIN responses rs ON rs.question_id = q.question_id
GROUP BY q.question_id, q.subject_id, q.question_text, q.difficulty;
