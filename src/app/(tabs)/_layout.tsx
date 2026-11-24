import Aptabase from '@aptabase/react-native'
import { getAppIconName, resetAppIcon } from 'expo-alternate-app-icons'
import Constants from 'expo-constants'
import * as QuickActions from 'expo-quick-actions'
import { useRouter } from 'expo-router'
import type React from 'react'
import { use, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform } from 'react-native'
import { UserKindContext } from '@/components/contexts'
import TabLayout from '@/components/Layout/tab-bar'
import { USER_GUEST } from '@/data/constants'
import { useFlowStore } from '@/hooks/useFlowStore'
import { useFoodFilterStore } from '@/hooks/useFoodFilterStore'
import { useSessionStore } from '@/hooks/useSessionStore'
import { humanLocations } from '@/utils/food-utils'

export default function HomeLayout(): React.JSX.Element {
	const router = useRouter()

	const { t } = useTranslation('navigation')
	const selectedRestaurants = useFoodFilterStore(
		(state) => state.selectedRestaurants
	)
	const aptabaseKey: string | undefined = undefined

	const analyticsInitialized = useSessionStore(
		(state) => state.analyticsInitialized
	)
	const initializeAnalytics = useSessionStore(
		(state) => state.initializeAnalytics
	)
	const analyticsAllowed = useFlowStore((state) => state.analyticsAllowed)
	const { userKind: userKindInitial } = use(UserKindContext)
	const userKind = userKindInitial ?? USER_GUEST
	useEffect(() => {
		if (Platform.OS === 'web') {
			return
		}

		const shortcuts = [
			{
				id: 'timetable',
				title: t('navigation.timetable'),
				icon: Platform.OS === 'ios' ? 'symbol:calendar' : 'calendar',
				params: { href: '(tabs)/timetable' }
			},
			{
				id: 'food',
				title:
					selectedRestaurants.length !== 1
						? t('navigation.food')
						: humanLocations[
								selectedRestaurants[0] as keyof typeof humanLocations
							],
				icon: Platform.OS === 'ios' ? 'symbol:fork.knife' : 'food',
				params: { href: '(tabs)/food' }
			},
			{
				id: 'links',
				title: t('cards.titles.links'),
				icon: Platform.OS === 'ios' ? 'symbol:link' : 'link',
				params: { href: '/links' }
			},
			{
				id: 'login',
				title: t('navigation.login'),
				icon:
					Platform.OS === 'ios'
						? 'symbol:person.crop.circle.badge.questionmark'
						: 'account',
				params: { href: 'login' }
			}
		]

		QuickActions.setItems(shortcuts).catch(console.error)
	}, [selectedRestaurants, router, t, userKind])

	useEffect(() => {
		console.debug('Analytics allowed:', analyticsAllowed)
		if (
			aptabaseKey != null &&
			process.env.EXPO_PUBLIC_ANALYTICS_HOST &&
			analyticsAllowed === true
		) {
			Aptabase.init(aptabaseKey, {
				host: process.env.EXPO_PUBLIC_ANALYTICS_HOST,
				appVersion:
					Platform.OS === 'web'
						? `${Constants.expoConfig?.version}-web`
						: undefined,
				enableWeb: true
			})
			// we need to mark the analytics as initialized to trigger the initial events sent in provider.tsx
			initializeAnalytics()
			console.debug('Initialized analytics')
		} else if (
			aptabaseKey != null &&
			analyticsAllowed === false &&
			analyticsInitialized
		) {
			Aptabase.dispose()
			console.debug('Disposed analytics')
		} else {
			console.debug('Analytics not initialized / allowed')
		}
	}, [analyticsAllowed])
	useEffect(() => {
		if (Platform.OS === 'web') return
		// Alternate app icons were removed; return anyone still using one to the
		// default HAWConnect icon.
		if (getAppIconName()) void resetAppIcon().catch(() => undefined)
	}, [])

	return <TabLayout />
}
