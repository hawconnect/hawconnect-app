import { useNavigation, useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Linking, Platform, Text, View } from 'react-native'
import { loginSite } from '@/api/login-site'
import Button from '@/components/Universal/button'
import { useAccountStore } from '@/hooks/useAccountStore'
import {
	cancelAccountSwitch,
	discardPreviousAccount,
	retryAccountProfile
} from '@/hooks/useAccountSync'
import { useAccountLifecycleStore } from '@/hooks/useAccountSyncStore'
import {
	canLeaveConfirmation,
	readSignInLink,
	type SignInLinkError
} from '@/utils/auth-confirm'
import { legacyLinkTarget } from '@/utils/login-site'
import {
	claimInitialNativeSignIn,
	type NativeSignInLink,
	subscribeNativeSignIn,
	takeNativeSignIn
} from '@/utils/native-sign-in-link'
import { takeReturnPath } from '@/utils/return-path'
import { appStorage } from '@/utils/storage'
import AccountCacheRecovery from './cache-recovery'

export default function ConfirmScreen(): React.JSX.Element {
	const { t } = useTranslation('account')
	const router = useRouter()
	const navigation = useNavigation()
	const capturedWebLink = useRef(false)
	const capturedNativeLink = useRef(false)
	const initialNativeURL = useRef<Promise<string | null> | null>(null)
	/** Taken once: the stored return path is cleared on read, so a re-run must not read again. */
	const leaveTarget = useRef<string | null>(null)
	const [linkRead, setLinkRead] = useState(false)
	const [recoveryError, setRecoveryError] = useState(false)
	/** An old confirm or reset link was sent on to the login site. */
	const [forwarded, setForwarded] = useState(false)
	const status = useAccountStore((s) => s.status)
	const userId = useAccountStore((s) => s.user?.id ?? null)
	const readyProfile = useAccountLifecycleStore((s) => s.readyProfile)
	const profileError = useAccountLifecycleStore((s) => s.error)
	const switchBlocked = useAccountLifecycleStore((s) => s.switchBlocked)
	const [busy, setBusy] = useState(false)
	const [error, setError] = useState<SignInLinkError>('')
	useEffect(() => {
		let active = true
		const applyLink = (
			result: Pick<NativeSignInLink, 'token' | 'error'> & { url?: string }
		) => {
			if (!active) return
			const target = result.url
				? legacyLinkTarget(result.url, loginSite.login)
				: null
			setLinkRead(true)
			if (target) {
				// Confirm and reset now happen on the login site (no lock-out for old emails).
				setForwarded(true)
				setError('')
				if (Platform.OS === 'web') window.location.replace(target)
				else void WebBrowser.openBrowserAsync(target).catch(() => {})
				return
			}
			// The old sign-in link (no kind) no longer signs in.
			setError(result.token ? 'invalidLink' : result.error)
		}
		const read = (url: string) => applyLink({ ...readSignInLink(url), url })
		if (Platform.OS === 'web') {
			const clearFragment = () => {
				// Clear the screen navigation state too: the router otherwise
				// restores its initial hash after hydration. Use an empty string
				// because Expo Router serializes undefined as "#undefined".
				navigation.dispatch({
					type: 'SET_PARAMS',
					payload: { params: { '#': '' } }
				})
				window.history.replaceState(
					window.history.state,
					'',
					window.location.pathname + window.location.search
				)
			}
			const capture = () => {
				if (!capturedWebLink.current || window.location.hash) {
					capturedWebLink.current = true
					read(window.location.href)
					clearFragment()
				}
			}
			// Email clients can open a second link in this same browser tab.
			window.addEventListener('hashchange', capture)
			capture()
			return () => {
				active = false
				window.removeEventListener('hashchange', capture)
			}
		}
		let received = capturedNativeLink.current
		const capturePending = () => {
			const queued = takeNativeSignIn()
			if (!queued) return
			received = true
			capturedNativeLink.current = true
			applyLink(queued)
		}
		const unsubscribe = subscribeNativeSignIn(capturePending)
		capturePending()

		if (!received) {
			if (!initialNativeURL.current && claimInitialNativeSignIn())
				initialNativeURL.current = Linking.getInitialURL().then(
					(url) => url ?? null
				)
			if (initialNativeURL.current) {
				void initialNativeURL.current
					.then((url) => {
						if (active && !received) {
							capturedNativeLink.current = true
							read(url ?? 'hawconnect://auth-confirm')
						}
					})
					.catch(() => {
						if (active && !received) {
							capturedNativeLink.current = true
							setLinkRead(true)
							setError('invalidLink')
						}
					})
			} else {
				capturedNativeLink.current = true
				applyLink({ token: '', error: 'missingLink' })
			}
		}
		return () => {
			active = false
			unsubscribe()
		}
	}, [navigation])
	useEffect(() => {
		// A forwarded link stays here: the login site is open on top (native) or loading (web).
		if (forwarded) return
		if (
			canLeaveConfirmation({
				linkRead,
				token: '',
				status,
				userId,
				readyProfile,
				error
			})
		) {
			leaveTarget.current ??= takeReturnPath(appStorage) ?? '/(tabs)'
			router.replace(
				leaveTarget.current as Parameters<typeof router.replace>[0]
			)
		}
	}, [linkRead, status, userId, readyProfile, error, router, forwarded])
	async function recover(action: () => Promise<void>) {
		if (busy) return
		setBusy(true)
		setRecoveryError(false)
		try {
			await action()
		} catch {
			setRecoveryError(true)
		} finally {
			setBusy(false)
		}
	}
	if (
		linkRead &&
		!forwarded &&
		status === 'authenticated' &&
		error !== 'invalidLink'
	)
		return (
			<View
				testID="auth-confirm-finishing"
				className="flex-1 bg-background p-page gap-4 items-center justify-center"
			>
				{!profileError && !switchBlocked && <ActivityIndicator />}
				<Text className="text-text">
					{t(
						profileError
							? 'profileLoadFailed'
							: switchBlocked
								? 'switchBlocked'
								: 'completingSignIn'
					)}
				</Text>
				{!!profileError && (
					<>
						<Text
							testID="auth-confirm-profile-diagnostic"
							className="text-label"
							selectable
						>
							{t('profileDiagnostic', { code: profileError })}
						</Text>
						<Button
							disabled={busy}
							onPress={() => void recover(retryAccountProfile)}
						>
							{t('retry')}
						</Button>
						<AccountCacheRecovery />
					</>
				)}
				{recoveryError && (
					<Text accessibilityRole="alert" className="text-notification">
						{t('unavailable')}
					</Text>
				)}
				{switchBlocked && (
					<>
						<Button
							disabled={busy}
							onPress={() => void recover(discardPreviousAccount)}
						>
							{t('discardPrevious')}
						</Button>
						<Button
							disabled={busy}
							variant="secondary"
							onPress={() => {
								void recover(async () => {
									await cancelAccountSwitch()
									router.replace('/login')
								})
							}}
						>
							{t('backToSignIn')}
						</Button>
					</>
				)}
			</View>
		)
	return (
		<View
			testID="auth-confirm-screen"
			className="flex-1 bg-background p-page gap-4"
		>
			<View className="bg-card border-hairline border-border shadow-card rounded-md p-card gap-4 max-w-[600px] w-full self-center">
				{!linkRead || (forwarded && Platform.OS === 'web') ? (
					<ActivityIndicator />
				) : null}
				{forwarded && (
					<Text className="text-label">{t('linkOpensLoginSite')}</Text>
				)}
				{forwarded && Platform.OS !== 'web' && (
					<Button
						testID="auth-confirm-continue"
						onPress={() =>
							router.replace(status === 'authenticated' ? '/(tabs)' : '/login')
						}
					>
						{t('continue')}
					</Button>
				)}
				{!!error && !forwarded && (
					<>
						<Text accessibilityRole="alert" className="text-notification">
							{t(error)}
						</Text>
						<Button
							testID="auth-confirm-request-link"
							variant="secondary"
							disabled={busy}
							onPress={() => router.replace('/login')}
						>
							{t('requestNewLink')}
						</Button>
					</>
				)}
			</View>
		</View>
	)
}
