import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../api'
import { useFetch } from '../../hooks'
import { Empty, Loading, PageHead, Pill, useToast } from '../../components/ui'

const pad = (n) => String(n).padStart(2, '0')
const local = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`

export default function CreateExam() {
  const nav = useNavigate(); const toast = useToast()
  const { data: subjects } = useFetch('/teacher/subjects')
  const { data: bank } = useFetch('/teacher/questions')
  const now = new Date(); const week = new Date(Date.now() + 7 * 864e5)
  const [f, setF] = useState({ title: '', subject_id: '', exam_type: 'quiz', start_time: local(now), end_time: local(week), duration_min: 30, pass_marks: 1 })
  const [chosen, setChosen] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const subjectId = f.subject_id || subjects?.[0]?.subject_id || ''
  const pool = useMemo(() => (bank || []).filter((q) => String(q.subject_id) === String(subjectId)), [bank, subjectId])
  const picked = pool.filter((q) => chosen[q.question_id])
  const total = picked.reduce((s, q) => s + q.marks, 0)

  const save = async (status) => {
    setBusy(true)
    try {
      await api('/teacher/exams', { method: 'POST', body: { ...f, subject_id: subjectId, question_ids: picked.map((q) => q.question_id), status } })
      toast(status === 'published' ? 'Exam published.' : 'Draft saved.'); nav('/teacher/exams')
    } catch (x) { toast(x.message, true) } finally { setBusy(false) }
  }
  if (!subjects || !bank) return <Loading />
  return (
    <>
      <Link to="/teacher/exams" className="muted small">Back to exams</Link>
      <PageHead title="Create exam" sub="Set the schedule, then pick questions from your bank." />
      <div className="grid g-main">
        <div className="card">
          <h3>Select questions</h3><p className="muted small" style={{ marginTop: 2 }}>Showing questions for the chosen subject.</p>
          {pool.length === 0 ? <Empty title="No questions for this subject" text="Add questions in the question bank first." /> : (
            <div className="pick-list">{pool.map((q) => (
              <label key={q.question_id} className="pick" style={{ margin: 0 }}>
                <input type="checkbox" checked={!!chosen[q.question_id]} onChange={() => setChosen({ ...chosen, [q.question_id]: !chosen[q.question_id] })} />
                <div className="grow"><div style={{ color: 'var(--ink)', fontWeight: 600 }}>{q.question_text}</div><div className="row mt-s"><Pill tone={{ easy: 'green', medium: 'amber', hard: 'red' }[q.difficulty]}>{q.difficulty}</Pill><span className="muted small">{q.marks} mark{q.marks > 1 ? 's' : ''}</span></div></div></label>))}</div>)}
          <div className="row between mt"><button className="btn ghost sm" onClick={() => setChosen(Object.fromEntries(pool.map((q) => [q.question_id, true])))}>Select all</button><b>{picked.length} questions - {total} marks</b></div>
        </div>
        <div className="card" style={{ alignSelf: 'start' }}>
          <h3>Exam details</h3>
          <label>Title</label><input required value={f.title} onChange={set('title')} placeholder="e.g. DBMS Unit Test 2" />
          <label>Subject</label><select value={subjectId} onChange={(e) => { setF({ ...f, subject_id: e.target.value }); setChosen({}) }}>{subjects.map((s) => <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>)}</select>
          <div className="row"><div className="grow"><label>Type</label><select value={f.exam_type} onChange={set('exam_type')}><option value="quiz">Quiz</option><option value="midterm">Midterm</option><option value="final">Final</option></select></div>
            <div className="grow"><label>Duration (min)</label><input type="number" min="1" value={f.duration_min} onChange={set('duration_min')} /></div></div>
          <label>Opens at</label><input type="datetime-local" value={f.start_time} onChange={set('start_time')} />
          <label>Closes at</label><input type="datetime-local" value={f.end_time} onChange={set('end_time')} />
          <label>Passing marks (out of {total})</label><input type="number" min="0" max={total} value={f.pass_marks} onChange={set('pass_marks')} />
          <div className="row mt wrap"><button className="btn" disabled={busy || !f.title || !picked.length} onClick={() => save('published')}>Publish now</button><button className="btn ghost" disabled={busy || !f.title || !picked.length} onClick={() => save('draft')}>Save draft</button></div>
        </div>
      </div>
    </>
  )
}
