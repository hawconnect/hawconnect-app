import { Tabs } from 'expo-router'
import { BottomTabBar } from 'expo-router/js-tabs'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { useWindowDimensions } from 'react-native'
import { useCSSVariable } from 'uniwind'
import { SettingsTabButton } from '@/components/Settings/tab-button'
import PlatformIcon from '@/components/Universal/icon'
import { toColor } from '@/utils/uniwind-utils'
import SideRail from './side-rail.web'
import { SIDE_RAIL_MIN_WIDTH } from './sidebar-breakpoint'

const TabLayout = (): JSX.Element => {
	const primaryColor = String(
		toColor(useCSSVariable('--color-primary')) ?? '#40296c'
	)
	const primaryBackgroundColor = String(
		toColor(useCSSVariable('--color-primary-background')) ?? '#40296c15'
	)
	const labelColor = String(
		toColor(useCSSVariable('--color-label')) ?? '#606062'
	)
	const cardColor = String(toColor(useCSSVariable('--color-card')) ?? '#ffffff')
	const { t } = useTranslation('navigation')
	const { width } = useWindowDimensions()
	const isMobile = width < SIDE_RAIL_MIN_WIDTH

	return (
		<Tabs
			tabBar={(props) =>
				isMobile ? <BottomTabBar {...props} /> : <SideRail {...props} />
			}
			screenOptions={{
				tabBarPosition: isMobile ? 'bottom' : 'left',
				tabBarActiveTintColor: primaryColor,
				tabBarActiveBackgroundColor: primaryBackgroundColor,
				tabBarInactiveTintColor: labelColor,
				tabBarStyle: { backgroundColor: cardColor },
				tabBarIconStyle: {
					marginTop: isMobile ? 4 : 0
				},
				tabBarLabelStyle: {
					paddingTop: 0
				},
				tabBarShowLabel: false,
				tabBarVariant: 'uikit'
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: t('navigation.home'),
					headerShown: false,
					tabBarIcon: ({ color, size, focused }) => (
						<PlatformIcon
							ios={{
								name: 'house',
								variant: focused ? 'fill' : 'outline',
								size: size
							}}
							android={{
								name: 'home',
								size
							}}
							web={{
								name: 'House',
								size: size - 2
							}}
							style={{
								color
							}}
						/>
					)
				}}
			/>

			<Tabs.Screen
				name="timetable"
				options={{
					headerShown: false,
					title: t('navigation.timetable'),
					tabBarIcon: ({ color, size, focused }) => (
						<PlatformIcon
							ios={{
								name: 'clock',
								variant: focused ? 'fill' : 'outline',

								size: size
							}}
							android={{
								name: 'calendar_month',
								size
							}}
							web={{
								name: 'Clock',
								size: size - 2
							}}
							style={{
								color
							}}
						/>
					)
				}}
			/>

			<Tabs.Screen
				name="map"
				options={{
					title: t('navigation.map'),
					headerShown: false,
					tabBarIcon: ({ color, size, focused }) => (
						<PlatformIcon
							ios={{
								name: 'map',
								size: size,
								variant: focused ? 'fill' : 'outline'
							}}
							android={{
								name: 'map',
								size
							}}
							web={{
								name: 'Map',
								size: size - 2
							}}
							style={{
								color
							}}
						/>
					)
				}}
			/>

			<Tabs.Screen
				name="food"
				options={{
					title: t('navigation.food'),
					headerShown: false,
					tabBarLabel: t('navigation.food'),
					tabBarIcon: ({ color, size, focused }) => (
						<PlatformIcon
							ios={{
								name: 'fork.knife',
								variant: focused ? 'fill' : 'outline',

								size: size
							}}
							android={{
								name: 'restaurant',
								size
							}}
							web={{
								name: 'Utensils',
								size: size - 2
							}}
							style={{
								color
							}}
						/>
					)
				}}
			/>
			<Tabs.Screen
				name="settings"
				options={{
					title: t('navigation.profile'),
					headerShown: false,
					tabBarLabel: t('navigation.profile'),
					tabBarIcon: ({ color, size, focused }) => (
						<SettingsTabButton color={color} size={size} focused={focused} />
					)
				}}
			/>
		</Tabs>
	)
}

export default TabLayout
