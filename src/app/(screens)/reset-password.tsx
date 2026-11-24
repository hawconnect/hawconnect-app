import { useNavigation, useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Linking, Platform, Text, View } from 'react-native'
import { loginSite } from '@/api/login-site'
import Button from '@/components/Universal/button'
import { legacyLinkTarget } from '@/utils/login-site'

/** Old emailed reset links (`/reset-password#token=…`) continue on the login site. */
export default function ResetPasswordRedirect(): React.JSX.Element {
	const { t } = useTranslation('account')
	const router = useRouter()
	const navigation = useNavigation()
	const [state, setState] = useState<'reading' | 'forwarded' | 'missing'>(
		'reading'
	)

	useEffect(() => {
		let active = true
		let forwarded = false
		const forward = (url: string | null | undefined) => {
			if (!active || forwarded) return
			const target = url ? legacyLinkTarget(url, loginSite.login) : null
			if (!target) {
				setState((current) => (current === 'forwarded' ? current : 'missing'))
				return
			}
			forwarded = true
			setState('forwarded')
			if (Platform.OS === 'web') window.location.replace(target)
			else void WebBrowser.openBrowserAsync(target).catch(() => {})
		}
		if (Platform.OS === 'web') {
			const href = window.location.href
			// Keep the token out of the address bar and browser history.
			navigation.dispatch({
				type: 'SET_PARAMS',
				payload: { params: { '#': '' } }
			})
			window.history.replaceState(
				window.history.state,
				'',
				window.location.pathname + window.location.search
			)
			forward(href)
			return
		}
		void Linking.getInitialURL()
			.then(forward)
			.catch(() => forward(null))
		const subscription = Linking.addEventListener('url', (e) => {
			forwarded = false
			forward(e.url)
		})
		return () => {
			active = false
			subscription.remove()
		}
	}, [navigation])

	return (
		<View
			testID="reset-password-screen"
			className="flex-1 bg-background p-page"
		>
			<View className="bg-card border-hairline border-border shadow-card rounded-md p-card gap-4 max-w-[600px] w-full self-center">
				{(state === 'reading' ||
					(state === 'forwarded' && Platform.OS === 'web')) && (
					<ActivityIndicator />
				)}
				{state !== 'reading' && (
					<Text className="text-label">
						{t(
							state === 'forwarded' ? 'linkOpensLoginSite' : 'resetLinkMissing'
						)}
					</Text>
				)}
				{(state === 'missing' ||
					(state === 'forwarded' && Platform.OS !== 'web')) && (
					<Button
						testID="reset-to-sign-in"
						variant="secondary"
						onPress={() => router.replace('/login')}
					>
						{t('backToSignIn')}
					</Button>
				)}
			</View>
		</View>
	)
}
