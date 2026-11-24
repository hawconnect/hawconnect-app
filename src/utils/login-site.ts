/** Environment values read for sign-in (pass them explicitly: Expo inlines only direct `process.env.X` reads). */
export interface LoginSiteEnv {
	EXPO_PUBLIC_HAWCONNECT_LOGIN_URL?: string
	EXPO_PUBLIC_HAWCONNECT_AUTH_URL?: string
	EXPO_PUBLIC_HAWCONNECT_GRAPHQL_ENDPOINT?: string
}

export const DEFAULT_LOGIN_URL = 'https://account.hawconnect.de'
const NATIVE = {
	clientId: 'hawconnect-app',
	redirectUri: 'hawconnect://auth/callback',
	// No offline_access: the API redeems the code and issues today's app session.
	scopes: ['openid', 'email']
} as const

const trimSlash = (value: string) => value.replace(/\/+$/, '')

export function loginSiteURLs(env: LoginSiteEnv) {
	const login = new URL(
		env.EXPO_PUBLIC_HAWCONNECT_LOGIN_URL || DEFAULT_LOGIN_URL
	).origin
	const accounts = trimSlash(
		env.EXPO_PUBLIC_HAWCONNECT_AUTH_URL ||
			new URL(
				'/api/accounts',
				env.EXPO_PUBLIC_HAWCONNECT_GRAPHQL_ENDPOINT ||
					'http://localhost:4000/graphql'
			).toString()
	)
	return {
		login,
		start: (returnPath: string) =>
			`${accounts}/oidc/start?${new URLSearchParams({ return: returnPath })}`,
		authorize: `${login}/api/auth/oauth2/authorize`,
		native: { ...NATIVE, scopes: [...NATIVE.scopes] }
	}
}

/**
 * Extra authorize parameters for the phone apps. `prompt=login` makes the
 * login site ask for the password every time: on Android the sign-in sheet
 * shares the browser's cookies (`preferEphemeralSession` is iOS-only), so a
 * login-site session would otherwise sign the next person in without one.
 */
export function nativeAuthorizeParams(nonce: string): Record<string, string> {
	return { nonce, prompt: 'login' }
}

/** `auth-confirm` for both `https://host/auth-confirm` and `hawconnect://auth-confirm`. */
function routeOf(url: URL): string {
	const path =
		url.protocol === 'http:' || url.protocol === 'https:'
			? url.pathname
			: `${url.host}${url.pathname}`
	return path.replace(/^\/+|\/+$/g, '')
}

/**
 * Old emailed links (before the login site) carry the token in the fragment.
 * Confirm and reset links move to the login site; the token goes in the query
 * there, because the login site reads it server-side. Anything else → null.
 */
export function legacyLinkTarget(
	url: string,
	loginOrigin: string
): string | null {
	let parsed: URL
	try {
		parsed = new URL(url)
	} catch {
		return null
	}
	const fragment = new URLSearchParams(parsed.hash.replace(/^#/, ''))
	const token = fragment.get('token')
	if (!token) return null
	const route = routeOf(parsed)
	const page =
		route === 'auth-confirm' && fragment.get('kind') === 'verify'
			? 'confirm'
			: route === 'reset-password'
				? 'reset-password'
				: null
	if (!page) return null
	return `${trimSlash(loginOrigin)}/${page}?${new URLSearchParams({ token })}`
}

/** The parts of an `expo-auth-session` result this decides on. */
export interface AuthResultLike {
	type: string
	params?: Record<string, string | undefined>
}

/**
 * Closing the sheet is not an error (nothing is shown). A success needs a
 * code, no error and, when the provider names itself (RFC 9207), the login origin.
 */
export function signInOutcome(
	result: AuthResultLike,
	loginOrigin: string
): 'signed-in' | 'cancelled' | 'failed' {
	if (
		result.type === 'cancel' ||
		result.type === 'dismiss' ||
		result.type === 'locked'
	)
		return 'cancelled'
	if (result.type !== 'success') return 'failed'
	const params = result.params ?? {}
	if (!params.code || params.error) return 'failed'
	if (params.iss !== undefined && params.iss !== trimSlash(loginOrigin))
		return 'failed'
	return 'signed-in'
}

const SIGN_IN_PAGES = new Set(['/login', '/auth-confirm', '/reset-password'])
const SAFE_PATH = /^\/[A-Za-z0-9/_-]*$/

/** Where web sign-in returns: the stored path, else the current route if plain, else `/`. The API checks again. */
export function webReturnPath(stored: string | null, current: string): string {
	if (stored) return stored
	if (
		SAFE_PATH.test(current) &&
		!current.startsWith('//') &&
		!SIGN_IN_PAGES.has(current.replace(/\/+$/, ''))
	)
		return current
	return '/'
}

/**
 * The native sign-in return (`hawconnect://auth/callback?code=…`). On Android
 * expo-router also receives it; it belongs to expo-auth-session only.
 */
export function isAuthCallbackPath(path: string): boolean {
	const route = path
		.replace(/^hawconnect:\/*/i, '')
		.replace(/[?#].*$/, '')
		.replace(/^\/+|\/+$/g, '')
	return route === 'auth/callback'
}

/**
 * Where the browser goes after a local sign-out. Only the web app has a
 * login-site session to end; phones get nothing. Only an address on the
 * configured login origin counts, so a wrong API answer cannot send the
 * browser elsewhere. Ending the login session is best effort: if the server
 * call failed there is no address and the app is just signed out locally.
 */
export function signOutTarget(
	platform: string,
	endSessionUrl: string | null | undefined,
	loginOrigin: string
): string | null {
	if (platform !== 'web' || !endSessionUrl) return null
	try {
		const url = new URL(endSessionUrl)
		return url.origin === new URL(loginOrigin).origin ? url.toString() : null
	} catch {
		return null
	}
}

/**
 * Web sign-in leaves the page and never runs the in-app `apply()`, so the
 * guest flag must be cleared first or `refresh()` would keep showing guest
 * mode after the user comes back with a session.
 */
export function startWebSignIn(
	startUrl: string,
	deps: { clearGuestMode: () => void; assign: (url: string) => void }
): void {
	deps.clearGuestMode()
	deps.assign(startUrl)
}
