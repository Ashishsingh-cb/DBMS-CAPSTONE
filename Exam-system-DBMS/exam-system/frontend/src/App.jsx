import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import SDash from './pages/student/Dashboard'
import SExams from './pages/student/Exams'
import TakeExam from './pages/student/TakeExam'
import SResults from './pages/student/Results'
import SResultDetail from './pages/student/ResultDetail'
import TDash from './pages/teacher/Dashboard'
import QuestionBank from './pages/teacher/QuestionBank'
import TExams from './pages/teacher/Exams'
import CreateExam from './pages/teacher/CreateExam'
import ExamResults from './pages/teacher/ExamResults'
import Students from './pages/teacher/Students'
import Analytics from './pages/teacher/Analytics'

function Guard({ role, children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to={`/${role}/login`} replace />
  if (user.role !== role) return <Navigate to={`/${user.role}`} replace />
  return children
}

export default function App() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={`/${user.role}`} replace /> : <Landing />} />
      <Route path="/student/login" element={<Login role="student" />} />
      <Route path="/teacher/login" element={<Login role="teacher" />} />
      <Route path="/register" element={<Register />} />

      <Route path="/student/exam/:id" element={<Guard role="student"><TakeExam /></Guard>} />
      <Route path="/student" element={<Guard role="student"><Layout role="student" /></Guard>}>
        <Route index element={<SDash />} />
        <Route path="exams" element={<SExams />} />
        <Route path="results" element={<SResults />} />
        <Route path="results/:attemptId" element={<SResultDetail />} />
      </Route>

      <Route path="/teacher" element={<Guard role="teacher"><Layout role="teacher" /></Guard>}>
        <Route index element={<TDash />} />
        <Route path="questions" element={<QuestionBank />} />
        <Route path="exams" element={<TExams />} />
        <Route path="exams/new" element={<CreateExam />} />
        <Route path="exams/:id/results" element={<ExamResults />} />
        <Route path="students" element={<Students />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
