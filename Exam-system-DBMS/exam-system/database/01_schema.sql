-- =====================================================================
-- ONLINE EXAMINATION & ASSESSMENT MANAGEMENT SYSTEM  |  DDL
-- Works on MySQL 8.0.31+ (INTERSECT / EXCEPT need 8.0.31+) and MariaDB 10.5+
-- =====================================================================
DROP DATABASE IF EXISTS exam_system;
CREATE DATABASE exam_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE exam_system;

CREATE TABLE departments (
    dept_id     INT AUTO_INCREMENT PRIMARY KEY,
    dept_name   VARCHAR(80) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- One login table for everyone (role decides which portal they can enter)
CREATE TABLE users (
    user_id        INT AUTO_INCREMENT PRIMARY KEY,
    email          VARCHAR(120) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    role           ENUM('student','teacher') NOT NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE students (
    student_id  INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL UNIQUE,
    roll_no     VARCHAR(20) NOT NULL UNIQUE,
    full_name   VARCHAR(100) NOT NULL,
    dept_id     INT NOT NULL,
    semester    TINYINT NOT NULL,
    phone       VARCHAR(15),
    CONSTRAINT chk_student_sem CHECK (semester BETWEEN 1 AND 8),
    CONSTRAINT fk_student_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_student_dept FOREIGN KEY (dept_id) REFERENCES departments(dept_id)
) ENGINE=InnoDB;

CREATE TABLE teachers (
    teacher_id  INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL UNIQUE,
    full_name   VARCHAR(100) NOT NULL,
    dept_id     INT NOT NULL,
    designation VARCHAR(60) DEFAULT 'Assistant Professor',
    CONSTRAINT fk_teacher_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_teacher_dept FOREIGN KEY (dept_id) REFERENCES departments(dept_id)
) ENGINE=InnoDB;

CREATE TABLE subjects (
    subject_id    INT AUTO_INCREMENT PRIMARY KEY,
    subject_code  VARCHAR(12) NOT NULL UNIQUE,
    subject_name  VARCHAR(100) NOT NULL,
    semester      TINYINT NOT NULL,
    dept_id       INT NOT NULL,
    teacher_id    INT NOT NULL,                 -- teacher who owns the subject
    CONSTRAINT chk_subject_sem CHECK (semester BETWEEN 1 AND 8),
    CONSTRAINT fk_subject_dept FOREIGN KEY (dept_id) REFERENCES departments(dept_id),
    CONSTRAINT fk_subject_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id)
) ENGINE=InnoDB;

CREATE TABLE questions (
    question_id     INT AUTO_INCREMENT PRIMARY KEY,
    subject_id      INT NOT NULL,
    created_by      INT NOT NULL,
    question_text   TEXT NOT NULL,
    option_a        VARCHAR(255) NOT NULL,
    option_b        VARCHAR(255) NOT NULL,
    option_c        VARCHAR(255) NOT NULL,
    option_d        VARCHAR(255) NOT NULL,
    correct_option  CHAR(1) NOT NULL,
    marks           TINYINT NOT NULL DEFAULT 1,
    difficulty      ENUM('easy','medium','hard') NOT NULL DEFAULT 'medium',
    CONSTRAINT chk_correct_opt CHECK (correct_option IN ('A','B','C','D')),
    CONSTRAINT chk_q_marks CHECK (marks > 0),
    CONSTRAINT fk_q_subject FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE,
    CONSTRAINT fk_q_teacher FOREIGN KEY (created_by) REFERENCES teachers(teacher_id)
) ENGINE=InnoDB;

CREATE TABLE exams (
    exam_id        INT AUTO_INCREMENT PRIMARY KEY,
    subject_id     INT NOT NULL,
    created_by     INT NOT NULL,
    title          VARCHAR(150) NOT NULL,
    exam_type      ENUM('quiz','midterm','final') NOT NULL DEFAULT 'quiz',
    start_time     DATETIME NOT NULL,
    end_time       DATETIME NOT NULL,
    duration_min   SMALLINT NOT NULL,
    total_marks    INT NOT NULL DEFAULT 0,       -- maintained by trigger
    pass_marks     INT NOT NULL,
    status         ENUM('draft','published','closed') NOT NULL DEFAULT 'draft',
    CONSTRAINT chk_exam_window CHECK (end_time > start_time),
    CONSTRAINT chk_exam_duration CHECK (duration_min > 0),
    CONSTRAINT fk_exam_subject FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE,
    CONSTRAINT fk_exam_teacher FOREIGN KEY (created_by) REFERENCES teachers(teacher_id)
) ENGINE=InnoDB;

-- M:N between exams and questions
CREATE TABLE exam_questions (
    exam_id      INT NOT NULL,
    question_id  INT NOT NULL,
    PRIMARY KEY (exam_id, question_id),
    CONSTRAINT fk_eq_exam FOREIGN KEY (exam_id) REFERENCES exams(exam_id) ON DELETE CASCADE,
    CONSTRAINT fk_eq_question FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE attempts (
    attempt_id    INT AUTO_INCREMENT PRIMARY KEY,
    exam_id       INT NOT NULL,
    student_id    INT NOT NULL,
    started_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submitted_at  DATETIME NULL,
    status        ENUM('in_progress','submitted') NOT NULL DEFAULT 'in_progress',
    UNIQUE KEY uq_one_attempt (exam_id, student_id),      -- one attempt per student per exam
    CONSTRAINT fk_att_exam FOREIGN KEY (exam_id) REFERENCES exams(exam_id) ON DELETE CASCADE,
    CONSTRAINT fk_att_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE responses (
    response_id     INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id      INT NOT NULL,
    question_id     INT NOT NULL,
    selected_option CHAR(1) NULL,
    is_correct      BOOLEAN NOT NULL DEFAULT FALSE,      -- filled by trigger
    marks_awarded   INT NOT NULL DEFAULT 0,              -- filled by trigger
    UNIQUE KEY uq_answer_once (attempt_id, question_id),
    CONSTRAINT chk_sel_opt CHECK (selected_option IS NULL OR selected_option IN ('A','B','C','D')),
    CONSTRAINT fk_resp_attempt FOREIGN KEY (attempt_id) REFERENCES attempts(attempt_id) ON DELETE CASCADE,
    CONSTRAINT fk_resp_question FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE results (
    result_id       INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id      INT NOT NULL UNIQUE,
    exam_id         INT NOT NULL,
    student_id      INT NOT NULL,
    marks_obtained  INT NOT NULL,
    percentage      DECIMAL(5,2) NOT NULL,
    grade           CHAR(2) NOT NULL,
    result_status   ENUM('PASS','FAIL') NOT NULL,
    processed_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_res_attempt FOREIGN KEY (attempt_id) REFERENCES attempts(attempt_id) ON DELETE CASCADE,
    CONSTRAINT fk_res_exam FOREIGN KEY (exam_id) REFERENCES exams(exam_id) ON DELETE CASCADE,
    CONSTRAINT fk_res_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------- INDEXES --------------------------------
CREATE INDEX idx_students_sem_dept   ON students(semester, dept_id);
CREATE INDEX idx_subjects_sem        ON subjects(semester);
CREATE INDEX idx_questions_subject   ON questions(subject_id, difficulty);
CREATE INDEX idx_exams_subject_stat  ON exams(subject_id, status);
CREATE INDEX idx_results_exam_marks  ON results(exam_id, marks_obtained DESC);   -- speeds up ranking
CREATE INDEX idx_results_student     ON results(student_id);
CREATE INDEX idx_responses_question  ON responses(question_id);
