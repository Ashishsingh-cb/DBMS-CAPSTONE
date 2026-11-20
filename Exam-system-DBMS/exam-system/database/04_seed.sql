USE exam_system;
-- All demo accounts use the password: password123

INSERT INTO departments (dept_name) VALUES ('Computer Science'),('Electronics');

INSERT INTO users (email,password_hash,role) VALUES
('prof.kapoor@college.edu','pbkdf2:sha256:1000000$SyEsda0jBrRhMOEO$e2c9e1c0c21096786ff4734150a8f8ef5c07d2f75a6c5928d85e4a01b9df679e','teacher'),
('prof.rao@college.edu','pbkdf2:sha256:1000000$SyEsda0jBrRhMOEO$e2c9e1c0c21096786ff4734150a8f8ef5c07d2f75a6c5928d85e4a01b9df679e','teacher'),
('aarav.sharma@college.edu','pbkdf2:sha256:1000000$SyEsda0jBrRhMOEO$e2c9e1c0c21096786ff4734150a8f8ef5c07d2f75a6c5928d85e4a01b9df679e','student'),
('diya.verma@college.edu','pbkdf2:sha256:1000000$SyEsda0jBrRhMOEO$e2c9e1c0c21096786ff4734150a8f8ef5c07d2f75a6c5928d85e4a01b9df679e','student'),
('rohan.mehta@college.edu','pbkdf2:sha256:1000000$SyEsda0jBrRhMOEO$e2c9e1c0c21096786ff4734150a8f8ef5c07d2f75a6c5928d85e4a01b9df679e','student'),
('ananya.singh@college.edu','pbkdf2:sha256:1000000$SyEsda0jBrRhMOEO$e2c9e1c0c21096786ff4734150a8f8ef5c07d2f75a6c5928d85e4a01b9df679e','student'),
('kabir.malik@college.edu','pbkdf2:sha256:1000000$SyEsda0jBrRhMOEO$e2c9e1c0c21096786ff4734150a8f8ef5c07d2f75a6c5928d85e4a01b9df679e','student'),
('isha.gupta@college.edu','pbkdf2:sha256:1000000$SyEsda0jBrRhMOEO$e2c9e1c0c21096786ff4734150a8f8ef5c07d2f75a6c5928d85e4a01b9df679e','student'),
('vihaan.yadav@college.edu','pbkdf2:sha256:1000000$SyEsda0jBrRhMOEO$e2c9e1c0c21096786ff4734150a8f8ef5c07d2f75a6c5928d85e4a01b9df679e','student'),
('meera.nair@college.edu','pbkdf2:sha256:1000000$SyEsda0jBrRhMOEO$e2c9e1c0c21096786ff4734150a8f8ef5c07d2f75a6c5928d85e4a01b9df679e','student');

INSERT INTO teachers (user_id,full_name,dept_id,designation) VALUES (1,'Prof. Anita Kapoor',1,'Professor'),(2,'Prof. Suresh Rao',1,'Associate Professor');

INSERT INTO students (user_id,roll_no,full_name,dept_id,semester,phone) VALUES
(3,'CSE2301','Aarav Sharma',1,4,'9800000000'),
(4,'CSE2302','Diya Verma',1,4,'9800000001'),
(5,'CSE2303','Rohan Mehta',1,4,'9800000002'),
(6,'CSE2304','Ananya Singh',1,4,'9800000003'),
(7,'CSE2305','Kabir Malik',1,4,'9800000004'),
(8,'CSE2306','Isha Gupta',1,4,'9800000005'),
(9,'CSE2307','Vihaan Yadav',1,4,'9800000006'),
(10,'CSE2308','Meera Nair',1,4,'9800000007');

INSERT INTO subjects (subject_code,subject_name,semester,dept_id,teacher_id) VALUES
('CS401','Database Management Systems',4,1,1),
('CS402','Data Structures',4,1,2),
('CS403','Operating Systems',4,1,1),
('CS404','Computer Networks',4,1,2);

INSERT INTO questions (subject_id,created_by,question_text,option_a,option_b,option_c,option_d,correct_option,marks,difficulty) VALUES
(1,1,'Which key uniquely identifies each row in a table?','Foreign key','Primary key','Super key only','Alternate key','B',1,'easy'),
(1,1,'Which normal form removes transitive dependencies?','1NF','2NF','3NF','None','C',1,'medium'),
(1,1,'Which SQL command is part of TCL?','GRANT','ALTER','COMMIT','TRUNCATE','C',1,'easy'),
(1,1,'A relation is in BCNF if every determinant is a...','Candidate key','Foreign key','Prime attribute','Composite key','A',2,'hard'),
(1,1,'Which join returns unmatched rows from the left table too?','INNER JOIN','LEFT JOIN','CROSS JOIN','SELF JOIN','B',1,'easy'),
(1,1,'Which window function gives the same rank to ties and leaves gaps?','ROW_NUMBER','DENSE_RANK','RANK','NTILE','C',1,'medium'),
(2,2,'Which data structure uses LIFO order?','Queue','Stack','Heap','Graph','B',1,'easy'),
(2,2,'Worst-case time of binary search is...','O(n)','O(log n)','O(n log n)','O(1)','B',1,'easy'),
(2,2,'Which traversal of a BST gives sorted order?','Preorder','Postorder','Inorder','Level order','C',1,'medium'),
(2,2,'Which structure is best for a priority queue?','Heap','Stack','Array','Linked list','A',1,'medium'),
(2,2,'Average time to insert in a hash table is...','O(n)','O(log n)','O(1)','O(n^2)','C',1,'medium'),
(2,2,'Which algorithm finds shortest paths with non-negative weights?','DFS','Dijkstra','Kruskal','Prim','B',2,'hard'),
(3,1,'Which scheduling algorithm can cause starvation?','Round Robin','FCFS','Priority scheduling','None','C',1,'medium'),
(3,1,'A deadlock needs which of these conditions?','Mutual exclusion','Preemption','Spooling','Paging','A',1,'medium'),
(3,1,'Which memory technique avoids external fragmentation?','Contiguous allocation','Paging','Swapping','Overlay','B',1,'medium'),
(3,1,'Which is NOT a process state?','Ready','Running','Compiling','Waiting','C',1,'easy'),
(3,1,'Thrashing happens when the system spends most time on...','Computation','Paging','I/O devices','Scheduling','B',2,'hard'),
(3,1,'A semaphore is mainly used for...','Synchronisation','Compilation','Encryption','Routing','A',1,'easy'),
(4,2,'Which layer of the OSI model handles routing?','Data link','Network','Transport','Session','B',1,'easy'),
(4,2,'Which protocol is connection-oriented?','UDP','IP','TCP','ICMP','C',1,'easy'),
(4,2,'Default port of HTTPS is...','80','21','443','25','C',1,'easy'),
(4,2,'Which device works at the network layer?','Hub','Router','Repeater','Switch','B',1,'medium'),
(4,2,'DNS is used to...','Encrypt traffic','Resolve names to IPs','Assign MAC addresses','Route packets','B',1,'easy'),
(4,2,'Subnet mask of /24 is...','255.255.0.0','255.255.255.0','255.255.255.128','255.0.0.0','B',1,'medium');

INSERT INTO exams (subject_id,created_by,title,exam_type,start_time,end_time,duration_min,pass_marks,status) VALUES
(1,1,'DBMS Unit Test 1','quiz',      NOW() - INTERVAL 30 DAY, NOW() - INTERVAL 29 DAY, 20, 4,'closed'),
(2,2,'Data Structures Quiz','quiz',  NOW() - INTERVAL 20 DAY, NOW() - INTERVAL 19 DAY, 15, 4,'closed'),
(3,1,'OS Midterm','midterm',         NOW() - INTERVAL 10 DAY, NOW() - INTERVAL  9 DAY, 30, 4,'closed'),
(4,2,'Networks Quiz 1','quiz',       NOW() - INTERVAL  1 DAY, NOW() + INTERVAL 60 DAY, 15, 4,'published'),
(1,1,'DBMS Mid-Semester Exam','midterm', NOW() - INTERVAL 1 DAY, NOW() + INTERVAL 60 DAY, 25, 5,'published');

INSERT INTO exam_questions (exam_id,question_id) VALUES (1,1),(1,2),(1,3),(1,4),(1,5),(1,6),(2,7),(2,8),(2,9),(2,10),(2,11),(2,12),(3,13),(3,14),(3,15),(3,16),(3,17),(3,18),(4,19),(4,20),(4,21),(4,22),(4,23),(4,24),(5,1),(5,2),(5,3),(5,4),(5,5),(5,6);

INSERT INTO attempts (exam_id,student_id,started_at,submitted_at,status) VALUES
(1,1,NOW() - INTERVAL 32 DAY,NOW() - INTERVAL 32 DAY,'in_progress'),
(1,2,NOW() - INTERVAL 32 DAY,NOW() - INTERVAL 32 DAY,'in_progress'),
(1,3,NOW() - INTERVAL 32 DAY,NOW() - INTERVAL 32 DAY,'in_progress'),
(1,4,NOW() - INTERVAL 32 DAY,NOW() - INTERVAL 32 DAY,'in_progress'),
(1,5,NOW() - INTERVAL 32 DAY,NOW() - INTERVAL 32 DAY,'in_progress'),
(1,6,NOW() - INTERVAL 32 DAY,NOW() - INTERVAL 32 DAY,'in_progress'),
(1,7,NOW() - INTERVAL 32 DAY,NOW() - INTERVAL 32 DAY,'in_progress'),
(1,8,NOW() - INTERVAL 32 DAY,NOW() - INTERVAL 32 DAY,'in_progress'),
(2,1,NOW() - INTERVAL 24 DAY,NOW() - INTERVAL 24 DAY,'in_progress'),
(2,2,NOW() - INTERVAL 24 DAY,NOW() - INTERVAL 24 DAY,'in_progress'),
(2,3,NOW() - INTERVAL 24 DAY,NOW() - INTERVAL 24 DAY,'in_progress'),
(2,4,NOW() - INTERVAL 24 DAY,NOW() - INTERVAL 24 DAY,'in_progress'),
(2,5,NOW() - INTERVAL 24 DAY,NOW() - INTERVAL 24 DAY,'in_progress'),
(2,6,NOW() - INTERVAL 24 DAY,NOW() - INTERVAL 24 DAY,'in_progress'),
(2,7,NOW() - INTERVAL 24 DAY,NOW() - INTERVAL 24 DAY,'in_progress'),
(3,1,NOW() - INTERVAL 16 DAY,NOW() - INTERVAL 16 DAY,'in_progress'),
(3,2,NOW() - INTERVAL 16 DAY,NOW() - INTERVAL 16 DAY,'in_progress'),
(3,3,NOW() - INTERVAL 16 DAY,NOW() - INTERVAL 16 DAY,'in_progress'),
(3,4,NOW() - INTERVAL 16 DAY,NOW() - INTERVAL 16 DAY,'in_progress'),
(3,5,NOW() - INTERVAL 16 DAY,NOW() - INTERVAL 16 DAY,'in_progress'),
(3,6,NOW() - INTERVAL 16 DAY,NOW() - INTERVAL 16 DAY,'in_progress'),
(3,8,NOW() - INTERVAL 16 DAY,NOW() - INTERVAL 16 DAY,'in_progress'),
(4,1,NOW() - INTERVAL 5 HOUR,NULL,'in_progress'),
(4,2,NOW() - INTERVAL 5 HOUR,NULL,'in_progress'),
(4,3,NOW() - INTERVAL 5 HOUR,NULL,'in_progress');

-- Generate answers: each student answers deterministically; some wrong, some blank
INSERT INTO responses (attempt_id,question_id,selected_option)
SELECT a.attempt_id, q.question_id,
       CASE WHEN MOD(a.student_id*3 + q.question_id*5 + a.exam_id, 7) < 2 + MOD(a.student_id*2 + a.exam_id, 5) THEN q.correct_option
            WHEN MOD(a.student_id + q.question_id, 9) = 0 THEN NULL
            ELSE CASE q.correct_option WHEN 'A' THEN 'B' ELSE 'A' END END
FROM attempts a
JOIN exam_questions eq ON eq.exam_id = a.exam_id
JOIN questions q ON q.question_id = eq.question_id
WHERE a.exam_id IN (1,2,3);

-- Automated result processing for every finished attempt
CALL sp_process_result(1);
CALL sp_process_result(2);
CALL sp_process_result(3);
CALL sp_process_result(4);
CALL sp_process_result(5);
CALL sp_process_result(6);
CALL sp_process_result(7);
CALL sp_process_result(8);
CALL sp_process_result(9);
CALL sp_process_result(10);
CALL sp_process_result(11);
CALL sp_process_result(12);
CALL sp_process_result(13);
CALL sp_process_result(14);
CALL sp_process_result(15);
CALL sp_process_result(16);
CALL sp_process_result(17);
CALL sp_process_result(18);
CALL sp_process_result(19);
CALL sp_process_result(20);
CALL sp_process_result(21);
CALL sp_process_result(22);
