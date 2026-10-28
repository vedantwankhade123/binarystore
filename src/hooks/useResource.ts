import { useEffect, useState } from 'react'
export function useResource<T>(loader: () => Promise<T>) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{ loader: () => Promise<T>; attempt: number; data: T | null; error: Error | null } | null>(null)
  useEffect(() => {
    let active = true
    loader().then(data => { if (active) setResult({ loader, attempt, data, error: null }) }).catch((error: unknown) => {
      if (active) setResult({ loader, attempt, data: null, error: error instanceof Error ? error : new Error('Something went wrong. Please try again.') })
    })
    return () => { active = false }
  }, [loader, attempt])
  const current = result?.loader === loader && result.attempt === attempt ? result : null
  return { data: current?.data ?? null, error: current?.error ?? null, loading: !current, retry: () => setAttempt(a => a + 1) }
}
