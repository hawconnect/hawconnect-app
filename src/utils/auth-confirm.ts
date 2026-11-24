export type SignInLinkError = '' | 'invalidLink' | 'missingLink'

/** The backend puts the magic-link token in the fragment as `#token=…`. */
export function signInTokenFromHash(hash: string): string {
	return new URLSearchParams(hash.replace(/^#/, '')).get('token') ?? ''
}

export function readSignInLink(url: string): {
	token: string
	error: SignInLinkError
} {
	try {
		const parsed = new URL(url)
		const token = signInTokenFromHash(parsed.hash)
		if (!token) return { token: '', error: 'missingLink' }
		return { token, error: '' }
	} catch {
		return { token: '', error: 'invalidLink' }
	}
}

export function canLeaveConfirmation(input: {
	linkRead: boolean
	busy?: boolean
	token: string
	status: string
	userId: string | null
	readyProfile: string | null
	error: SignInLinkError
}): boolean {
	return (
		input.linkRead &&
		!input.busy &&
		input.token.length === 0 &&
		input.status === 'authenticated' &&
		input.userId !== null &&
		input.readyProfile !== null &&
		input.error !== 'invalidLink'
	)
}
