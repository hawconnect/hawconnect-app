import { router } from 'expo-router'
import type React from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, Text, View } from 'react-native'
import type { CafeteriasQuery } from '@/__generated__/gql/graphql'
import type { OpenState } from '@/utils/cafeteria-hours'
import { cardHours } from '@/utils/cafeterias'

export type Cafeteria = CafeteriasQuery['cafeterias'][number]

/** "Open now" / "Closed"; nothing when the hours are not known. */
export function OpenStateBadge({
	state
}: {
	state: OpenState
}): React.JSX.Element | null {
	const { t } = useTranslation('food')
	if (state === 'unknown') return null
	const open = state === 'open'
	return (
		<View
			testID="cafeteria-open-state"
			className={`rounded-infinite px-2.5 py-0.5 ${
				open ? 'bg-success/5' : 'bg-label-background'
			}`}
		>
			<Text
				className={`text-xs font-semibold ${open ? 'text-success' : 'text-label'}`}
			>
				{open ? t('cafeterias.openNow') : t('cafeterias.closed')}
			</Text>
		</View>
	)
}

/** A place in the "Cafés & mensas" list: name, address, today's hours. */
export function CafeteriaCard({
	cafeteria,
	now
}: {
	cafeteria: Cafeteria
	now: Date
}): React.JSX.Element {
	const { t } = useTranslation('food')
	const { state, lines } = cardHours(cafeteria.general, now)
	const label = [
		cafeteria.name,
		state === 'unknown'
			? undefined
			: state === 'open'
				? t('cafeterias.openNow')
				: t('cafeterias.closed'),
		cafeteria.address.length > 0 ? cafeteria.address.join(', ') : undefined,
		...lines.map((line) => `${line.days}: ${line.time}`)
	]
		.filter((part) => part != null)
		.join(', ')
	return (
		<Pressable
			testID="cafeteria-card"
			accessibilityRole="button"
			accessibilityLabel={label}
			accessibilityHint={t('cafeterias.open')}
			onPress={() =>
				router.push({
					pathname: '/cafeterias/[id]',
					params: { id: cafeteria.id }
				})
			}
			className="rounded-md bg-card border-hairline border-border shadow-card px-3.5 py-3.5 gap-1.5 active:opacity-90"
		>
			<View className="flex-row items-center gap-3">
				<Text
					className="flex-1 text-text text-base font-semibold"
					numberOfLines={2}
				>
					{cafeteria.name}
				</Text>
				<OpenStateBadge state={state} />
				<Text
					importantForAccessibility="no"
					accessibilityElementsHidden
					className="text-label text-xl leading-6"
				>
					›
				</Text>
			</View>
			{cafeteria.address.length > 0 && (
				<Text className="text-label text-sm" numberOfLines={1}>
					{cafeteria.address.join(', ')}
				</Text>
			)}
			{lines.map((line) => (
				<Text key={`${line.days}-${line.time}`} className="text-text text-sm">
					{line.days}: {line.time}
				</Text>
			))}
		</Pressable>
	)
}
