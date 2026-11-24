import type React from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Text, View } from 'react-native'
import Button from '@/components/Universal/button'
import FormList from '@/components/Universal/form-list'
import { useMarketRules } from '@/hooks/useMarketplace'
import { marketErrorMessageKey } from '@/utils/marketplace-form'
import { errorText } from './market-labels'
import { InlineMessage, MarketSheet } from './market-ui'

interface RulesSheetProps {
	visible: boolean
	onAccepted: () => void
	onCancel: () => void
}

/** Community rules, shown once before the first post. */
export function RulesSheet({
	visible,
	onAccepted,
	onCancel
}: RulesSheetProps): React.JSX.Element {
	const { t } = useTranslation('marketplace')
	const { accept } = useMarketRules()
	const [error, setError] = useState('')
	const rules = [
		{
			title: t('marketplace.rules.illegal'),
			icon: { ios: 'scalemass', android: 'gavel', web: 'Scale' }
		},
		{
			title: t('marketplace.rules.agents'),
			icon: { ios: 'briefcase', android: 'work', web: 'Briefcase' }
		},
		{
			title: t('marketplace.rules.discrimination'),
			icon: { ios: 'hand.raised', android: 'front_hand', web: 'Hand' }
		},
		{
			title: t('marketplace.rules.honest'),
			icon: { ios: 'checkmark.seal', android: 'verified', web: 'BadgeCheck' }
		},
		{
			title: t('marketplace.rules.personalData'),
			icon: { ios: 'lock', android: 'lock', web: 'Lock' }
		}
	] as const
	return (
		<MarketSheet
			testID="marketplace-rules-sheet"
			visible={visible}
			title={t('marketplace.rules.title')}
			onClose={onCancel}
		>
			<View className="gap-4">
				<FormList
					sections={[
						{
							header: t('marketplace.rules.intro'),
							footer: t('marketplace.rules.note'),
							items: rules.map((rule) => ({
								title: rule.title,
								icon: { ...rule.icon }
							}))
						}
					]}
				/>
				<Text className="text-label text-xs text-center">
					{t('marketplace.notOfficial')}
				</Text>
				{error !== '' && <InlineMessage text={error} />}
				<Button
					testID="marketplace-rules-accept"
					loading={accept.isPending}
					disabled={accept.isPending}
					onPress={() => {
						setError('')
						accept.mutate(undefined, {
							onSuccess: onAccepted,
							onError: (e) => setError(errorText(t, marketErrorMessageKey(e)))
						})
					}}
				>
					{t('marketplace.rules.accept')}
				</Button>
				<Button variant="secondary" onPress={onCancel}>
					{t('marketplace.rules.cancel')}
				</Button>
			</View>
		</MarketSheet>
	)
}
