import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth'
import { I } from './ui'

const NAV = {
  student: [['/student', 'Dashboard', I.home, true], ['/student/exams', 'My exams', I.file], ['/student/results', 'Results', I.award]],
  teacher: [['/teacher', 'Dashboard', I.home, true], ['/teacher/questions', 'Question bank', I.book], ['/teacher/exams', 'Exams', I.file],
            ['/teacher/students', 'Students', I.users], ['/teacher/analytics', 'Analytics', I.chart]],
}

export default function Layout({ role }) {
  const { user, logout } = useAuth()
  return (
    <div className={'shell theme-' + role}>
      <aside className="side">
        <div className="brand"><i className="dot" />ExamHall</div>
        <nav className="nav">
          {NAV[role].map(([to, label, Icon, end]) => (
            <NavLink key={to} to={to} end={end}><Icon /><span>{label}</span></NavLink>
          ))}
        </nav>
        <div className="me">
          <b>{user.full_name}</b>
          <span>{role === 'student' ? `${user.roll_no} - Semester ${user.semester}` : user.designation}</span>
          <button onClick={logout}>Sign out</button>
        </div>
      </aside>
      <main className="main"><Outlet /></main>
    </div>
  )
}
