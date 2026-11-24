import { useCallback, useRef } from 'react'

/**
 * Signed photo URLs expire after an hour. When an image fails to load, refetch
 * the data once to get fresh URLs. Only once per mount, so an image that is
 * really broken cannot cause a refetch loop.
 */
export function useExpiredImageRefresh(refetch: () => unknown): () => void {
	const done = useRef(false)
	return useCallback(() => {
		if (done.current) return
		done.current = true
		void refetch()
	}, [refetch])
}
