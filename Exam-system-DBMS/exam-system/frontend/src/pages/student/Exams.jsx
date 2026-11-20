import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fmtDate, gradeColor } from '../../api'
import { useFetch } from '../../hooks'
import { Empty, I, Loading, Modal, PageHead, Pill } from '../../components/ui'

const TABS = [['all', 'All'], ['live', 'Open now'], ['upcoming', 'Upcoming'], ['done', 'Completed']]

export default function Exams() {
  const { data, error } = useFetch('/student/exams')
  const [tab, setTab] = useState('all')
  const [pick, setPick] = useState(null)
  const nav = useNavigate()
  if (error) return <Empty title="Couldn't load exams" text={error} />
  if (!data) return <Loading />
  const done = (e) => e.attempt_status === 'submitted'
  const list = data.filter((e) => tab === 'all' || (tab === 'done' ? done(e) : !done(e) && e.state === tab))

  return (
    <>
      <PageHead title="My exams" sub="Papers set for your department and semester."><div className="tabs">{TABS.map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div></PageHead>
      {list.length === 0 ? <Empty title="Nothing here" text="No exams match this filter right now." /> : (
        <div className="grid g3">
          {list.map((e) => (
            <div key={e.exam_id} className="card exam-card">
              <div className="row between"><Pill tone="grey">{e.subject_code}</Pill>
                {done(e) ? <Pill tone={e.result_status === 'PASS' ? 'green' : 'red'}>{e.result_status}</Pill> : e.state === 'live' ? <Pill tone="green">Open now</Pill> : e.state === 'upcoming' ? <Pill tone="amber">Upcoming</Pill> : <Pill tone="red">Missed</Pill>}</div>
              <div><h3>{e.title}</h3><span className="muted small">{e.subject_name}</span></div>
              <div className="meta"><span><I.clock width="14" height="14" /> {e.duration_min} min</span><span>{e.question_count} questions</span><span>{e.total_marks} marks</span></div>
              <div className="small muted">Window: {fmtDate(e.start_time)} to {fmtDate(e.end_time)}</div>
              {done(e) ? (
                <div className="row between"><span>Scored <b>{e.marks_obtained}/{e.total_marks}</b> <Pill tone={gradeColor(e.grade)}>{e.grade}</Pill></span><Link className="btn ghost sm" to={`/student/results/${e.attempt_id}`}>View result</Link></div>
              ) : e.state === 'live' ? (
                <button className="btn" onClick={() => setPick(e)}>{e.attempt_status === 'in_progress' ? 'Resume exam' : 'Start exam'}</button>
              ) : <button className="btn" disabled>{e.state === 'upcoming' ? 'Not open yet' : 'Closed'}</button>}
            </div>
          ))}
        </div>
      )}
      {pick && (
        <Modal title={pick.title} onClose={() => setPick(null)}>
          <p className="muted" style={{ marginTop: 0 }}>{pick.subject_name}</p>
          <ul style={{ lineHeight: 1.9, paddingLeft: 20 }}>
            <li>You have <b>{pick.duration_min} minutes</b>. The timer keeps running if you leave the page.</li>
            <li>There are <b>{pick.question_count} questions</b> worth {pick.total_marks} marks. You need {pick.pass_marks} to pass.</li>
            <li>You can attempt this exam <b>only once</b>. It submits automatically when time runs out.</li>
            <li>Switching tabs is recorded and shown to you as a warning.</li>
          </ul>
          <div className="row mt"><button className="btn" onClick={() => nav(`/student/exam/${pick.exam_id}`)}>I'm ready, begin</button><button className="btn ghost" onClick={() => setPick(null)}>Not yet</button></div>
        </Modal>
      )}
    </>
  )
}
