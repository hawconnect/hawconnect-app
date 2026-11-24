import type React from 'react'
import { useTranslation } from 'react-i18next'
import { Text, View } from 'react-native'
import type { useCanteens } from '@/hooks/useCanteens'

export type Canteen = NonNullable<
	ReturnType<typeof useCanteens>['data']
>[number]

interface OpeningLine {
	days: string
	time: string
}

function openingText(lines: readonly OpeningLine[] | undefined): string {
	return (lines ?? [])
		.map((line) => `${line.days} ${line.time}`.trim())
		.filter(Boolean)
		.join(' · ')
}

interface CanteenHeaderProps {
	canteen: Canteen | undefined
	name: string
}

/** Mensa name with the source's address and opening hours; empty parts are hidden. */
export function CanteenHeader({
	canteen,
	name
}: CanteenHeaderProps): React.JSX.Element {
	const { t } = useTranslation('food')
	const general = openingText(canteen?.general)
	const distribution = openingText(canteen?.distribution)
	const address = (canteen?.address ?? []).filter(Boolean)
	return (
		<View testID="canteen-header" className="pt-4 pb-1">
			<Text accessibilityRole="header" className="text-text text-lg font-bold">
				{canteen?.name || name}
			</Text>
			{address.map((line) => (
				<Text key={line} className="text-label text-sm">
					{line}
				</Text>
			))}
			{general !== '' && (
				<Text className="text-label text-sm mt-1">
					{t('header.general', { value: general })}
				</Text>
			)}
			{distribution !== '' && (
				<Text className="text-label text-sm">
					{t('header.distribution', { value: distribution })}
				</Text>
			)}
		</View>
	)
}
