import { describe, expect, it } from 'bun:test'
import {
	isAuthCallbackPath,
	legacyLinkTarget,
	loginSiteURLs,
	nativeAuthorizeParams,
	signInOutcome,
	signOutTarget,
	startWebSignIn,
	webReturnPath
} from '@/utils/login-site'

const login = 'https://login.example.test'

describe('loginSiteURLs', () => {
	it('starts web sign-in on the account API with the return path', () => {
		const urls = loginSiteURLs({
			EXPO_PUBLIC_HAWCONNECT_AUTH_URL: 'https://api.example.test/api/accounts'
		})
		expect(urls.start('/marketplace')).toBe(
			'https://api.example.test/api/accounts/oidc/start?return=%2Fmarketplace'
		)
	})

	it('derives the account API from the GraphQL endpoint when no auth URL is set', () => {
		const urls = loginSiteURLs({
			EXPO_PUBLIC_HAWCONNECT_GRAPHQL_ENDPOINT:
				'https://api.example.test/graphql'
		})
		expect(urls.start('/')).toBe(
			'https://api.example.test/api/accounts/oidc/start?return=%2F'
		)
	})

	it('ignores a trailing slash on the auth URL', () => {
		const urls = loginSiteURLs({
			EXPO_PUBLIC_HAWCONNECT_AUTH_URL: 'http://localhost:4000/api/accounts/'
		})
		expect(urls.start('/a')).toBe(
			'http://localhost:4000/api/accounts/oidc/start?return=%2Fa'
		)
	})

	it('uses account.hawconnect.de by default', () => {
		const urls = loginSiteURLs({})
		expect(urls.login).toBe('https://account.hawconnect.de')
		expect(urls.authorize).toBe(
			'https://account.hawconnect.de/api/auth/oauth2/authorize'
		)
	})

	it('reads the login site address from the environment', () => {
		const urls = loginSiteURLs({
			EXPO_PUBLIC_HAWCONNECT_LOGIN_URL: 'http://account.localhost:4000/'
		})
		expect(urls.login).toBe('http://account.localhost:4000')
		expect(urls.authorize).toBe(
			'http://account.localhost:4000/api/auth/oauth2/authorize'
		)
	})

	it('describes the native client exactly as registered', () => {
		expect(loginSiteURLs({}).native).toEqual({
			clientId: 'hawconnect-app',
			redirectUri: 'hawconnect://auth/callback',
			scopes: ['openid', 'email']
		})
	})
})

describe('legacyLinkTarget', () => {
	it('sends an old email-confirmation link to the login site', () => {
		expect(
			legacyLinkTarget(
				'https://app.hawconnect.de/auth-confirm#token=abc&kind=verify',
				login
			)
		).toBe(`${login}/confirm?token=abc`)
		expect(
			legacyLinkTarget('hawconnect://auth-confirm#token=abc&kind=verify', login)
		).toBe(`${login}/confirm?token=abc`)
	})

	it('sends an old password-reset link to the login site', () => {
		expect(
			legacyLinkTarget(
				'https://app.hawconnect.de/reset-password#token=abc',
				login
			)
		).toBe(`${login}/reset-password?token=abc`)
		expect(
			legacyLinkTarget('hawconnect://reset-password#token=abc', login)
		).toBe(`${login}/reset-password?token=abc`)
	})

	it('re-encodes the token as a query value and never as a fragment', () => {
		const target = legacyLinkTarget(
			'https://app.hawconnect.de/reset-password#token=a%2Bb%26c%23d',
			login
		)
		expect(target).not.toBeNull()
		const parsed = new URL(target as string)
		expect(parsed.hash).toBe('')
		expect(parsed.searchParams.get('token')).toBe('a+b&c#d')
		expect([...parsed.searchParams.keys()]).toEqual(['token'])
	})

	it('returns null for links without a token', () => {
		expect(
			legacyLinkTarget(
				'https://app.hawconnect.de/auth-confirm#kind=verify',
				login
			)
		).toBeNull()
		expect(
			legacyLinkTarget('https://app.hawconnect.de/reset-password', login)
		).toBeNull()
		expect(
			legacyLinkTarget('https://app.hawconnect.de/reset-password#token=', login)
		).toBeNull()
	})

	it('returns null for the old sign-in link without a kind', () => {
		expect(
			legacyLinkTarget(
				'https://app.hawconnect.de/auth-confirm#token=abc',
				login
			)
		).toBeNull()
	})

	it('returns null for other pages and broken URLs', () => {
		expect(
			legacyLinkTarget('https://app.hawconnect.de/timetable#token=abc', login)
		).toBeNull()
		expect(legacyLinkTarget('not a url', login)).toBeNull()
	})

	it('ignores a token in the query string', () => {
		expect(
			legacyLinkTarget(
				'https://app.hawconnect.de/reset-password?token=abc',
				login
			)
		).toBeNull()
	})
})

describe('signInOutcome', () => {
	it('a cancelled sheet resolves cancelled and shows no error', () => {
		expect(signInOutcome({ type: 'cancel' }, login)).toBe('cancelled')
		expect(signInOutcome({ type: 'dismiss' }, login)).toBe('cancelled')
		expect(signInOutcome({ type: 'locked' }, login)).toBe('cancelled')
	})

	it('a success with a code signs in', () => {
		expect(
			signInOutcome(
				{ type: 'success', params: { code: 'c', state: 's' } },
				login
			)
		).toBe('signed-in')
		expect(
			signInOutcome(
				{ type: 'success', params: { code: 'c', iss: login } },
				login
			)
		).toBe('signed-in')
	})

	it('an error result fails', () => {
		expect(
			signInOutcome(
				{ type: 'error', params: { error: 'access_denied' } },
				login
			)
		).toBe('failed')
	})

	it('a success without a code or from another issuer fails', () => {
		expect(signInOutcome({ type: 'success', params: {} }, login)).toBe('failed')
		expect(
			signInOutcome(
				{ type: 'success', params: { code: 'c', iss: 'https://evil.test' } },
				login
			)
		).toBe('failed')
		expect(
			signInOutcome(
				{ type: 'success', params: { code: 'c', error: 'x' } },
				login
			)
		).toBe('failed')
	})

	it('an unexpected result fails', () => {
		expect(signInOutcome({ type: 'opened' }, login)).toBe('failed')
	})
})

describe('webReturnPath', () => {
	const post = '/marketplace/0b6f2a3e-1d2c-4b5a-9e8f-7a6b5c4d3e2f'

	it('prefers the stored return path', () => {
		expect(webReturnPath(post, '/login')).toBe(post)
	})

	it('falls back to the current route when it is safe', () => {
		expect(webReturnPath(null, '/marketplace')).toBe('/marketplace')
		expect(webReturnPath(null, '/timetable')).toBe('/timetable')
	})

	it('never returns to the sign-in pages themselves', () => {
		expect(webReturnPath(null, '/login')).toBe('/')
		expect(webReturnPath(null, '/auth-confirm')).toBe('/')
		expect(webReturnPath(null, '/reset-password')).toBe('/')
	})

	it('drops unsafe routes', () => {
		for (const bad of [
			'',
			'marketplace',
			'//evil.example',
			'/\\evil',
			'/a?b',
			'/a#b',
			'/a b',
			'https://evil.example'
		])
			expect(webReturnPath(null, bad)).toBe('/')
	})
})

describe('isAuthCallbackPath', () => {
	it('matches the native sign-in return in every shape expo-router passes', () => {
		expect(isAuthCallbackPath('auth/callback')).toBe(true)
		expect(isAuthCallbackPath('/auth/callback')).toBe(true)
		expect(isAuthCallbackPath('/auth/callback?code=x')).toBe(true)
		expect(isAuthCallbackPath('hawconnect://auth/callback?code=x')).toBe(true)
		expect(
			isAuthCallbackPath('hawconnect:///auth/callback?code=x&state=y')
		).toBe(true)
	})

	it('leaves every other path alone', () => {
		expect(isAuthCallbackPath('auth/callback-x')).toBe(false)
		expect(isAuthCallbackPath('auth/callback/more')).toBe(false)
		expect(isAuthCallbackPath('marketplace/abc')).toBe(false)
		expect(isAuthCallbackPath('hawconnect://auth-confirm#token=x')).toBe(false)
		expect(isAuthCallbackPath('https://app.hawconnect.de/auth/callback')).toBe(
			false
		)
		expect(isAuthCallbackPath('')).toBe(false)
	})
})

describe('signOutTarget', () => {
	const url = `${login}/api/auth/oauth2/end-session?client_id=hawconnect-app`

	it('web follows an end-session address on the login origin', () => {
		expect(signOutTarget('web', url, login)).toBe(url)
	})

	it('phones never open a browser', () => {
		expect(signOutTarget('ios', url, login)).toBeNull()
		expect(signOutTarget('android', url, login)).toBeNull()
	})

	it('refuses other origins, lookalikes and non-http schemes', () => {
		for (const bad of [
			undefined,
			null,
			'',
			'not a url',
			'javascript:alert(1)',
			'https://evil.example/api/auth/oauth2/end-session',
			'https://login.example.test.evil.example/x',
			'http://login.example.test/x',
			'https://login.example.test@evil.example/x'
		])
			expect(signOutTarget('web', bad, login)).toBeNull()
	})
})

describe('startWebSignIn', () => {
	it('clears guest mode before leaving the page', () => {
		const calls: string[] = []
		startWebSignIn('https://api.test/oidc/start?return=%2F', {
			clearGuestMode: () => calls.push('clear'),
			assign: (u) => calls.push(`assign ${u}`)
		})
		expect(calls).toEqual([
			'clear',
			'assign https://api.test/oidc/start?return=%2F'
		])
	})
})

describe('nativeAuthorizeParams', () => {
	it('always asks for the password on the phone', () => {
		// Android's sign-in sheet shares the browser's cookies; without
		// prompt=login a login-site session would sign the next person in.
		expect(nativeAuthorizeParams('n0nce')).toEqual({
			nonce: 'n0nce',
			prompt: 'login'
		})
	})
})
