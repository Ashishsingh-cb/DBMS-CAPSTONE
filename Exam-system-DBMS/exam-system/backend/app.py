"""Flask API for the Online Examination & Assessment Management System."""
import os, datetime, decimal, functools
import jwt, pymysql
from dotenv import load_dotenv
from flask import Flask, g, jsonify, request
from flask.json.provider import DefaultJSONProvider
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash

load_dotenv()
SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")


class Provider(DefaultJSONProvider):
    @staticmethod
    def default(o):
        if isinstance(o, (datetime.datetime, datetime.date)):
            return o.strftime("%Y-%m-%dT%H:%M:%S")
        if isinstance(o, decimal.Decimal):
            return float(o)
        return DefaultJSONProvider.default(o)


app = Flask(__name__)
app.json = Provider(app)
CORS(app)


# ------------------------------------------------------------------ db helpers
def db():
    if "db" not in g:
        g.db = pymysql.connect(
            host=os.getenv("DB_HOST", "localhost"), user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", ""), database=os.getenv("DB_NAME", "exam_system"),
            cursorclass=pymysql.cursors.DictCursor, autocommit=False)
    return g.db


@app.teardown_appcontext
def close_db(_):
    conn = g.pop("db", None)
    if conn:
        conn.close()


def q(sql, args=(), one=False):
    with db().cursor() as cur:
        cur.execute(sql, args)
        rows = cur.fetchall()
    return (rows[0] if rows else None) if one else rows


def run(sql, args=()):
    with db().cursor() as cur:
        cur.execute(sql, args)
        return cur.lastrowid


@app.errorhandler(pymysql.err.IntegrityError)
def integrity(e):
    db().rollback()
    return jsonify(error="That record conflicts with existing data (duplicate or invalid reference)."), 409


@app.errorhandler(Exception)
def generic(e):
    from werkzeug.exceptions import HTTPException
    if isinstance(e, HTTPException):
        return e
    db().rollback() if "db" in g else None
    app.logger.exception(e)
    return jsonify(error="Something went wrong on the server."), 500


# ------------------------------------------------------------------ auth
def auth(role):
    def deco(fn):
        @functools.wraps(fn)
        def wrapper(*a, **kw):
            header = request.headers.get("Authorization", "")
            try:
                data = jwt.decode(header.replace("Bearer ", ""), SECRET, algorithms=["HS256"])
            except jwt.PyJWTError:
                return jsonify(error="Please sign in again."), 401
            if data["role"] != role:
                return jsonify(error="This page is for " + role + "s only."), 403
            g.user = data
            return fn(*a, **kw)
        return wrapper
    return deco


@app.post("/api/auth/login")
def login():
    d = request.json or {}
    user = q("SELECT * FROM users WHERE email=%s AND role=%s", (d.get("email", "").strip().lower(), d.get("role")), one=True)
    if not user or not check_password_hash(user["password_hash"], d.get("password", "")):
        return jsonify(error="Email or password is incorrect for this portal."), 401
    if user["role"] == "student":
        prof = q("SELECT student_id AS pid, full_name, roll_no, semester FROM students WHERE user_id=%s", (user["user_id"],), one=True)
    else:
        prof = q("SELECT teacher_id AS pid, full_name, designation FROM teachers WHERE user_id=%s", (user["user_id"],), one=True)
    token = jwt.encode({"uid": user["user_id"], "role": user["role"], "pid": prof["pid"],
                        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=12)}, SECRET, algorithm="HS256")
    return jsonify(token=token, role=user["role"], profile=prof)


@app.get("/api/departments")
def departments():
    return jsonify(q("SELECT * FROM departments ORDER BY dept_name"))


@app.post("/api/auth/register")
def register():
    d = request.json or {}
    need = ["full_name", "email", "password", "roll_no", "semester", "dept_id"]
    if any(not str(d.get(k, "")).strip() for k in need):
        return jsonify(error="Please fill in every field."), 400
    if len(d["password"]) < 6:
        return jsonify(error="Password must be at least 6 characters."), 400
    uid = run("INSERT INTO users (email,password_hash,role) VALUES (%s,%s,'student')",
              (d["email"].strip().lower(), generate_password_hash(d["password"], method="pbkdf2:sha256")))
    run("INSERT INTO students (user_id,roll_no,full_name,dept_id,semester) VALUES (%s,%s,%s,%s,%s)",
        (uid, d["roll_no"].strip().upper(), d["full_name"].strip(), d["dept_id"], d["semester"]))
    db().commit()
    return jsonify(ok=True), 201


# ------------------------------------------------------------------ STUDENT
def exam_state(e):
    now = datetime.datetime.now()
    if e["status"] == "closed" or now > e["end_time"]:
        return "ended"
    return "upcoming" if now < e["start_time"] else "live"


@app.get("/api/student/dashboard")
@auth("student")
def s_dashboard():
    sid = g.user["pid"]
    stats = q("""SELECT COUNT(*) AS exams_taken, ROUND(AVG(percentage),1) AS avg_pct,
                        COALESCE(SUM(result_status='PASS'),0) AS passed, MAX(percentage) AS best
                 FROM results WHERE student_id=%s""", (sid,), one=True)
    sem = q("SELECT semester_rank, avg_percentage FROM vw_semester_report WHERE student_id=%s ORDER BY semester DESC LIMIT 1", (sid,), one=True)
    live = q("""SELECT COUNT(*) AS n FROM exams e JOIN subjects sb ON sb.subject_id=e.subject_id
                JOIN students s ON s.student_id=%s AND s.semester=sb.semester AND s.dept_id=sb.dept_id
                WHERE e.status='published' AND NOW() BETWEEN e.start_time AND e.end_time
                  AND NOT EXISTS (SELECT 1 FROM attempts a WHERE a.exam_id=e.exam_id AND a.student_id=%s AND a.status='submitted')""",
             (sid, sid), one=True)["n"]
    subject_avg = q("""SELECT subject_code, subject_name, ROUND(AVG(percentage),1) AS avg_pct
                       FROM vw_student_results WHERE student_id=%s GROUP BY subject_id, subject_code, subject_name""", (sid,))
    trend = q("""SELECT exam_title, percentage, exam_rank FROM vw_student_results v JOIN exams e ON e.exam_id=v.exam_id
                 WHERE student_id=%s ORDER BY e.start_time""", (sid,))
    return jsonify(stats=stats, semester=sem, live_exams=live, subject_avg=subject_avg, trend=trend)


@app.get("/api/student/exams")
@auth("student")
def s_exams():
    sid = g.user["pid"]
    rows = q("""SELECT e.exam_id, e.title, e.exam_type, e.start_time, e.end_time, e.duration_min, e.total_marks, e.pass_marks, e.status,
                       sb.subject_name, sb.subject_code, a.attempt_id, a.status AS attempt_status,
                       r.marks_obtained, r.grade, r.result_status,
                       (SELECT COUNT(*) FROM exam_questions eq WHERE eq.exam_id=e.exam_id) AS question_count
                FROM exams e
                JOIN subjects sb ON sb.subject_id=e.subject_id
                JOIN students s  ON s.student_id=%s AND s.semester=sb.semester AND s.dept_id=sb.dept_id
                LEFT JOIN attempts a ON a.exam_id=e.exam_id AND a.student_id=s.student_id
                LEFT JOIN results r  ON r.attempt_id=a.attempt_id
                WHERE e.status IN ('published','closed')
                ORDER BY e.start_time DESC""", (sid,))
    for r in rows:
        r["state"] = exam_state(r)
    return jsonify(rows)


@app.post("/api/student/exams/<int:exam_id>/start")
@auth("student")
def s_start(exam_id):
    sid = g.user["pid"]
    e = q("SELECT * FROM exams WHERE exam_id=%s AND status='published'", (exam_id,), one=True)
    if not e:
        return jsonify(error="This exam is not available."), 404
    att = q("SELECT * FROM attempts WHERE exam_id=%s AND student_id=%s", (exam_id, sid), one=True)
    if att and att["status"] == "submitted":
        return jsonify(error="You have already submitted this exam."), 409
    now = datetime.datetime.now()
    if not att:
        if not (e["start_time"] <= now <= e["end_time"]):
            return jsonify(error="This exam is not open right now."), 403
        aid = run("INSERT INTO attempts (exam_id, student_id) VALUES (%s,%s)", (exam_id, sid))
        db().commit()
        att = q("SELECT * FROM attempts WHERE attempt_id=%s", (aid,), one=True)
    elapsed = (datetime.datetime.now() - att["started_at"]).total_seconds()
    remaining = max(0, int(e["duration_min"] * 60 - elapsed))
    questions = q("""SELECT q.question_id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.marks
                     FROM exam_questions eq JOIN questions q ON q.question_id=eq.question_id
                     WHERE eq.exam_id=%s ORDER BY q.question_id""", (exam_id,))
    return jsonify(attempt_id=att["attempt_id"], title=e["title"], total_marks=e["total_marks"],
                   remaining_seconds=remaining, questions=questions)


@app.post("/api/student/attempts/<int:attempt_id>/submit")
@auth("student")
def s_submit(attempt_id):
    sid = g.user["pid"]
    att = q("SELECT * FROM attempts WHERE attempt_id=%s AND student_id=%s", (attempt_id, sid), one=True)
    if not att:
        return jsonify(error="Attempt not found."), 404
    if att["status"] == "submitted":
        return jsonify(error="Already submitted."), 409
    answers = (request.json or {}).get("answers", {})
    qids = [r["question_id"] for r in q("SELECT question_id FROM exam_questions WHERE exam_id=%s", (att["exam_id"],))]
    try:
        for qid in qids:                       # trigger trg_grade_response evaluates each row
            sel = answers.get(str(qid))
            run("INSERT INTO responses (attempt_id, question_id, selected_option) VALUES (%s,%s,%s)",
                (attempt_id, qid, sel if sel in ("A", "B", "C", "D") else None))
        with db().cursor() as cur:
            cur.callproc("sp_process_result", (attempt_id,))   # TCL + result row
        db().commit()
    except Exception:
        db().rollback()
        raise
    return jsonify(ok=True, attempt_id=attempt_id)


@app.get("/api/student/results")
@auth("student")
def s_results():
    rows = q("""SELECT v.*, a.attempt_id, e.start_time,
                       (SELECT COUNT(*) FROM results r2 WHERE r2.exam_id=v.exam_id) AS participants
                FROM vw_student_results v
                JOIN results r ON r.result_id=v.result_id
                JOIN attempts a ON a.attempt_id=r.attempt_id
                JOIN exams e ON e.exam_id=v.exam_id
                WHERE v.student_id=%s ORDER BY e.start_time DESC""", (g.user["pid"],))
    return jsonify(rows)


@app.get("/api/student/results/<int:attempt_id>")
@auth("student")
def s_result_detail(attempt_id):
    sid = g.user["pid"]
    head = q("""SELECT v.*, (SELECT COUNT(*) FROM results r2 WHERE r2.exam_id=v.exam_id) AS participants
                FROM vw_student_results v JOIN results r ON r.result_id=v.result_id
                WHERE r.attempt_id=%s AND v.student_id=%s""", (attempt_id, sid), one=True)
    if not head:
        return jsonify(error="Result not found."), 404
    review = q("""SELECT q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option,
                         rs.selected_option, rs.is_correct, rs.marks_awarded, q.marks
                  FROM responses rs JOIN questions q ON q.question_id=rs.question_id
                  WHERE rs.attempt_id=%s ORDER BY q.question_id""", (attempt_id,))
    board = q("""SELECT full_name, marks_obtained, percentage, exam_rank, student_id FROM vw_student_results
                 WHERE exam_id=%s ORDER BY exam_rank, full_name LIMIT 5""", (head["exam_id"],))
    return jsonify(result=head, review=review, leaderboard=board)


# ------------------------------------------------------------------ TEACHER
def own_subject(subject_id):
    return q("SELECT 1 FROM subjects WHERE subject_id=%s AND teacher_id=%s", (subject_id, g.user["pid"]), one=True)


@app.get("/api/teacher/dashboard")
@auth("teacher")
def t_dashboard():
    tid = g.user["pid"]
    counts = q("""SELECT (SELECT COUNT(*) FROM questions WHERE created_by=%s) AS questions,
                         (SELECT COUNT(*) FROM exams WHERE created_by=%s) AS exams,
                         (SELECT COUNT(*) FROM results r JOIN exams e ON e.exam_id=r.exam_id WHERE e.created_by=%s) AS submissions,
                         (SELECT ROUND(AVG(r.percentage),1) FROM results r JOIN exams e ON e.exam_id=r.exam_id WHERE e.created_by=%s) AS avg_pct,
                         (SELECT ROUND(100*SUM(r.result_status='PASS')/COUNT(*),1) FROM results r JOIN exams e ON e.exam_id=r.exam_id WHERE e.created_by=%s) AS pass_rate""",
               (tid,) * 5, one=True)
    perf = q("""SELECT p.* FROM vw_subject_performance p JOIN subjects s ON s.subject_id=p.subject_id WHERE s.teacher_id=%s""", (tid,))
    grades = q("""SELECT r.grade, COUNT(*) AS n FROM results r JOIN exams e ON e.exam_id=r.exam_id
                  WHERE e.created_by=%s GROUP BY r.grade ORDER BY r.grade""", (tid,))
    recent = q("""SELECT e.exam_id, e.title, e.status, sb.subject_name,
                         (SELECT COUNT(*) FROM results r WHERE r.exam_id=e.exam_id) AS submissions
                  FROM exams e JOIN subjects sb ON sb.subject_id=e.subject_id
                  WHERE e.created_by=%s ORDER BY e.start_time DESC LIMIT 5""", (tid,))
    return jsonify(counts=counts, subject_performance=perf, grades=grades, recent_exams=recent)


@app.get("/api/teacher/subjects")
@auth("teacher")
def t_subjects():
    return jsonify(q("SELECT subject_id, subject_code, subject_name, semester FROM subjects WHERE teacher_id=%s", (g.user["pid"],)))


@app.get("/api/teacher/questions")
@auth("teacher")
def t_questions():
    sql = """SELECT q.*, sb.subject_name, sb.subject_code, a.times_answered, a.success_pct
             FROM questions q JOIN subjects sb ON sb.subject_id=q.subject_id
             JOIN vw_question_analysis a ON a.question_id=q.question_id
             WHERE sb.teacher_id=%s"""
    args = [g.user["pid"]]
    if request.args.get("subject_id"):
        sql += " AND q.subject_id=%s"; args.append(request.args["subject_id"])
    if request.args.get("difficulty"):
        sql += " AND q.difficulty=%s"; args.append(request.args["difficulty"])
    if request.args.get("search"):
        sql += " AND q.question_text LIKE %s"; args.append("%" + request.args["search"] + "%")
    return jsonify(q(sql + " ORDER BY q.question_id DESC", args))


def validate_question(d):
    for k in ("subject_id", "question_text", "option_a", "option_b", "option_c", "option_d", "correct_option"):
        if not str(d.get(k, "")).strip():
            return "Please fill in every field."
    if d["correct_option"] not in ("A", "B", "C", "D"):
        return "Pick the correct option."
    return None


@app.post("/api/teacher/questions")
@auth("teacher")
def t_add_question():
    d = request.json or {}
    err = validate_question(d)
    if err:
        return jsonify(error=err), 400
    if not own_subject(d["subject_id"]):
        return jsonify(error="You can only add questions to your own subjects."), 403
    qid = run("""INSERT INTO questions (subject_id,created_by,question_text,option_a,option_b,option_c,option_d,correct_option,marks,difficulty)
                 VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
              (d["subject_id"], g.user["pid"], d["question_text"], d["option_a"], d["option_b"], d["option_c"], d["option_d"],
               d["correct_option"], int(d.get("marks") or 1), d.get("difficulty", "medium")))
    db().commit()
    return jsonify(question_id=qid), 201


@app.put("/api/teacher/questions/<int:qid>")
@auth("teacher")
def t_edit_question(qid):
    d = request.json or {}
    err = validate_question(d)
    if err:
        return jsonify(error=err), 400
    if not own_subject(d["subject_id"]):
        return jsonify(error="You can only edit your own subjects."), 403
    run("""UPDATE questions SET subject_id=%s, question_text=%s, option_a=%s, option_b=%s, option_c=%s, option_d=%s,
           correct_option=%s, marks=%s, difficulty=%s WHERE question_id=%s AND created_by=%s""",
        (d["subject_id"], d["question_text"], d["option_a"], d["option_b"], d["option_c"], d["option_d"],
         d["correct_option"], int(d.get("marks") or 1), d.get("difficulty", "medium"), qid, g.user["pid"]))
    db().commit()
    return jsonify(ok=True)


@app.delete("/api/teacher/questions/<int:qid>")
@auth("teacher")
def t_del_question(qid):
    used = q("""SELECT 1 FROM exam_questions eq JOIN exams e ON e.exam_id=eq.exam_id
                WHERE eq.question_id=%s AND e.status<>'draft' LIMIT 1""", (qid,), one=True)
    if used:
        return jsonify(error="This question is part of a published exam and can't be deleted."), 409
    run("DELETE FROM questions WHERE question_id=%s AND created_by=%s", (qid, g.user["pid"]))
    db().commit()
    return jsonify(ok=True)


@app.get("/api/teacher/exams")
@auth("teacher")
def t_exams():
    rows = q("""SELECT e.*, sb.subject_name, sb.subject_code, sb.semester,
                       (SELECT COUNT(*) FROM exam_questions eq WHERE eq.exam_id=e.exam_id) AS question_count,
                       (SELECT COUNT(*) FROM results r WHERE r.exam_id=e.exam_id) AS submissions
                FROM exams e JOIN subjects sb ON sb.subject_id=e.subject_id
                WHERE e.created_by=%s ORDER BY e.start_time DESC""", (g.user["pid"],))
    return jsonify(rows)


@app.post("/api/teacher/exams")
@auth("teacher")
def t_create_exam():
    d = request.json or {}
    ids = d.get("question_ids", [])
    if not d.get("title") or not d.get("subject_id") or not d.get("start_time") or not d.get("end_time"):
        return jsonify(error="Title, subject and the exam window are required."), 400
    if not ids:
        return jsonify(error="Select at least one question."), 400
    if not own_subject(d["subject_id"]):
        return jsonify(error="You can only create exams for your own subjects."), 403
    start, end = d["start_time"].replace("T", " "), d["end_time"].replace("T", " ")
    if end <= start:
        return jsonify(error="The end time must be after the start time."), 400
    eid = run("""INSERT INTO exams (subject_id,created_by,title,exam_type,start_time,end_time,duration_min,pass_marks,status)
                 VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
              (d["subject_id"], g.user["pid"], d["title"], d.get("exam_type", "quiz"), start, end,
               int(d.get("duration_min") or 30), int(d.get("pass_marks") or 0), d.get("status", "draft")))
    for qid in ids:
        run("INSERT INTO exam_questions (exam_id, question_id) VALUES (%s,%s)", (eid, qid))
    db().commit()
    return jsonify(exam_id=eid), 201


@app.patch("/api/teacher/exams/<int:eid>/status")
@auth("teacher")
def t_exam_status(eid):
    status = (request.json or {}).get("status")
    if status not in ("draft", "published", "closed"):
        return jsonify(error="Invalid status."), 400
    run("UPDATE exams SET status=%s WHERE exam_id=%s AND created_by=%s", (status, eid, g.user["pid"]))
    db().commit()
    return jsonify(ok=True)


@app.delete("/api/teacher/exams/<int:eid>")
@auth("teacher")
def t_delete_exam(eid):
    if q("SELECT 1 FROM attempts WHERE exam_id=%s LIMIT 1", (eid,), one=True):
        return jsonify(error="Students have already attempted this exam, so it can't be deleted."), 409
    run("DELETE FROM exams WHERE exam_id=%s AND created_by=%s", (eid, g.user["pid"]))
    db().commit()
    return jsonify(ok=True)


@app.get("/api/teacher/exams/<int:eid>/results")
@auth("teacher")
def t_exam_results(eid):
    exam = q("""SELECT e.*, sb.subject_name FROM exams e JOIN subjects sb ON sb.subject_id=e.subject_id
                WHERE e.exam_id=%s AND e.created_by=%s""", (eid, g.user["pid"]), one=True)
    if not exam:
        return jsonify(error="Exam not found."), 404
    rows = q("SELECT * FROM vw_student_results WHERE exam_id=%s ORDER BY exam_rank, full_name", (eid,))
    stats = q("""SELECT COUNT(*) AS n, ROUND(AVG(percentage),1) AS avg_pct, MAX(marks_obtained) AS top, MIN(marks_obtained) AS low,
                        ROUND(100*SUM(result_status='PASS')/NULLIF(COUNT(*),0),1) AS pass_rate
                 FROM results WHERE exam_id=%s""", (eid,), one=True)
    grades = q("SELECT grade, COUNT(*) AS n FROM results WHERE exam_id=%s GROUP BY grade ORDER BY grade", (eid,))
    absent = q("""SELECT s.full_name, s.roll_no FROM students s JOIN subjects sb ON sb.semester=s.semester AND sb.dept_id=s.dept_id
                  WHERE sb.subject_id=%s AND s.student_id NOT IN (SELECT student_id FROM results WHERE exam_id=%s)""",
               (exam["subject_id"], eid))
    return jsonify(exam=exam, results=rows, stats=stats, grades=grades, not_attempted=absent)


@app.get("/api/teacher/students")
@auth("teacher")
def t_students():
    rows = q("""SELECT s.student_id, s.roll_no, s.full_name, s.semester, d.dept_name,
                       COALESCE(r.exams_taken,0) AS exams_taken, r.avg_percentage, r.semester_rank
                FROM students s JOIN departments d ON d.dept_id=s.dept_id
                LEFT JOIN vw_semester_report r ON r.student_id=s.student_id AND r.semester=s.semester
                ORDER BY s.semester, r.semester_rank, s.full_name""")
    return jsonify(rows)


@app.get("/api/teacher/analytics")
@auth("teacher")
def t_analytics():
    tid = g.user["pid"]
    subj = q("""SELECT p.* FROM vw_subject_performance p JOIN subjects s ON s.subject_id=p.subject_id WHERE s.teacher_id=%s""", (tid,))
    hard = q("""SELECT a.question_id, a.question_text, a.difficulty, a.times_answered, a.success_pct, sb.subject_code
                FROM vw_question_analysis a JOIN subjects sb ON sb.subject_id=a.subject_id
                WHERE sb.teacher_id=%s AND a.times_answered>0 ORDER BY a.success_pct ASC LIMIT 5""", (tid,))
    toppers = q("""WITH ranked AS (
                      SELECT v.*, RANK() OVER (PARTITION BY v.subject_id ORDER BY v.percentage DESC) AS rnk
                      FROM vw_student_results v JOIN subjects s ON s.subject_id=v.subject_id WHERE s.teacher_id=%s)
                   SELECT subject_name, full_name, percentage, exam_title FROM ranked WHERE rnk=1""", (tid,))
    semester = q("""SELECT semester, COUNT(*) AS students, ROUND(AVG(avg_percentage),1) AS avg_pct FROM vw_semester_report GROUP BY semester ORDER BY semester""")
    return jsonify(subjects=subj, hardest_questions=hard, toppers=toppers, semesters=semester)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
