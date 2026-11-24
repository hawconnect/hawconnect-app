import { useRouter } from 'expo-router'
import type React from 'react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Linking, Platform, View } from 'react-native'
import { type LegalPage, legalUrl } from '@/utils/legal-links'

/**
 * Keeps old in-app addresses (/privacy, /imprint) working: on the web it
 * replaces the page with the hawconnect.de legal page, in the native apps it
 * opens that page in the browser and returns to the previous screen.
 */
export default function LegalRedirect({
	page
}: {
	page: LegalPage
}): React.JSX.Element {
	const router = useRouter()
	const { i18n } = useTranslation()
	const url = legalUrl(page, i18n.language)

	useEffect(() => {
		if (Platform.OS === 'web' && typeof window !== 'undefined') {
			window.location.replace(url)
			return
		}
		void Linking.openURL(url)
		if (router.canGoBack()) router.back()
		else router.replace('/')
	}, [router, url])

	return (
		<View className="flex-1 items-center justify-center bg-background">
			<ActivityIndicator />
		</View>
	)
}
