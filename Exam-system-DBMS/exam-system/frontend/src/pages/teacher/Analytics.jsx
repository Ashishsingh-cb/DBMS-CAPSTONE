import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useFetch } from '../../hooks'
import { Empty, Loading, PageHead, Pill } from '../../components/ui'

export default function Analytics() {
  const { data: d, error } = useFetch('/teacher/analytics')
  if (error) return <Empty title="Couldn't load analytics" text={error} />
  if (!d) return <Loading />
  return (
    <>
      <PageHead title="Analytics" sub="Where students are strong, and which questions are tripping them up." />
      <div className="grid g2">
        <div className="card"><h3>Subject-wise performance</h3><div style={{ height: 280 }}><ResponsiveContainer><BarChart data={d.subjects} margin={{ top: 16, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eceef5" /><XAxis dataKey="subject_code" /><YAxis domain={[0, 100]} /><Tooltip /><Legend />
          <Bar dataKey="avg_percentage" name="Average %" fill="#0e8f80" radius={[6, 6, 0, 0]} /><Bar dataKey="highest" name="Highest %" fill="#ffd23f" radius={[6, 6, 0, 0]} /><Bar dataKey="lowest" name="Lowest %" fill="#e5484d" radius={[6, 6, 0, 0]} />
        </BarChart></ResponsiveContainer></div></div>
        <div className="card"><h3>Semester averages</h3><div style={{ height: 280 }}><ResponsiveContainer><BarChart data={d.semesters.map((s) => ({ ...s, label: 'Sem ' + s.semester }))} margin={{ top: 16, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eceef5" /><XAxis dataKey="label" /><YAxis domain={[0, 100]} /><Tooltip /><Bar dataKey="avg_pct" name="Average %" fill="#0e8f80" radius={[6, 6, 0, 0]} />
        </BarChart></ResponsiveContainer></div></div>
      </div>
      <div className="grid g2 mt">
        <div className="card"><h3>Toppers by subject</h3><table><tbody>{d.toppers.map((t, i) => (
          <tr key={i}><td><b>{t.subject_name}</b></td><td>{t.full_name}</td><td><Pill tone="green">{t.percentage}%</Pill></td></tr>))}</tbody></table></div>
        <div className="card"><h3>Hardest questions</h3>{d.hardest_questions.length === 0 ? <p className="muted">Needs a few submissions first.</p> : d.hardest_questions.map((q) => (
          <div key={q.question_id} style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
            <div className="row between"><b style={{ fontSize: 14 }}>{q.question_text}</b><Pill tone="red">{q.success_pct}% right</Pill></div>
            <div className="muted small">{q.subject_code} - {q.difficulty} - {q.times_answered} attempts</div></div>))}</div>
      </div>
    </>
  )
}
