import { Link, useParams } from 'react-router-dom'
import { gradeColor } from '../../api'
import { useFetch } from '../../hooks'
import { Empty, Loading, Pill } from '../../components/ui'
import { useAuth } from '../../auth'

const L = ['A', 'B', 'C', 'D']

export default function ResultDetail() {
  const { attemptId } = useParams(); const { user } = useAuth()
  const { data, error } = useFetch(`/student/results/${attemptId}`)
  if (error) return <Empty title="Result not found" text={error} />
  if (!data) return <Loading />
  const { result: r, review, leaderboard } = data
  const C = 2 * Math.PI * 62
  const pass = r.result_status === 'PASS'
  return (
    <>
      <Link to="/student/results" className="muted small">Back to results</Link>
      <div className="card row wrap mt-s" style={{ gap: 28 }}>
        <div className="ring">
          <svg viewBox="0 0 150 150" width="150" height="150"><circle cx="75" cy="75" r="62" fill="none" stroke="#eceef5" strokeWidth="14" />
            <circle cx="75" cy="75" r="62" fill="none" stroke={pass ? '#17a673' : '#e5484d'} strokeWidth="14" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - r.percentage / 100)} transform="rotate(-90 75 75)" /></svg>
          <b>{Math.round(r.percentage)}%</b>
        </div>
        <div className="grow">
          <div className="row wrap"><Pill tone={pass ? 'green' : 'red'}>{pass ? 'Passed' : 'Not passed'}</Pill><Pill tone={gradeColor(r.grade)}>Grade {r.grade}</Pill></div>
          <h1 style={{ marginTop: 8 }}>{r.exam_title}</h1>
          <p className="muted" style={{ margin: '2px 0 12px' }}>{r.subject_name}</p>
          <div className="row wrap" style={{ gap: 28 }}>
            <div><div className="muted small">Marks</div><b style={{ fontSize: 22 }}>{r.marks_obtained} / {r.total_marks}</b></div>
            <div><div className="muted small">Class rank</div><b style={{ fontSize: 22 }}>#{r.exam_rank} of {r.participants}</b></div>
            <div><div className="muted small">Percentile</div><b style={{ fontSize: 22 }}>{Math.round(r.percentile * 100)}</b></div>
          </div>
        </div>
      </div>
      <div className="grid g-main mt">
        <div>
          <h2 style={{ marginBottom: 12 }}>Question review</h2>
          {review.map((x, i) => {
            const st = !x.selected_option ? 'skip' : x.is_correct ? 'ok' : 'bad'
            return (
              <div key={i} className={'review ' + st}>
                <div className="row between"><b>Q{i + 1}. {x.question_text}</b><Pill tone={st === 'ok' ? 'green' : st === 'bad' ? 'red' : 'amber'}>{x.marks_awarded}/{x.marks}</Pill></div>
                {L.map((o) => (
                  <div key={o} className={'ropt' + (o === x.correct_option ? ' right-ans' : o === x.selected_option ? ' wrong-pick' : '')}>
                    <span className="opt-chip">{o}</span>{x['option_' + o.toLowerCase()]}
                    {o === x.correct_option && <span className="small right"><b>Correct answer</b></span>}
                    {o === x.selected_option && o !== x.correct_option && <span className="small right"><b>Your answer</b></span>}
                  </div>))}
                {st === 'skip' && <div className="small muted mt-s">You left this one blank.</div>}
              </div>)
          })}
        </div>
        <div className="card" style={{ alignSelf: 'start' }}>
          <h3>Top of the class</h3>
          <table><tbody>{leaderboard.map((b) => (
            <tr key={b.student_id} style={b.student_id === user.pid ? { background: '#fffbe8' } : null}>
              <td><span className={'medal m' + b.exam_rank}>{b.exam_rank}</span></td><td>{b.full_name}{b.student_id === user.pid && <span className="muted small"> (you)</span>}</td><td><b>{b.marks_obtained}</b></td></tr>))}</tbody></table>
        </div>
      </div>
    </>
  )
}
