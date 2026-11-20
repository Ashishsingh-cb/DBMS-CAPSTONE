import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAuth } from '../../auth'
import { useFetch } from '../../hooks'
import { Empty, I, Loading, PageHead, Stat } from '../../components/ui'

export default function Dashboard() {
  const { user } = useAuth()
  const { data: d, error } = useFetch('/student/dashboard')
  if (error) return <Empty title="Couldn't load your dashboard" text={error} />
  if (!d) return <Loading />
  const first = user.full_name.split(' ')[0]
  return (
    <>
      <PageHead title={`Hi ${first}, here's your progress`} sub="Marks, rank and trends across every exam you've taken." />
      {d.live_exams > 0 && (
        <Link to="/student/exams" className="card row between wrap" style={{ background: '#17153b', color: '#fff', marginBottom: 16 }}>
          <div><h3 style={{ color: '#ffd23f' }}>{d.live_exams} exam{d.live_exams > 1 ? 's are' : ' is'} open right now</h3><span className="small" style={{ color: '#c9c8e6' }}>Open the exam list to begin.</span></div>
          <span className="btn yellow">Go to exams</span>
        </Link>
      )}
      <div className="grid g4">
        <Stat icon={<I.file />} value={d.stats.exams_taken} label="Exams taken" />
        <Stat icon={<I.trend />} value={d.stats.avg_pct != null ? d.stats.avg_pct + '%' : '-'} label="Average score" />
        <Stat icon={<I.award />} value={d.stats.best != null ? d.stats.best + '%' : '-'} label="Best score" />
        <Stat icon={<I.users />} value={d.semester ? '#' + d.semester.semester_rank : '-'} label="Semester rank" />
      </div>
      {d.trend.length === 0 ? (
        <div className="mt"><Empty title="No results yet" text="Your charts appear here after you submit your first exam."><Link to="/student/exams" className="btn mt-s">See available exams</Link></Empty></div>
      ) : (
        <div className="grid g2 mt">
          <div className="card"><h3>Score by exam</h3>
            <div style={{ height: 250 }}><ResponsiveContainer><LineChart data={d.trend} margin={{ top: 16, right: 10, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eceef5" /><XAxis dataKey="exam_title" tick={{ fontSize: 11 }} interval={0} tickFormatter={(s) => s.slice(0, 10)} /><YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => v + '%'} /><Line type="monotone" dataKey="percentage" stroke="#5a4bff" strokeWidth={3} dot={{ r: 5, fill: '#ffd23f', stroke: '#17153b', strokeWidth: 2 }} name="Score" />
            </LineChart></ResponsiveContainer></div></div>
          <div className="card"><h3>Average by subject</h3>
            <div style={{ height: 250 }}><ResponsiveContainer><BarChart data={d.subject_avg} margin={{ top: 16, right: 10, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eceef5" vertical={false} /><XAxis dataKey="subject_code" tick={{ fontSize: 12 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => v + '%'} labelFormatter={(c) => d.subject_avg.find((s) => s.subject_code === c)?.subject_name} /><Bar dataKey="avg_pct" fill="#5a4bff" radius={[8, 8, 0, 0]} name="Average" />
            </BarChart></ResponsiveContainer></div></div>
        </div>
      )}
    </>
  )
}
