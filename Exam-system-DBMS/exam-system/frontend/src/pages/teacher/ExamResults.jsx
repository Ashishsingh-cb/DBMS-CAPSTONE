import { Link, useParams } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { gradeColor } from '../../api'
import { useFetch } from '../../hooks'
import { Empty, I, Loading, PageHead, Pill, Stat } from '../../components/ui'

export default function ExamResults() {
  const { id } = useParams()
  const { data: d, error } = useFetch(`/teacher/exams/${id}/results`)
  if (error) return <Empty title="Couldn't load results" text={error} />
  if (!d) return <Loading />
  const csv = () => {
    const rows = [['Rank', 'Roll no', 'Name', 'Marks', 'Total', 'Percentage', 'Grade', 'Status'],
      ...d.results.map((r) => [r.exam_rank, r.roll_no, r.full_name, r.marks_obtained, r.total_marks, r.percentage, r.grade, r.result_status])]
    const blob = new Blob([rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${d.exam.title}-results.csv`; a.click()
  }
  return (
    <>
      <Link to="/teacher/exams" className="muted small">Back to exams</Link>
      <PageHead title={d.exam.title} sub={d.exam.subject_name}><button className="btn" onClick={csv} disabled={!d.results.length}>Download CSV</button></PageHead>
      <div className="grid g4">
        <Stat icon={<I.users />} value={d.stats.n} label="Students submitted" />
        <Stat icon={<I.trend />} value={d.stats.avg_pct != null ? d.stats.avg_pct + '%' : '-'} label="Class average" />
        <Stat icon={<I.award />} value={d.stats.top != null ? `${d.stats.top}/${d.exam.total_marks}` : '-'} label="Highest score" />
        <Stat icon={<I.check />} value={d.stats.pass_rate != null ? d.stats.pass_rate + '%' : '-'} label="Pass rate" />
      </div>
      {d.results.length === 0 ? <div className="mt"><Empty title="No submissions yet" text="Results appear here as students submit." /></div> : (
        <div className="grid g-main mt">
          <div className="card scroll-x"><h3>Leaderboard</h3>
            <table><thead><tr><th>Rank</th><th>Student</th><th>Marks</th><th>Grade</th><th>Result</th></tr></thead>
              <tbody>{d.results.map((r) => (
                <tr key={r.result_id}><td><span className={'medal' + (r.exam_rank <= 3 ? ' m' + r.exam_rank : '')}>{r.exam_rank}</span></td>
                  <td><b>{r.full_name}</b><div className="muted small">{r.roll_no}</div></td><td>{r.marks_obtained}/{r.total_marks} <span className="muted small">({r.percentage}%)</span></td>
                  <td><Pill tone={gradeColor(r.grade)}>{r.grade}</Pill></td><td><Pill tone={r.result_status === 'PASS' ? 'green' : 'red'}>{r.result_status}</Pill></td></tr>))}</tbody></table></div>
          <div>
            <div className="card"><h3>Grades</h3><div style={{ height: 200 }}><ResponsiveContainer><BarChart data={d.grades} margin={{ top: 14, left: -26 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eceef5" /><XAxis dataKey="grade" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="n" name="Students" fill="#0e8f80" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></div>
            {d.not_attempted.length > 0 && <div className="card mt-s"><h3>Not attempted ({d.not_attempted.length})</h3><ul style={{ paddingLeft: 18, margin: '8px 0 0' }}>{d.not_attempted.map((s) => <li key={s.roll_no}>{s.full_name} <span className="muted small">{s.roll_no}</span></li>)}</ul></div>}
          </div>
        </div>)}
    </>
  )
}
