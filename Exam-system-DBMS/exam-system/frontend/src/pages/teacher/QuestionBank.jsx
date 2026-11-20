import { useEffect, useState } from 'react'
import { api } from '../../api'
import { useFetch } from '../../hooks'
import { Empty, I, Loading, Modal, PageHead, Pill, useToast } from '../../components/ui'

const BLANK = { subject_id: '', question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A', marks: 1, difficulty: 'medium' }
const TONE = { easy: 'green', medium: 'amber', hard: 'red' }

export default function QuestionBank() {
  const toast = useToast()
  const { data: subjects } = useFetch('/teacher/subjects')
  const [f, setF] = useState({ subject_id: '', difficulty: '', search: '' })
  const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString()
  const { data, error, reload } = useFetch('/teacher/questions' + (qs ? '?' + qs : ''))
  const [edit, setEdit] = useState(null)
  const [saving, setSaving] = useState(false)

  const save = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      if (edit.question_id) await api(`/teacher/questions/${edit.question_id}`, { method: 'PUT', body: edit })
      else await api('/teacher/questions', { method: 'POST', body: edit })
      toast(edit.question_id ? 'Question updated.' : 'Question added.'); setEdit(null); reload()
    } catch (x) { toast(x.message, true) } finally { setSaving(false) }
  }
  const del = async (q) => {
    if (!window.confirm('Delete this question?')) return
    try { await api(`/teacher/questions/${q.question_id}`, { method: 'DELETE' }); toast('Question deleted.'); reload() } catch (x) { toast(x.message, true) }
  }
  const set = (k) => (e) => setEdit({ ...edit, [k]: e.target.value })

  return (
    <>
      <PageHead title="Question bank" sub="Multiple-choice questions you can reuse across exams.">
        <button className="btn" onClick={() => setEdit({ ...BLANK, subject_id: subjects?.[0]?.subject_id || '' })}><I.plus width="16" height="16" /> Add question</button>
      </PageHead>
      <div className="card row wrap" style={{ marginBottom: 16 }}>
        <input style={{ maxWidth: 280 }} placeholder="Search question text" value={f.search} onChange={(e) => setF({ ...f, search: e.target.value })} aria-label="Search" />
        <select style={{ maxWidth: 230 }} value={f.subject_id} onChange={(e) => setF({ ...f, subject_id: e.target.value })} aria-label="Subject"><option value="">All subjects</option>{subjects?.map((s) => <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>)}</select>
        <select style={{ maxWidth: 170 }} value={f.difficulty} onChange={(e) => setF({ ...f, difficulty: e.target.value })} aria-label="Difficulty"><option value="">Any difficulty</option><option>easy</option><option>medium</option><option>hard</option></select>
        <span className="muted small right">{data ? data.length + ' questions' : ''}</span>
      </div>
      {error ? <Empty title="Couldn't load questions" text={error} /> : !data ? <Loading /> : data.length === 0 ? <Empty title="No questions found" text="Add your first question or change the filters." /> : (
        <div className="grid">{data.map((q) => (
          <div key={q.question_id} className="card">
            <div className="row between wrap"><div className="row wrap"><Pill tone="grey">{q.subject_code}</Pill><Pill tone={TONE[q.difficulty]}>{q.difficulty}</Pill><span className="muted small">{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
              {q.times_answered > 0 && <span className="muted small">{q.success_pct}% answered correctly ({q.times_answered} attempts)</span>}</div>
              <div className="row"><button className="btn ghost sm" onClick={() => setEdit(q)}>Edit</button><button className="btn ghost sm" onClick={() => del(q)}>Delete</button></div></div>
            <h3 style={{ margin: '10px 0' }}>{q.question_text}</h3>
            <div className="grid g2" style={{ gap: 6 }}>{['A', 'B', 'C', 'D'].map((o) => (
              <div key={o} className={'ropt' + (q.correct_option === o ? ' right-ans' : '')}><span className="opt-chip">{o}</span>{q['option_' + o.toLowerCase()]}</div>))}</div>
          </div>))}</div>
      )}
      {edit && (
        <Modal title={edit.question_id ? 'Edit question' : 'Add question'} onClose={() => setEdit(null)} wide>
          <form onSubmit={save}>
            <div className="row"><div className="grow"><label>Subject</label><select required value={edit.subject_id} onChange={set('subject_id')}>{subjects?.map((s) => <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>)}</select></div>
              <div style={{ width: 150 }}><label>Difficulty</label><select value={edit.difficulty} onChange={set('difficulty')}><option>easy</option><option>medium</option><option>hard</option></select></div>
              <div style={{ width: 90 }}><label>Marks</label><input type="number" min="1" max="10" value={edit.marks} onChange={set('marks')} /></div></div>
            <label>Question</label><textarea required value={edit.question_text} onChange={set('question_text')} />
            {['A', 'B', 'C', 'D'].map((o) => (
              <div key={o} className="row" style={{ marginTop: 10 }}>
                <label style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, width: 50 }}><input type="radio" style={{ width: 'auto' }} name="correct" checked={edit.correct_option === o} onChange={() => setEdit({ ...edit, correct_option: o })} aria-label={`Option ${o} is correct`} />{o}</label>
                <input required placeholder={`Option ${o}`} value={edit['option_' + o.toLowerCase()]} onChange={set('option_' + o.toLowerCase())} /></div>))}
            <p className="muted small">Select the radio button next to the correct answer.</p>
            <div className="row mt"><button className="btn" disabled={saving}>{saving ? 'Saving...' : 'Save question'}</button><button type="button" className="btn ghost" onClick={() => setEdit(null)}>Cancel</button></div>
          </form>
        </Modal>
      )}
    </>
  )
}
