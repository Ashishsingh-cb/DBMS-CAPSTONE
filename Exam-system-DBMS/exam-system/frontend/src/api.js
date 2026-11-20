export async function api(path, { method = 'GET', body } = {}) {
  const token = localStorage.getItem('token')
  const res = await fetch('/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (res.status === 401 && token) { localStorage.clear(); window.location.href = '/' }
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export const fmtDate = (s) => new Date(s).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
export const fmtDay = (s) => new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
export const gradeColor = (g) => (['A+', 'A'].includes(g) ? 'green' : ['B+', 'B', 'C'].includes(g) ? 'amber' : 'red')
