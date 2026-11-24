import { isAuthCallbackPath } from '@/utils/login-site'

/**
 * The login site's native return URL is for expo-auth-session (Android delivers
 * it as a normal deep link too). `null` keeps the current screen, so the
 * router does not open an unmatched `/auth/callback` page. Other links are unchanged.
 */
export function redirectSystemPath({
	path
}: {
	path: string
	initial: boolean
}): string | null {
	try {
		return isAuthCallbackPath(path) ? null : path
	} catch {
		return path
	}
}
