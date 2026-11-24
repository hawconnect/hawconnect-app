import { useRouter } from 'expo-router'
import type React from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { useCSSVariable } from 'uniwind'
import Button from '@/components/Universal/button'
import PlatformIcon from '@/components/Universal/icon'
import { useAccountStore } from '@/hooks/useAccountStore'
import { marketplaceGateView } from '@/utils/marketplace'
import { saveReturnPath } from '@/utils/return-path'
import { appStorage } from '@/utils/storage'
import { toColor } from '@/utils/uniwind-utils'

/** Shown where an account is needed: posting, "My posts" and the report link. Browsing is public. */
export function SignInGate({
	returnPath,
	note
}: {
	/** Page to reopen after sign-in (only the report link is accepted). */
	returnPath?: string
	/** Replaces the general note where one reason is enough (e.g. creating a listing). */
	note?: string
}): React.JSX.Element {
	const { t } = useTranslation('marketplace')
	const router = useRouter()
	const primary = toColor(useCSSVariable('--color-primary'))
	return (
		<ScrollView
			testID="marketplace-sign-in-gate"
			className="flex-1 bg-background"
			contentInsetAdjustmentBehavior="automatic"
			contentContainerClassName="px-page pt-4 pb-10 w-full max-w-[600px] self-center"
		>
			<View className="bg-card ios:rounded-ios android:rounded-md web:rounded-md border-hairline border-border shadow-card px-4 py-[30px] items-center gap-4">
				<PlatformIcon
					ios={{ name: 'storefront', size: 34 }}
					android={{ name: 'storefront', size: 40 }}
					web={{ name: 'Store', size: 36 }}
					style={{ color: primary }}
				/>
				<Text className="text-text text-lg font-semibold text-center">
					{t('marketplace.gate.title')}
				</Text>
				<Text className="text-label text-sm text-center">
					{note ?? t('marketplace.gate.note')}
				</Text>
				<Button
					testID="marketplace-sign-in"
					onPress={() => {
						if (returnPath) saveReturnPath(appStorage, returnPath)
						router.navigate('/login')
					}}
					style={{ alignSelf: 'stretch' }}
				>
					{t('marketplace.gate.signIn')}
				</Button>
			</View>
		</ScrollView>
	)
}

/** Renders children only for a signed-in account. */
export function MarketplaceGate({
	children,
	returnPath,
	note
}: {
	children: React.JSX.Element
	returnPath?: string
	note?: string
}): React.JSX.Element {
	const view = useAccountStore((s) =>
		marketplaceGateView(s.status, s.user != null)
	)
	const primary = toColor(useCSSVariable('--color-primary'))
	if (view === 'loading')
		return (
			<View
				testID="marketplace-gate-loading"
				className="flex-1 bg-background items-center justify-center"
			>
				<ActivityIndicator color={primary} />
			</View>
		)
	return view === 'content' ? (
		children
	) : (
		<SignInGate returnPath={returnPath} note={note} />
	)
}
