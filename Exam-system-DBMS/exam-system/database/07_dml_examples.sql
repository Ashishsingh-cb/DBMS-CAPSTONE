-- =====================================================================
-- 07_dml_examples.sql  |  INSERT / UPDATE / DELETE / ALTER examples
-- =====================================================================
USE exam_system;
INSERT INTO departments (dept_name) VALUES ('Mechanical');
UPDATE students SET semester = 5 WHERE roll_no = 'CSE2308';
DELETE FROM departments WHERE dept_name = 'Mechanical';
ALTER TABLE students ADD COLUMN guardian_phone VARCHAR(15) NULL;
ALTER TABLE students DROP COLUMN guardian_phone;
