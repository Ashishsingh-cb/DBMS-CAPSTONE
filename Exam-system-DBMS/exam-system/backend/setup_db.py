"""Creates the database, tables, triggers, views and demo data.
Usage:  python setup_db.py
Reads DB_HOST / DB_USER / DB_PASSWORD from .env (or environment)."""
import os, re, pymysql
from dotenv import load_dotenv
load_dotenv()
DB_DIR = os.path.join(os.path.dirname(__file__), "..", "database")
conn = pymysql.connect(host=os.getenv("DB_HOST", "localhost"), user=os.getenv("DB_USER", "root"),
                       password=os.getenv("DB_PASSWORD", ""), autocommit=True)
cur = conn.cursor()

def run(filename, delimiter=";"):
    text = open(os.path.join(DB_DIR, filename), encoding="utf-8").read()
    text = re.sub(r"--.*$", "", text, flags=re.M)          # drop comments (full-line and inline)
    if delimiter == "$$":
        parts = re.split(r"^\$\$\s*$", text, flags=re.M)
    else:
        parts = re.split(r";[ \t]*\n", text)
    for stmt in parts:
        stmt = stmt.strip().rstrip(";")
        if stmt:
            cur.execute(stmt)
    print("ok ", filename)

run("01_schema.sql")
run("02_routines.sql", "$$")
run("03_views.sql")
run("04_seed.sql")
print("\nDatabase ready. Demo logins (password: password123):")
print("  teacher: prof.kapoor@college.edu | student: aarav.sharma@college.edu")
