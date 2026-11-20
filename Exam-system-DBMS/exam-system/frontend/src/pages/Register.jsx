import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useToast } from '../components/ui'

export default function Register() {
  const nav = useNavigate(); const toast = useToast()
  const [depts, setDepts] = useState([])
  const [f, setF] = useState({ full_name: '', email: '', roll_no: '', password: '', semester: 4, dept_id: 1 })
  const [err, setErr] = useState('')
  useEffect(() => { api('/departments').then(setDepts).catch(() => {}) }, [])
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const submit = async (e) => {
    e.preventDefault(); setErr('')
    try { await api('/auth/register', { method: 'POST', body: f }); toast('Account created. Sign in to continue.'); nav('/student/login') } catch (x) { setErr(x.message) }
  }
  return (
    <div className="auth theme-student">
      <div className="auth-art">
        <div className="brand"><i className="dot" />ExamHall</div>
        <div className="omr" aria-hidden="true">{Array.from({ length: 16 }, (_, i) => <span key={i} className={[0, 4, 7, 13].includes(i) ? 'f' : ''} />)}</div>
        <div><h1>Join your class.</h1><p className="mt-s">Register with your roll number and semester to see the exams meant for you.</p></div><span />
      </div>
      <div className="auth-form">
        <form onSubmit={submit}>
          <h2 style={{ fontSize: 28 }}>Create student account</h2>
          <label>Full name</label><input required value={f.full_name} onChange={set('full_name')} />
          <label>College email</label><input type="email" required value={f.email} onChange={set('email')} />
          <div className="row"><div className="grow"><label>Roll number</label><input required value={f.roll_no} onChange={set('roll_no')} /></div>
            <div style={{ width: 110 }}><label>Semester</label><select value={f.semester} onChange={set('semester')}>{[1, 2, 3, 4, 5, 6, 7, 8].map((s) => <option key={s}>{s}</option>)}</select></div></div>
          <label>Department</label><select value={f.dept_id} onChange={set('dept_id')}>{depts.map((d) => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}</select>
          <label>Password</label><input type="password" required minLength={6} value={f.password} onChange={set('password')} />
          {err && <div className="err" role="alert">{err}</div>}
          <button className="btn mt" style={{ width: '100%' }}>Create account</button>
          <p className="switch">Already registered? <Link to="/student/login">Sign in</Link></p>
        </form>
      </div>
    </div>
  )
}
