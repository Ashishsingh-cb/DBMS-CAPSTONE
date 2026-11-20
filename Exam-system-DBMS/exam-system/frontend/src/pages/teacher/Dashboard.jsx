import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAuth } from '../../auth'
import { useFetch } from '../../hooks'
import { Empty, I, Loading, PageHead, Pill, Stat } from '../../components/ui'

const COLORS = { 'A+': '#0e8f80', A: '#17a673', 'B+': '#6cc3a0', B: '#f5c542', C: '#f59e0b', D: '#f08a5d', F: '#e5484d' }

export default function Dashboard() {
  const { user } = useAuth()
  const { data: d, error } = useFetch('/teacher/dashboard')
  if (error) return <Empty title="Couldn't load dashboard" text={error} />
  if (!d) return <Loading />
  const c = d.counts
  return (
    <>
      <PageHead title={`Good to see you, ${user.full_name.replace(/^Prof\.\s*/, '')}`} sub="A live summary of your question bank, exams and student performance.">
        <Link to="/teacher/exams/new" className="btn"><I.plus width="16" height="16" /> New exam</Link>
      </PageHead>
      <div className="grid g4">
        <Stat icon={<I.book />} value={c.questions} label="Questions in your bank" />
        <Stat icon={<I.file />} value={c.exams} label="Exams created" />
        <Stat icon={<I.users />} value={c.submissions} label="Submissions received" />
        <Stat icon={<I.check />} value={c.pass_rate != null ? c.pass_rate + '%' : '-'} label="Overall pass rate" />
      </div>
      <div className="grid g-main mt">
        <div className="card"><h3>Subject performance</h3>
          <div style={{ height: 270 }}><ResponsiveContainer><BarChart data={d.subject_performance} margin={{ top: 16, right: 10, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eceef5" vertical={false} /><XAxis dataKey="subject_code" /><YAxis domain={[0, 100]} /><Tooltip /><Legend />
            <Bar dataKey="avg_percentage" name="Average %" fill="#0e8f80" radius={[8, 8, 0, 0]} /><Bar dataKey="pass_rate" name="Pass rate %" fill="#ffd23f" radius={[8, 8, 0, 0]} />
          </BarChart></ResponsiveContainer></div></div>
        <div className="card"><h3>Grade distribution</h3>
          {d.grades.length === 0 ? <p className="muted">No graded submissions yet.</p> : (
            <div style={{ height: 270 }}><ResponsiveContainer><PieChart><Pie data={d.grades} dataKey="n" nameKey="grade" innerRadius={55} outerRadius={90} paddingAngle={2}>
              {d.grades.map((g) => <Cell key={g.grade} fill={COLORS[g.grade]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div>)}
        </div>
      </div>
      <div className="card mt"><div className="row between"><h3>Recent exams</h3><Link className="small" to="/teacher/exams" style={{ color: 'var(--accent)', fontWeight: 700 }}>See all</Link></div>
        <table><tbody>{d.recent_exams.map((e) => (
          <tr key={e.exam_id}><td><b>{e.title}</b><div className="muted small">{e.subject_name}</div></td>
            <td><Pill tone={e.status === 'published' ? 'green' : e.status === 'draft' ? 'amber' : 'grey'}>{e.status}</Pill></td>
            <td>{e.submissions} submissions</td><td><Link className="btn ghost sm" to={`/teacher/exams/${e.exam_id}/results`}>Results</Link></td></tr>))}</tbody></table>
      </div>
    </>
  )
}
