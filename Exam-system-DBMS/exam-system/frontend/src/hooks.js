import { useCallback, useEffect, useState } from 'react'
import { api } from './api'

export function useFetch(path) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const load = useCallback(() => {
    setError('')
    api(path).then(setData).catch((e) => setError(e.message))
  }, [path])
  useEffect(() => { setData(null); load() }, [load])
  return { data, error, reload: load, setData }
}
