import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api'
import { Empty, Modal, useToast } from '../../components/ui'

const LETTERS = ['A', 'B', 'C', 'D']
const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

export default function TakeExam() {
  const { id } = useParams(); const nav = useNavigate(); const toast = useToast()
  const [exam, setExam] = useState(null)
  const [error, setError] = useState('')
  const [answers, setAnswers] = useState({})
  const [flags, setFlags] = useState({})
  const [cur, setCur] = useState(0)
  const [left, setLeft] = useState(null)
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [switches, setSwitches] = useState(0)
  const deadline = useRef(0); const sent = useRef(false); const started = useRef(false)

  useEffect(() => {
    if (started.current) return; started.current = true      // guard React StrictMode double-run
    api(`/student/exams/${id}/start`, { method: 'POST' }).then((d) => {
      setExam(d); deadline.current = Date.now() + d.remaining_seconds * 1000; setLeft(d.remaining_seconds)
      const saved = sessionStorage.getItem('ans-' + d.attempt_id)
      if (saved) setAnswers(JSON.parse(saved))
    }).catch((e) => setError(e.message))
  }, [id])

  useEffect(() => { if (exam) sessionStorage.setItem('ans-' + exam.attempt_id, JSON.stringify(answers)) }, [answers, exam])

  const submit = useCallback(async () => {
    if (sent.current || !exam) return; sent.current = true; setBusy(true)
    try {
      await api(`/student/attempts/${exam.attempt_id}/submit`, { method: 'POST', body: { answers } })
      sessionStorage.removeItem('ans-' + exam.attempt_id)
      toast('Exam submitted. Here are your results.'); nav(`/student/results/${exam.attempt_id}`, { replace: true })
    } catch (e) { sent.current = false; setBusy(false); toast(e.message, true) }
  }, [exam, answers, nav, toast])

  useEffect(() => {
    if (!exam) return
    const t = setInterval(() => {
      const s = Math.max(0, Math.round((deadline.current - Date.now()) / 1000)); setLeft(s)
      if (s === 0) { clearInterval(t); submit() }
    }, 500)
    return () => clearInterval(t)
  }, [exam, submit])

  useEffect(() => {
    const vis = () => document.hidden && setSwitches((n) => n + 1)
    const warn = (e) => { if (!sent.current) { e.preventDefault(); e.returnValue = '' } }
    document.addEventListener('visibilitychange', vis); window.addEventListener('beforeunload', warn)
    return () => { document.removeEventListener('visibilitychange', vis); window.removeEventListener('beforeunload', warn) }
  }, [])

  if (error) return <div style={{ padding: 40 }}><Empty title="You can't open this exam" text={error}><button className="btn mt-s" onClick={() => nav('/student/exams')}>Back to exams</button></Empty></div>
  if (!exam) return <div style={{ padding: 40 }}>Preparing your paper...</div>

  const qs = exam.questions; const q = qs[cur]
  const answered = Object.keys(answers).length
  const choose = (L) => setAnswers((a) => (a[q.question_id] === L ? (({ [q.question_id]: _, ...r }) => r)(a) : { ...a, [q.question_id]: L }))

  return (
    <div className="room theme-student">
      <div className="room-top">
        <b style={{ fontFamily: 'var(--display)', fontSize: 18 }}>{exam.title}</b>
        <span className="small" style={{ color: '#c9c8e6' }}>{answered} of {qs.length} answered</span>
        {switches > 0 && <span className="pill amber">Tab switched {switches}x</span>}
        <span className={'timer right' + (left < 60 ? ' low' : '')} aria-live="off">{mmss(left)}</span>
        <button className="btn yellow" onClick={() => setConfirm(true)}>Submit</button>
      </div>
      <div className="room-body">
        <section className="card">
          <div className="row between"><span className="pill">Question {cur + 1} of {qs.length}</span><span className="muted small">{q.marks} mark{q.marks > 1 ? 's' : ''}</span></div>
          <div className="q-text">{q.question_text}</div>
          {LETTERS.map((L) => (
            <button key={L} className={'omr-opt' + (answers[q.question_id] === L ? ' sel' : '')} onClick={() => choose(L)} aria-pressed={answers[q.question_id] === L}>
              <span className="bub">{L}</span>{q['option_' + L.toLowerCase()]}
            </button>
          ))}
          <div className="row between mt wrap">
            <button className="btn ghost" disabled={cur === 0} onClick={() => setCur(cur - 1)}>Previous</button>
            <button className="btn ghost" onClick={() => setFlags((f) => ({ ...f, [q.question_id]: !f[q.question_id] }))}>{flags[q.question_id] ? 'Remove flag' : 'Flag for review'}</button>
            {cur < qs.length - 1 ? <button className="btn" onClick={() => setCur(cur + 1)}>Next</button> : <button className="btn yellow" onClick={() => setConfirm(true)}>Review and submit</button>}
          </div>
        </section>
        <aside className="card" style={{ alignSelf: 'start' }}>
          <h3>Answer sheet</h3>
          <div className="palette mt-s">{qs.map((x, i) => (
            <button key={x.question_id} onClick={() => setCur(i)} aria-label={`Question ${i + 1}`}
              className={(answers[x.question_id] ? 'done ' : '') + (flags[x.question_id] ? 'flag ' : '') + (i === cur ? 'cur' : '')}>{i + 1}</button>))}</div>
          <div className="legend"><span><i style={{ background: 'var(--ink)' }} />Answered</span><span><i />Blank</span><span><i style={{ borderColor: 'var(--amber)', background: 'var(--yellow)' }} />Flagged</span></div>
        </aside>
      </div>
      {confirm && (
        <Modal title="Submit your exam?" onClose={() => setConfirm(false)}>
          <p>You answered <b>{answered}</b> of {qs.length} questions.</p>
          {answered < qs.length && <p style={{ color: 'var(--red)', fontWeight: 600 }}>{qs.length - answered} unanswered question{qs.length - answered > 1 ? 's' : ''} will score zero.</p>}
          {Object.values(flags).some(Boolean) && <p className="muted">You still have flagged questions.</p>}
          <div className="row mt"><button className="btn" disabled={busy} onClick={submit}>{busy ? 'Submitting...' : 'Submit now'}</button><button className="btn ghost" onClick={() => setConfirm(false)}>Keep working</button></div>
        </Modal>
      )}
    </div>
  )
}
