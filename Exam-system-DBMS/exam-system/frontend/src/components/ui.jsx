import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const ToastCtx = createContext(() => {})
export const useToast = () => useContext(ToastCtx)
export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const push = useCallback((msg, err = false) => {
    const id = Math.random()
    setItems((x) => [...x, { id, msg, err }])
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 3500)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" role="status">{items.map((i) => <div key={i.id} className={'toast' + (i.err ? ' err' : '')}>{i.msg}</div>)}</div>
    </ToastCtx.Provider>
  )
}

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={wide ? { maxWidth: 720 } : null} role="dialog" aria-modal="true" aria-label={title}>
        <div className="row between" style={{ marginBottom: 8 }}><h2>{title}</h2><button className="btn ghost sm" onClick={onClose} aria-label="Close">Close</button></div>
        {children}
      </div>
    </div>
  )
}

export const Empty = ({ title, text, children }) => (
  <div className="empty card"><h3>{title}</h3><p>{text}</p>{children}</div>
)

export const Loading = () => (
  <div className="grid g3"><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /></div>
)

export const Stat = ({ icon, value, label }) => (
  <div className="card stat"><div className="ico">{icon}</div><div className="v">{value ?? '-'}</div><div className="l">{label}</div></div>
)

export const PageHead = ({ title, sub, children }) => (
  <div className="page-head"><div><h1>{title}</h1>{sub && <p>{sub}</p>}</div><div className="row">{children}</div></div>
)

export const Pill = ({ tone = '', children }) => <span className={'pill ' + tone}>{children}</span>

// tiny inline icons
const P = (d) => (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d={d} /></svg>
)
export const I = {
  home: P('M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z'),
  file: P('M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h5'),
  award: P('M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.2 13.9 7 22l5-3 5 3-1.2-8.1'),
  chart: P('M4 20V10M10 20V4M16 20v-8M22 20H2'),
  users: P('M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM21 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8'),
  book: P('M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5'),
  plus: P('M12 5v14M5 12h14'),
  clock: P('M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2'),
  check: P('M20 6 9 17l-5-5'),
  trend: P('M22 7 13.5 15.5 8.5 10.5 2 17M16 7h6v6'),
}
