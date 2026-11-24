export type AccountStatus = 'loading' | 'guest' | 'authenticated' | 'locked'
/** The marketplace list and a single post page (uuid); nothing else under /marketplace. */
export const isPublicMarketplacePath = (path: string): boolean =>
	/^\/marketplace(\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})?$/.test(
		path
	)

export function accountAccess(
	_platform: string,
	status: AccountStatus,
	path: string
): 'allow' | 'loading' | 'sign-in' {
	if (
		[
			'/login',
			'/auth-confirm',
			'/reset-password',
			'/legal',
			'/privacy',
			'/imprint',
			'/licenses',
			'/license',
			'/about'
		].includes(path)
	)
		return 'allow'
	if (status === 'loading') return 'loading'
	// Browsing the marketplace is open to everyone, also before choosing guest mode.
	if (isPublicMarketplacePath(path)) return 'allow'
	if (status === 'authenticated') return 'allow'
	if (status === 'guest') return 'allow'
	return 'sign-in'
}
