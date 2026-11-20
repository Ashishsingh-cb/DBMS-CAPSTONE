import { Link } from 'react-router-dom'
import { api, fmtDate } from '../../api'
import { useFetch } from '../../hooks'
import { Empty, I, Loading, PageHead, Pill, useToast } from '../../components/ui'

const TONE = { draft: 'amber', published: 'green', closed: 'grey' }

export default function Exams() {
  const toast = useToast()
  const { data, error, reload } = useFetch('/teacher/exams')
  const setStatus = async (e, status) => {
    try { await api(`/teacher/exams/${e.exam_id}/status`, { method: 'PATCH', body: { status } }); toast(`Exam ${status}.`); reload() } catch (x) { toast(x.message, true) }
  }
  const del = async (e) => {
    if (!window.confirm(`Delete "${e.title}"?`)) return
    try { await api(`/teacher/exams/${e.exam_id}`, { method: 'DELETE' }); toast('Exam deleted.'); reload() } catch (x) { toast(x.message, true) }
  }
  if (error) return <Empty title="Couldn't load exams" text={error} />
  if (!data) return <Loading />
  return (
    <>
      <PageHead title="Exams" sub="Publish papers, close them, and open results."><Link to="/teacher/exams/new" className="btn"><I.plus width="16" height="16" /> New exam</Link></PageHead>
      {data.length === 0 ? <Empty title="No exams yet" text="Create your first exam from the question bank." /> : (
        <div className="grid g2">{data.map((e) => (
          <div key={e.exam_id} className="card exam-card">
            <div className="row between"><div className="row"><Pill tone="grey">{e.subject_code}</Pill><Pill>{e.exam_type}</Pill></div><Pill tone={TONE[e.status]}>{e.status}</Pill></div>
            <div><h3>{e.title}</h3><span className="muted small">{e.subject_name} - Semester {e.semester}</span></div>
            <div className="meta"><span>{e.question_count} questions</span><span>{e.total_marks} marks</span><span>{e.duration_min} min</span><span>{e.submissions} submissions</span></div>
            <div className="small muted">{fmtDate(e.start_time)} to {fmtDate(e.end_time)}</div>
            <div className="row wrap">
              {e.status === 'draft' && <button className="btn sm" onClick={() => setStatus(e, 'published')}>Publish</button>}
              {e.status === 'published' && <button className="btn ghost sm" onClick={() => setStatus(e, 'closed')}>Close exam</button>}
              {e.status === 'closed' && <button className="btn ghost sm" onClick={() => setStatus(e, 'published')}>Reopen</button>}
              <Link className="btn ghost sm" to={`/teacher/exams/${e.exam_id}/results`}>Results</Link>
              <button className="btn ghost sm right" onClick={() => del(e)}>Delete</button>
            </div>
          </div>))}</div>)}
    </>
  )
}
