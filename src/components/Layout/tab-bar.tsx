import Color from 'color'
import { NativeTabs } from 'expo-router/unstable-native-tabs'
import type React from 'react'
import { useTranslation } from 'react-i18next'
import { Platform, useColorScheme } from 'react-native'
import { useCSSVariable } from 'uniwind'
import { usePreferencesStore } from '@/hooks/usePreferencesStore'
import { resolveActiveTheme } from '@/utils/theme-utils'
import { toColor } from '@/utils/uniwind-utils'

// Tabler icons as black-on-transparent PNGs; the OS tints them. Regenerate with
// `bun scripts/render-tabbar-icons.ts`.
const tabIcons = {
	home: require('@/assets/tabbar/home.png'),
	timetable: require('@/assets/tabbar/timetable.png'),
	map: require('@/assets/tabbar/map.png'),
	food: require('@/assets/tabbar/food.png'),
	profile: require('@/assets/tabbar/profile.png')
}

const Icon = NativeTabs.Trigger.Icon
const Label = NativeTabs.Trigger.Label

export default function TabLayout(): React.JSX.Element {
	const themePreference = usePreferencesStore((state) => state.theme)
	const colorScheme = useColorScheme()
	const isDark = resolveActiveTheme(themePreference, colorScheme) === 'dark'
	const primaryColor = String(
		toColor(useCSSVariable('--color-primary')) ?? '#40296c'
	)
	const cardColor = String(toColor(useCSSVariable('--color-card')) ?? '#ffffff')
	const tabbarInactiveColor = String(
		toColor(useCSSVariable('--color-tabbar-inactive')) ?? '#999999'
	)
	const { t } = useTranslation('navigation')
	const isIos26 =
		Platform.OS === 'ios' && Number.parseInt(Platform.Version, 10) >= 26
	const isAndroid = Platform.OS === 'android'
	const androidIndicatorColor = isDark
		? Color(cardColor).mix(Color(primaryColor), 0.22).hex()
		: Color(cardColor)
				.mix(Color(primaryColor), 0.3)
				.darken(0.05)
				.saturate(0.1)
				.hex()
	// Unset ripple falls back to Material dynamic primary (often light blue).
	const androidRippleColor = Color(primaryColor)
		.alpha(isDark ? 0.14 : 0.12)
		.rgb()
		.string()
	const androidBackgroundColor = isDark
		? Color(cardColor).mix(Color(primaryColor), 0.04).hex()
		: Color(cardColor).mix(Color(primaryColor), 0.1).hex()

	return (
		<NativeTabs
			badgeBackgroundColor={primaryColor}
			iconColor={tabbarInactiveColor}
			tintColor={primaryColor}
			indicatorColor={isAndroid ? androidIndicatorColor : undefined}
			rippleColor={isAndroid ? androidRippleColor : undefined}
			labelVisibilityMode="labeled"
			backgroundColor={isAndroid ? androidBackgroundColor : cardColor}
			disableTransparentOnScrollEdge={!isIos26}
		>
			<NativeTabs.Trigger name="index">
				<Label>{t('navigation.home')}</Label>
				<Icon
					src={tabIcons.home}
					renderingMode="template"
					selectedColor={primaryColor}
				/>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="timetable">
				<Label>{t('navigation.timetable')}</Label>
				<Icon
					src={tabIcons.timetable}
					renderingMode="template"
					selectedColor={primaryColor}
				/>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="map">
				<Label>{t('navigation.map')}</Label>
				<Icon
					src={tabIcons.map}
					renderingMode="template"
					selectedColor={primaryColor}
				/>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="food">
				<Label>{t('navigation.food')}</Label>
				<Icon
					src={tabIcons.food}
					renderingMode="template"
					selectedColor={primaryColor}
				/>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="settings">
				<Label>{t('navigation.profile')}</Label>
				<Icon
					src={tabIcons.profile}
					renderingMode="template"
					selectedColor={primaryColor}
				/>
			</NativeTabs.Trigger>
		</NativeTabs>
	)
}
