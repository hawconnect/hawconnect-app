import { Platform } from 'react-native'
import { isHAWConnectAppHost } from './app-hosts'
import { signInTokenFromHash } from './auth-confirm'

export interface NativeSignInLink {
	/** The opened link, so its kind can be read (legacy links move to the login site). */
	url: string
	token: string
	error: '' | 'invalidLink' | 'missingLink'
}

let claimed = false
let pending: NativeSignInLink | null = null
const listeners = new Set<() => void>()

export function claimInitialNativeSignIn(): boolean {
	if (Platform.OS === 'web' || claimed) return false
	claimed = true
	return true
}

export function takeNativeSignIn(): NativeSignInLink | null {
	const value = pending
	pending = null
	return value
}

export function subscribeNativeSignIn(listener: () => void): () => void {
	listeners.add(listener)
	return () => listeners.delete(listener)
}

export function queueNativeSignIn(link: NativeSignInLink): void {
	pending = link
	for (const listener of listeners) listener()
}

function isConfirmationLink(url: URL): boolean {
	if (url.protocol === 'hawconnect:')
		return (
			`${url.host}${url.pathname}`.replace(/^\/+|\/+$/g, '') === 'auth-confirm'
		)
	return (
		url.protocol === 'https:' &&
		isHAWConnectAppHost(url.hostname) &&
		url.pathname.replace(/\/+$/, '') === '/auth-confirm'
	)
}

export function parseNativeSignInLink(url: string): NativeSignInLink | null {
	try {
		const parsed = new URL(url)
		if (!isConfirmationLink(parsed)) return null
		const token = signInTokenFromHash(parsed.hash)
		return token ? { url, token, error: '' } : null
	} catch {
		return null
	}
}

export function skipInitialNativeSignIn(): void {
	claimed = true
}
