import { Link } from 'react-router-dom'

const Bubbles = () => (
  <div className="omr" aria-hidden="true">
    {Array.from({ length: 16 }, (_, i) => <span key={i} className={[1, 6, 8, 11, 14].includes(i) ? 'f' : ''} />)}
  </div>
)

export default function Landing() {
  return (
    <div className="landing">
      <Bubbles />
      <h1>Exams that mark themselves.</h1>
      <p>Sit your papers online, see your rank the moment you submit, and give teachers a live view of how every class is doing.</p>
      <div className="portals">
        <Link to="/student/login" className="portal">
          <div className="big" style={{ background: '#ecebff', color: '#5a4bff' }}>S</div>
          <h2>I'm a student</h2><p className="muted" style={{ margin: 0 }}>Take exams, check results and track your rank.</p>
        </Link>
        <Link to="/teacher/login" className="portal">
          <div className="big" style={{ background: '#dcf5f1', color: '#0e8f80' }}>T</div>
          <h2>I'm a teacher</h2><p className="muted" style={{ margin: 0 }}>Build question banks, set papers and read analytics.</p>
        </Link>
      </div>
    </div>
  )
}
