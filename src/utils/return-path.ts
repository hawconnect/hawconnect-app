/** Minimal key-value store (MMKV-compatible), injected so this stays pure. */
export interface ReturnPathStore {
	getString: (key: string) => string | undefined
	set: (key: string, value: string) => void
	remove: (key: string) => void
}

const KEY = 'hawconnect-return-path'
export const RETURN_PATH_TTL_MS = 60 * 60 * 1000
/**
 * Only these in-app pages may be restored after sign-in (no open redirect):
 * the emailed report link (base64url token) and a marketplace post (uuid),
 * so a guest who signs in to contact someone lands back on that post.
 */
const ALLOWED =
	/^\/marketplace\/(report\/[A-Za-z0-9_-]+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/

export const isAllowedReturnPath = (path: unknown): path is string =>
	typeof path === 'string' && ALLOWED.test(path)

/** Remember where to go after sign-in. Rejected paths are ignored. */
export function saveReturnPath(
	store: ReturnPathStore,
	path: string,
	now = Date.now()
): void {
	if (!isAllowedReturnPath(path)) return
	store.set(KEY, JSON.stringify({ path, at: now }))
}

/** The saved path if still valid, or null. Reading clears it (once only); a failing store yields null. */
export function takeReturnPath(
	store: ReturnPathStore,
	now = Date.now()
): string | null {
	let raw: string | undefined
	try {
		raw = store.getString(KEY)
		if (raw === undefined) return null
		store.remove(KEY)
	} catch {
		return null
	}
	try {
		const value: unknown = JSON.parse(raw)
		if (typeof value !== 'object' || value === null) return null
		const { path, at } = value as { path?: unknown; at?: unknown }
		if (typeof at !== 'number' || now - at > RETURN_PATH_TTL_MS || now < at)
			return null
		return isAllowedReturnPath(path) ? path : null
	} catch {
		return null
	}
}
