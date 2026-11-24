import { router, Stack, useLocalSearchParams } from 'expo-router'
import type React from 'react'
import { useTranslation } from 'react-i18next'
import {
	Linking,
	Platform,
	RefreshControl,
	ScrollView,
	Text,
	View
} from 'react-native'
import { useCSSVariable } from 'uniwind'
import ErrorView from '@/components/Error/error-view'
import { OpenStateBadge } from '@/components/Food/cafeteria-card'
import FormList from '@/components/Universal/form-list'
import { linkIcon } from '@/components/Universal/icon'
import LoadingIndicator from '@/components/Universal/loading-indicator'
import { HAW_CAMPUSES } from '@/data/haw-campuses'
import { useRefreshByUser } from '@/hooks'
import { useCafeterias } from '@/hooks/useCafeterias'
import { useFoodFilterStore } from '@/hooks/useFoodFilterStore'
import { useTransparentHeaderPadding } from '@/hooks/useTransparentHeader'
import type { FormListSections } from '@/types/components'
import type { MaterialIcon } from '@/types/material-icons'
import { networkError } from '@/utils/api-utils'
import { openState } from '@/utils/cafeteria-hours'
import { offerIcon } from '@/utils/cafeteria-offers'
import {
	cafeteriaMapHref,
	directionsUrl,
	selectionWithRestaurant
} from '@/utils/cafeterias'
import { foodRestaurantLocations } from '@/utils/food-utils'
import { ServiceStatus } from '@/utils/gatus-status'
import { toColor } from '@/utils/uniwind-utils'

const openUrl = (url: string) => {
	void Linking.openURL(url).catch(() => {})
}

export default function CafeteriaDetailScreen(): React.JSX.Element {
	const { id } = useLocalSearchParams<{ id: string }>()
	const { t, i18n } = useTranslation('food')
	const primaryColor = toColor(useCSSVariable('--color-primary'))
	const { data, isLoading, isError, isPaused, isSuccess, refetch } =
		useCafeterias()
	const { isRefetchingByUser, refetchByUser } = useRefreshByUser(refetch)
	const paddingTop = useTransparentHeaderPadding() + 12
	const language = i18n.language.startsWith('de') ? 'de' : 'en'
	const cafeteria = data?.find((entry) => entry.id === id)
	const selectedRestaurants = useFoodFilterStore(
		(state) => state.selectedRestaurants
	)
	const toggleSelectedRestaurant = useFoodFilterStore(
		(state) => state.toggleSelectedRestaurant
	)

	if (isLoading && !isRefetchingByUser)
		return (
			<View className="flex-1 items-center justify-center">
				<LoadingIndicator />
			</View>
		)
	if (cafeteria == null) {
		const failed = isError || (isPaused && !isSuccess)
		return (
			<ErrorView
				title={failed ? networkError : t('cafeterias.unavailable')}
				statusServices={failed ? ServiceStatus.Backend : undefined}
				onRefresh={refetchByUser}
				refreshing={isRefetchingByUser}
			/>
		)
	}

	const campusName =
		HAW_CAMPUSES.find((campus) => campus.label === cafeteria.campus)?.name[
			language
		] ?? cafeteria.campus
	const mapHref = cafeteriaMapHref(
		cafeteria.id,
		cafeteria.campus,
		foodRestaurantLocations
	)
	const hoursItems = (lines: typeof cafeteria.general) =>
		lines.map((line) => ({
			title: line.days,
			value: line.time,
			selectable: true
		}))

	const sections: FormListSections[] = cafeteria.available
		? [
				...(cafeteria.offers.length > 0
					? [
							{
								header: t('cafeterias.offers'),
								items: cafeteria.offers.map((offer) => {
									const icon = offerIcon(offer.key)
									return {
										title: offer.title,
										icon: {
											ios: icon.ios,
											android: icon.android as MaterialIcon,
											web: icon.web
										},
										iconColor: primaryColor
									}
								})
							}
						]
					: []),
				...(cafeteria.address.length > 0
					? [
							{
								header: t('cafeterias.address'),
								items: [
									{
										testID: 'cafeteria-address',
										title: cafeteria.address.join('\n'),
										copyable: cafeteria.address.join(', ')
									},
									{
										testID: 'cafeteria-directions',
										title: t('cafeterias.directions'),
										icon: {
											ios: 'arrow.triangle.turn.up.right.diamond',
											android: 'directions' as MaterialIcon,
											web: 'Navigation' as const
										},
										onPress: () =>
											openUrl(
												directionsUrl(cafeteria.address, Platform.OS === 'ios')
											)
									},
									...(mapHref != null
										? [
												{
													testID: 'cafeteria-show-on-map',
													title: t('cafeterias.showOnMap'),
													icon: {
														ios: 'map',
														android: 'map' as MaterialIcon,
														web: 'Map' as const
													},
													onPress: () => {
														router.dismissTo(mapHref)
													}
												}
											]
										: [])
								]
							}
						]
					: []),
				...(cafeteria.general.length > 0
					? [
							{
								header: t('cafeterias.openingHours'),
								items: hoursItems(cafeteria.general)
							}
						]
					: []),
				...(cafeteria.distribution.length > 0
					? [
							{
								header: t('cafeterias.distribution'),
								items: hoursItems(cafeteria.distribution)
							}
						]
					: [])
			]
		: []

	sections.push({
		items: [
			...(cafeteria.hasMenu
				? [
						{
							testID: 'cafeteria-menu',
							title: t('cafeterias.todaysMenu'),
							icon: {
								ios: 'fork.knife',
								android: 'restaurant' as MaterialIcon,
								web: 'Utensils' as const
							},
							onPress: () => {
								// The user asked for this menu, so make sure the Food tab shows it.
								if (
									selectionWithRestaurant(selectedRestaurants, cafeteria.id) !==
									selectedRestaurants
								) {
									toggleSelectedRestaurant(cafeteria.id)
								}
								router.dismissTo('/(tabs)/food')
							}
						}
					]
				: []),
			{
				testID: 'cafeteria-source-link',
				title: t('cafeterias.moreOn'),
				icon: { ...linkIcon, web: 'ExternalLink' as const },
				onPress: () => openUrl(cafeteria.sourceUrl)
			}
		]
	})

	return (
		<>
			<Stack.Screen options={{ title: cafeteria.name }} />
			<ScrollView
				testID="cafeteria-detail-screen"
				className="flex-1"
				contentContainerClassName="px-page pb-bottom-safe gap-4 w-full max-w-[700px] self-center"
				contentContainerStyle={{ paddingTop }}
				refreshControl={
					<RefreshControl
						refreshing={isRefetchingByUser}
						onRefresh={refetchByUser}
					/>
				}
			>
				<View className="gap-1">
					<Text
						accessibilityRole="header"
						className="text-text text-2xl font-bold"
					>
						{cafeteria.name}
					</Text>
					<View className="flex-row items-center gap-2">
						<Text className="text-label text-base">{campusName}</Text>
						<OpenStateBadge state={openState(cafeteria.general, new Date())} />
					</View>
				</View>
				{!cafeteria.available && (
					<Text testID="cafeteria-unavailable" className="text-label text-sm">
						{t('cafeterias.unavailable')}
					</Text>
				)}
				{cafeteria.available && cafeteria.germanOnly && (
					<Text testID="cafeteria-german-only" className="text-label text-sm">
						{t('cafeterias.germanOnly')}
					</Text>
				)}
				{cafeteria.available && !!cafeteria.description && (
					<Text selectable className="text-text text-base leading-6">
						{cafeteria.description}
					</Text>
				)}
				<FormList sections={sections} />
			</ScrollView>
		</>
	)
}
