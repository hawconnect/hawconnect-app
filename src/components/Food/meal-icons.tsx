import { Image } from 'expo-image'
import type React from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
	type GestureResponderEvent,
	Modal,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	View
} from 'react-native'
import { useCSSVariable } from 'uniwind'
import deFood from '@/localization/de/food.json'
import enFood from '@/localization/en/food.json'
import { type MealIconStem, mealIconKeys } from '@/utils/food-filter'
import { toColor } from '@/utils/uniwind-utils'

/** The Studierendenwerk's own meal icons, bundled with the app. */
const ICON_SOURCES: Record<MealIconStem, number> = {
	vega: require('../../../assets/food-icons/vega.svg'),
	vege: require('../../../assets/food-icons/vege.svg'),
	fish: require('../../../assets/food-icons/fish.svg'),
	pork: require('../../../assets/food-icons/pork.svg'),
	beef: require('../../../assets/food-icons/beef.svg'),
	poul: require('../../../assets/food-icons/poul.svg'),
	lamb: require('../../../assets/food-icons/lamb.svg'),
	game: require('../../../assets/food-icons/game.svg'),
	alc: require('../../../assets/food-icons/alc.svg'),
	gela: require('../../../assets/food-icons/gela.svg'),
	lact: require('../../../assets/food-icons/lact.svg'),
	fave: require('../../../assets/food-icons/fave.svg'),
	new: require('../../../assets/food-icons/new.svg'),
	vita: require('../../../assets/food-icons/vita.svg')
}

type IconInfo = { title: string; text: string }
const ICON_INFO: Record<
	'de' | 'en',
	Partial<Record<MealIconStem, IconInfo>>
> = { de: deFood.iconInfo, en: enFood.iconInfo }

/** The meal card around the icons is a link: keep taps here from opening it. */
const keepInside = (event: GestureResponderEvent) => {
	event.preventDefault()
	event.stopPropagation()
}

interface MealIconsProps {
	icons: readonly string[] | null | undefined
	size?: number
}

/**
 * Tapping an icon opens the Studierendenwerk's own explanation of it
 * (copied from its menu page). Icons the page doesn't explain show their
 * name only.
 */
export function MealIcons({
	icons,
	size = 24
}: MealIconsProps): React.JSX.Element | null {
	const { t, i18n } = useTranslation('food')
	const [open, setOpen] = useState<MealIconStem | null>(null)
	// The modal renders outside the themed tree on web, so colours are passed explicitly.
	const card = String(
		toColor(useCSSVariable('--color-card') as never) ?? '#ffffff'
	)
	const textColor = String(
		toColor(useCSSVariable('--color-text') as never) ?? '#1c1c1e'
	)
	const primary = String(
		toColor(useCSSVariable('--color-primary') as never) ?? '#40296c'
	)
	const keys = mealIconKeys(icons)
	if (keys.length === 0) return null
	const lang = i18n.language.startsWith('de') ? 'de' : 'en'
	const title = (key: MealIconStem) =>
		ICON_INFO[lang][key]?.title ?? t(`icons.${key}`)
	const text = (key: MealIconStem) => ICON_INFO[lang][key]?.text ?? ''
	return (
		<View className="flex-row flex-wrap items-center gap-1.5">
			{keys.map((key) => (
				<Pressable
					key={key}
					testID={`meal-icon-${key}`}
					// On web the card itself is a <button>; a nested <button> is invalid HTML.
					accessibilityRole={Platform.OS === 'web' ? undefined : 'button'}
					accessibilityLabel={t(`icons.${key}`)}
					accessibilityHint={t('iconInfoHint')}
					hitSlop={6}
					onPress={(event) => {
						keepInside(event)
						setOpen(key)
					}}
					className="active:opacity-60"
				>
					<Image
						source={ICON_SOURCES[key]}
						contentFit="contain"
						style={{ width: size, height: size }}
					/>
				</Pressable>
			))}
			<Modal
				visible={open !== null}
				transparent
				animationType={Platform.OS === 'web' ? 'none' : 'fade'}
				onRequestClose={() => setOpen(null)}
			>
				<View className="flex-1 items-center justify-center px-6">
					{/* Behind the card as a sibling, not its parent: a <button> may not hold the Close <button>. */}
					<Pressable
						accessibilityRole="button"
						accessibilityLabel={t('iconInfoClose')}
						onPress={(event) => {
							keepInside(event)
							setOpen(null)
						}}
						style={[
							StyleSheet.absoluteFill,
							{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }
						]}
					/>
					{open && (
						<Pressable
							testID="meal-icon-info"
							accessibilityViewIsModal
							onPress={keepInside}
							className="w-full max-w-[420px] rounded-2xl p-5 gap-3"
							style={{ backgroundColor: card }}
						>
							<Image
								source={ICON_SOURCES[open]}
								contentFit="contain"
								style={{ width: 64, height: 64 }}
							/>
							<Text
								accessibilityRole="header"
								className="text-lg font-semibold"
								style={{ color: textColor }}
							>
								{title(open)}
							</Text>
							{text(open) !== '' && (
								<Text
									className="text-base leading-6"
									style={{ color: textColor }}
								>
									{text(open)}
								</Text>
							)}
							<Pressable
								accessibilityRole="button"
								onPress={(event) => {
									keepInside(event)
									setOpen(null)
								}}
								className="self-end py-2 px-3 active:opacity-60"
							>
								<Text
									className="text-base font-medium"
									style={{ color: primary }}
								>
									{t('iconInfoClose')}
								</Text>
							</Pressable>
						</Pressable>
					)}
				</View>
			</Modal>
		</View>
	)
}
