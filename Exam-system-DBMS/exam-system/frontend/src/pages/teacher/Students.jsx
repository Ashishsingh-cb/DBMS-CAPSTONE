import { useState } from 'react'
import { useFetch } from '../../hooks'
import { Empty, Loading, PageHead, Pill } from '../../components/ui'

export default function Students() {
  const { data, error } = useFetch('/teacher/students')
  const [s, setS] = useState('')
  if (error) return <Empty title="Couldn't load students" text={error} />
  if (!data) return <Loading />
  const list = data.filter((x) => (x.full_name + x.roll_no).toLowerCase().includes(s.toLowerCase()))
  return (
    <>
      <PageHead title="Students" sub="Roster with each student's average and semester rank."><input style={{ width: 260 }} placeholder="Search name or roll number" value={s} onChange={(e) => setS(e.target.value)} aria-label="Search students" /></PageHead>
      <div className="card scroll-x"><table>
        <thead><tr><th>Roll no</th><th>Name</th><th>Department</th><th>Sem</th><th>Exams</th><th>Average</th><th>Rank</th></tr></thead>
        <tbody>{list.map((x) => (
          <tr key={x.student_id}><td>{x.roll_no}</td><td><b>{x.full_name}</b></td><td>{x.dept_name}</td><td>{x.semester}</td><td>{x.exams_taken}</td>
            <td style={{ minWidth: 140 }}>{x.avg_percentage != null ? <><b>{x.avg_percentage}%</b><div className="bar"><i style={{ width: x.avg_percentage + '%' }} /></div></> : <span className="muted">-</span>}</td>
            <td>{x.semester_rank ? <Pill tone={x.semester_rank <= 3 ? 'green' : ''}>#{x.semester_rank}</Pill> : '-'}</td></tr>))}</tbody></table>
        {list.length === 0 && <div className="empty">No students match your search.</div>}</div>
    </>
  )
}
