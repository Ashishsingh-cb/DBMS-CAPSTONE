import { Link } from 'react-router-dom'
import { fmtDay, gradeColor } from '../../api'
import { useFetch } from '../../hooks'
import { Empty, Loading, PageHead, Pill } from '../../components/ui'

export default function Results() {
  const { data, error } = useFetch('/student/results')
  if (error) return <Empty title="Couldn't load results" text={error} />
  if (!data) return <Loading />
  return (
    <>
      <PageHead title="Results" sub="Every exam you've submitted, with your rank in the class." />
      {data.length === 0 ? <Empty title="No results yet" text="Submit an exam and your result will show up here instantly."><Link className="btn mt-s" to="/student/exams">Find an exam</Link></Empty> : (
        <div className="card scroll-x"><table>
          <thead><tr><th>Exam</th><th>Subject</th><th>Date</th><th>Score</th><th>Grade</th><th>Rank</th><th></th></tr></thead>
          <tbody>{data.map((r) => (
            <tr key={r.result_id}>
              <td><b>{r.exam_title}</b></td><td>{r.subject_name}</td><td>{fmtDay(r.start_time)}</td>
              <td style={{ minWidth: 150 }}><b>{r.marks_obtained}/{r.total_marks}</b> <span className="muted small">({r.percentage}%)</span><div className="bar"><i style={{ width: r.percentage + '%' }} /></div></td>
              <td><Pill tone={gradeColor(r.grade)}>{r.grade}</Pill></td>
              <td>#{r.exam_rank} <span className="muted small">of {r.participants}</span></td>
              <td><Link className="btn ghost sm" to={`/student/results/${r.attempt_id}`}>Review</Link></td>
            </tr>))}</tbody></table></div>
      )}
    </>
  )
}
