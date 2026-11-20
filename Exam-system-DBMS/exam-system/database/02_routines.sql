-- =====================================================================
-- TRIGGERS + STORED PROCEDURE (automated result processing)
-- Statements are separated by a line containing only $$
-- =====================================================================
USE exam_system;
$$
-- Auto-evaluate every answer the moment it is inserted
CREATE TRIGGER trg_grade_response BEFORE INSERT ON responses
FOR EACH ROW
BEGIN
    DECLARE v_correct CHAR(1);
    DECLARE v_marks INT;
    SELECT correct_option, marks INTO v_correct, v_marks
      FROM questions WHERE question_id = NEW.question_id;
    IF NEW.selected_option IS NOT NULL AND NEW.selected_option = v_correct THEN
        SET NEW.is_correct = TRUE;
        SET NEW.marks_awarded = v_marks;
    ELSE
        SET NEW.is_correct = FALSE;
        SET NEW.marks_awarded = 0;
    END IF;
END
$$
-- Keep exams.total_marks in sync with the paper
CREATE TRIGGER trg_exam_total_ins AFTER INSERT ON exam_questions
FOR EACH ROW
BEGIN
    UPDATE exams SET total_marks = (
        SELECT COALESCE(SUM(q.marks),0) FROM exam_questions eq
        JOIN questions q ON q.question_id = eq.question_id
        WHERE eq.exam_id = NEW.exam_id)
    WHERE exam_id = NEW.exam_id;
END
$$
CREATE TRIGGER trg_exam_total_del AFTER DELETE ON exam_questions
FOR EACH ROW
BEGIN
    UPDATE exams SET total_marks = (
        SELECT COALESCE(SUM(q.marks),0) FROM exam_questions eq
        JOIN questions q ON q.question_id = eq.question_id
        WHERE eq.exam_id = OLD.exam_id)
    WHERE exam_id = OLD.exam_id;
END
$$
-- Grade scale helper
CREATE FUNCTION fn_grade(p_pct DECIMAL(5,2)) RETURNS CHAR(2) DETERMINISTIC
BEGIN
    RETURN CASE
        WHEN p_pct >= 90 THEN 'A+'
        WHEN p_pct >= 80 THEN 'A'
        WHEN p_pct >= 70 THEN 'B+'
        WHEN p_pct >= 60 THEN 'B'
        WHEN p_pct >= 50 THEN 'C'
        WHEN p_pct >= 40 THEN 'D'
        ELSE 'F' END;
END
$$
-- Submit: saves answers already inserted, closes the attempt, computes result. (TCL used)
CREATE PROCEDURE sp_process_result(IN p_attempt_id INT)
BEGIN
    DECLARE v_exam INT; DECLARE v_student INT;
    DECLARE v_obt INT; DECLARE v_total INT; DECLARE v_pass INT;
    DECLARE v_pct DECIMAL(5,2);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

    START TRANSACTION;
    SELECT exam_id, student_id INTO v_exam, v_student FROM attempts WHERE attempt_id = p_attempt_id FOR UPDATE;
    SELECT COALESCE(SUM(marks_awarded),0) INTO v_obt FROM responses WHERE attempt_id = p_attempt_id;
    SELECT total_marks, pass_marks INTO v_total, v_pass FROM exams WHERE exam_id = v_exam;
    SET v_pct = IF(v_total = 0, 0, ROUND(v_obt * 100 / v_total, 2));

    UPDATE attempts SET status = 'submitted', submitted_at = NOW() WHERE attempt_id = p_attempt_id;
    INSERT INTO results (attempt_id, exam_id, student_id, marks_obtained, percentage, grade, result_status)
    VALUES (p_attempt_id, v_exam, v_student, v_obt, v_pct, fn_grade(v_pct),
            IF(v_obt >= v_pass, 'PASS', 'FAIL'));
    COMMIT;
END
$$
