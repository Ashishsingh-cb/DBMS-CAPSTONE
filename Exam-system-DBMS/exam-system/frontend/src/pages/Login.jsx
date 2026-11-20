import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'

const COPY = {
  student: { h: 'Welcome back, student.', p: 'Your exams, marks and class rank are one sign-in away.', demo: ['aarav.sharma@college.edu', 'password123'], theme: 'theme-student' },
  teacher: { h: 'Your classroom, at a glance.', p: 'Set papers, publish them and watch results arrive already ranked.', demo: ['prof.kapoor@college.edu', 'password123'], theme: 'theme-teacher' },
}

export default function Login({ role }) {
  const c = COPY[role]
  const { login } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true)
    try { await login(role, email, password); nav(`/${role}`) } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  return (
    <div className={'auth ' + c.theme}>
      <div className="auth-art">
        <div className="brand"><i className="dot" />ExamHall</div>
        <div className="omr" aria-hidden="true">{Array.from({ length: 16 }, (_, i) => <span key={i} className={[2, 5, 9, 12].includes(i) ? 'f' : ''} />)}</div>
        <div><h1>{c.h}</h1><p className="mt-s">{c.p}</p></div>
        <span className="small" style={{ color: '#b9b8d8' }}>{role === 'student' ? 'Teacher? ' : 'Student? '}
          <Link to={`/${role === 'student' ? 'teacher' : 'student'}/login`} style={{ textDecoration: 'underline' }}>Use the {role === 'student' ? 'teacher' : 'student'} portal</Link></span>
      </div>
      <div className="auth-form">
        <form onSubmit={submit}>
          <h2 style={{ fontSize: 28 }}>Sign in as {role}</h2>
          <label htmlFor="email">College email</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={c.demo[0]} autoComplete="username" />
          <label htmlFor="pw">Password</label>
          <input id="pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          {err && <div className="err" role="alert">{err}</div>}
          <button className="btn mt" style={{ width: '100%' }} disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
          <button type="button" className="btn ghost mt-s" style={{ width: '100%' }} onClick={() => { setEmail(c.demo[0]); setPassword(c.demo[1]) }}>Fill demo login</button>
          {role === 'student' && <p className="switch">New here? <Link to="/register">Create a student account</Link></p>}
          <p className="switch"><Link to="/">Back to start</Link></p>
        </form>
      </div>
    </div>
  )
}
