import {
	AuthRequest,
	CodeChallengeMethod,
	ResponseType
} from 'expo-auth-session'
import { getRandomBytes } from 'expo-crypto'
import { Platform } from 'react-native'
import { AccountAPIError, accountAPI } from '@/api/account-api'
import {
	loginSiteURLs,
	nativeAuthorizeParams,
	signInOutcome,
	startWebSignIn
} from '@/utils/login-site'
import { appStorage } from '@/utils/storage'

// Written out one by one: Expo inlines only direct `process.env.EXPO_PUBLIC_*` reads.
export const loginSite = loginSiteURLs({
	EXPO_PUBLIC_HAWCONNECT_LOGIN_URL:
		process.env.EXPO_PUBLIC_HAWCONNECT_LOGIN_URL,
	EXPO_PUBLIC_HAWCONNECT_AUTH_URL: process.env.EXPO_PUBLIC_HAWCONNECT_AUTH_URL,
	EXPO_PUBLIC_HAWCONNECT_GRAPHQL_ENDPOINT:
		process.env.EXPO_PUBLIC_HAWCONNECT_GRAPHQL_ENDPOINT
})

const random = (bytes = 32) =>
	Array.from(getRandomBytes(bytes), (b) =>
		b.toString(16).padStart(2, '0')
	).join('')

/**
 * Web: leaves the app for the API's start route (the API redeems the code and
 * sets the session cookie). Native: opens the login site in a private sign-in
 * sheet, then the API exchanges the code for today's app session token.
 * Failures throw `AccountAPIError('SignInFailed')`.
 */
export async function signInWithLoginSite(
	returnPath = '/',
	isCurrent: () => boolean = () => true
): Promise<'signed-in' | 'cancelled'> {
	if (Platform.OS === 'web') {
		startWebSignIn(loginSite.start(returnPath), {
			clearGuestMode: () => appStorage.set('hawconnect-guest-mode', false),
			assign: (url) => window.location.assign(url)
		})
		return 'cancelled'
	}
	const { clientId, redirectUri, scopes } = loginSite.native
	const nonce = random()
	const request = new AuthRequest({
		clientId,
		redirectUri,
		scopes,
		responseType: ResponseType.Code,
		usePKCE: true,
		codeChallengeMethod: CodeChallengeMethod.S256,
		state: random(16),
		extraParams: nativeAuthorizeParams(nonce)
	})
	// expo-auth-session checks `state` and reports a mismatch as an error.
	const result = await request.promptAsync(
		{ authorizationEndpoint: loginSite.authorize },
		{ preferEphemeralSession: true }
	)
	const outcome = signInOutcome(
		{
			type: result.type,
			params: 'params' in result ? result.params : undefined
		},
		loginSite.login
	)
	if (outcome === 'cancelled') return 'cancelled'
	if (outcome === 'failed' || !('params' in result) || !request.codeVerifier)
		throw new AccountAPIError('SignInFailed')
	await accountAPI.exchangeCode(
		{
			code: result.params.code,
			codeVerifier: request.codeVerifier,
			redirectUri,
			nonce
		},
		isCurrent
	)
	return 'signed-in'
}
