import { useEffect, useRef, useState } from 'react'
import type { DependencyList } from 'react'
import { errorMessage } from './api'

export function useResource<T>(loader: () => Promise<T>, dependencies: DependencyList = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    loaderRef
      .current()
      .then((result) => {
        if (active) setData(result)
      })
      .catch((reason: unknown) => {
        if (active) setError(errorMessage(reason))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
    // The caller supplies the inputs which should reload this resource.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, revision])

  return { data, setData, loading, error, reload: () => setRevision((value) => value + 1) }
}
