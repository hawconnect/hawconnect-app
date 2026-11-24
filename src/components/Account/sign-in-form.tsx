import { useLocalSearchParams, usePathname, useRouter } from 'expo-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, Platform, Pressable, Text, View } from 'react-native'
import { AccountAPIError } from '@/api/account-api'
import Button from '@/components/Universal/button'
import { useAccountStore } from '@/hooks/useAccountStore'
import { legalUrl } from '@/utils/legal-links'
import { webReturnPath } from '@/utils/login-site'
import { takeReturnPath } from '@/utils/return-path'
import { appStorage } from '@/utils/storage'

/** Sign-in and account creation happen on the login site; this card only starts it. */
export default function AccountSignInForm({
	navigateHome
}: {
	navigateHome: () => void
}): React.JSX.Element {
	const path = usePathname()
	const router = useRouter()
	const { t, i18n } = useTranslation('account')
	// The API sends web visitors back to /login?error=sign-in-failed.
	const { error: errorParam } = useLocalSearchParams<{ error?: string }>()
	const [busy, setBusy] = useState(false)
	const [failed, setFailed] = useState(false)
	const webFailed =
		Platform.OS === 'web' &&
		path === '/login' &&
		errorParam === 'sign-in-failed'

	async function signIn() {
		if (busy) return
		setFailed(false)
		setBusy(true)
		try {
			if (Platform.OS === 'web') {
				// Web reads the stored path now, because the page is left.
				await useAccountStore
					.getState()
					.signIn(webReturnPath(takeReturnPath(appStorage), path))
				return
			}
			const outcome = await useAccountStore.getState().signIn()
			// The confirm screen finishes loading the account, then returns to the stored path.
			if (outcome === 'signed-in') router.replace('/auth-confirm')
		} catch (e) {
			if (!(e instanceof AccountAPIError && e.code === 'AuthCancelled'))
				setFailed(true)
		} finally {
			setBusy(false)
		}
	}

	return (
		<View className="items-center justify-center w-full">
			<View
				testID="account-login-form"
				className="w-full max-w-[400px] self-center pb-[30px] px-[25px] pt-[30px] bg-card rounded-md border-hairline border-border shadow-card"
			>
				<Text
					accessibilityRole="header"
					className="w-full text-text text-[28px] font-bold text-center mb-2"
				>
					{t('getStarted')}
				</Text>
				{(webFailed || failed) && (
					<Text
						testID="login-error"
						className="text-notification mt-2 text-center"
						accessibilityRole="alert"
					>
						{t('signInFailed')}
						{webFailed ? ` ${t('signInFailedTwoTabs')}` : ''}
					</Text>
				)}
				<Button
					testID="login-submit"
					onPress={() => void signIn()}
					disabled={busy}
					loading={busy}
					style={{ marginTop: 20, width: '100%' }}
				>
					{t('signInOrCreate')}
				</Button>
				<View className="w-full flex-row items-center mt-5">
					<View className="flex-1 h-hairline bg-border" />
					<Text className="text-label mx-2.5 text-[13px]">{t('or')}</Text>
					<View className="flex-1 h-hairline bg-border" />
				</View>
				<Pressable
					testID="login-guest"
					accessibilityRole="button"
					disabled={busy}
					className="w-full items-center pt-1.5 mt-3.5"
					onPress={() => {
						useAccountStore.getState().continueAsGuest()
						if (path === '/login') navigateHome()
					}}
				>
					<Text className="text-label text-sm font-normal">{t('guest')}</Text>
				</Pressable>
				<Text
					testID="login-legal"
					className="text-label text-xs text-center mt-5 leading-5"
				>
					{t('legal.before')}
					<Text
						accessibilityRole="link"
						className="text-label underline"
						onPress={() =>
							void Linking.openURL(legalUrl('terms', i18n.language))
						}
					>
						{t('legal.terms')}
					</Text>
					{t('legal.between')}
					<Text
						accessibilityRole="link"
						className="text-label underline"
						onPress={() =>
							void Linking.openURL(legalUrl('privacy', i18n.language))
						}
					>
						{t('legal.privacy')}
					</Text>
					{t('legal.after')}
				</Text>
			</View>
		</View>
	)
}
