import { trackEvent } from '@aptabase/react-native'
import { Link, router } from 'expo-router'
import type React from 'react'
import { memo, use, useDeferredValue, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform, Pressable, Text, View } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { useCSSVariable } from 'uniwind'
import { UserKindContext } from '@/components/contexts'
// @ts-expect-error - no types available
import DragDropView from '@/components/Exclusive/drag-view'
import ContextMenu from '@/components/Flow/context-menu'
import PlatformIcon from '@/components/Universal/icon'
import type { UserKindContextType } from '@/contexts/userKind'
import { USER_GUEST } from '@/data/constants'
import { useFoodFilterStore } from '@/hooks/useFoodFilterStore'
import type { LanguageKey } from '@/localization/i18n'
import type { Meal } from '@/types/hawconnect-api'
import { getFoodPriceKind, getMealRouteId } from '@/utils/food-display'
import { allergenInfoMissing } from '@/utils/food-filter'
import {
	convertRelevantAllergens,
	formatPrice,
	humanLocations,
	mealName,
	mealShareLink,
	shareMeal
} from '@/utils/food-utils'
import { mealWarningCodes } from '@/utils/hamburg-food-labels'
import { toColor } from '@/utils/uniwind-utils'
import { MealIcons } from './meal-icons'

export const MealEntry = memo(({ meal }: { meal: Meal }): React.JSX.Element => {
	const allergenSelection = useFoodFilterStore(
		(state) => state.allergenSelection
	)
	const foodLanguage = useFoodFilterStore((state) => state.foodLanguage)

	const deferredAllergens = useDeferredValue(allergenSelection)
	const deferredFoodLanguage = useDeferredValue(foodLanguage)

	const { t, i18n } = useTranslation('food')
	const notificationColor = toColor(useCSSVariable('--color-notification'))

	const userAllergens = useMemo(
		() =>
			convertRelevantAllergens(
				mealWarningCodes(meal),
				deferredAllergens,
				i18n.language
			),
		[meal.allergens, meal.additives, deferredAllergens, i18n.language]
	)
	const { userKind: accountUserKind = USER_GUEST } =
		use<UserKindContextType>(UserKindContext)
	const userKind = getFoodPriceKind(accountUserKind)
	const priceLines = (
		[
			['student', t('card.prices.student')],
			['employee', t('card.prices.employee')],
			['guest', t('card.prices.guest')]
		] as const
	)
		.map(([kind, label]) => ({
			kind,
			label,
			price: formatPrice(meal.prices?.[kind])
		}))
		.filter((line) => line.price !== '')

	const isNotConfigured =
		deferredAllergens.length === 1 && deferredAllergens[0] === 'not-configured'
	const hasUserAllergens = userAllergens.length > 0 && !isNotConfigured
	const noAllergenInfo = allergenInfoMissing(meal)

	const shouldShowAllergens = hasUserAllergens || noAllergenInfo

	const iconName = hasUserAllergens ? 'exclamationmark.triangle' : 'info.circle'
	const androidName = hasUserAllergens ? 'warning' : 'info'
	const webName = hasUserAllergens ? 'TriangleAlert' : 'Info'
	const textContent = hasUserAllergens
		? userAllergens
		: t('card.noAllergenInfo')

	const [key, setKey] = useState(Math.random())

	const itemPressed = (): void => {
		router.navigate({
			pathname: '/food/[id]',
			params: { id: getMealRouteId(meal.id) }
		})
	}

	const cardContent = (
		<Link asChild href={`/food/${getMealRouteId(meal.id)}`}>
			<Pressable
				testID="food-meal-entry"
				delayLongPress={300}
				onLongPress={() => {
					/* nothing */
				}}
				className="mt-2.5"
			>
				<View className="self-center bg-card rounded-mg border-hairline border-border shadow-card p-card w-full">
					<View className="flex-row items-start justify-between w-full">
						<View className="flex-1 pr-2">
							{meal.category !== '' && (
								<Text
									testID="food-meal-category"
									className="text-label text-[11px] font-semibold uppercase tracking-wide mb-0.5"
								>
									{meal.category}
								</Text>
							)}
							<Text className="text-text text-base font-medium">
								{mealName(
									meal.name,
									deferredFoodLanguage,
									i18n.language as LanguageKey
								)}
							</Text>
						</View>
						{meal.variants?.length > 0 && (
							<View className="rounded-infinite border-hairline border-border bg-label-background max-w-[10%] px-1.5 py-0.5">
								<Text className="text-text text-[11px] font-medium text-center">
									{`+ ${meal.variants.length}`}
								</Text>
							</View>
						)}
					</View>
					<View className="flex-row items-end justify-between pt-2 gap-3">
						<View className="flex-1 gap-1.5">
							<MealIcons icons={meal.icons} />
							{shouldShowAllergens && (
								<View className="flex-row items-center gap-0.5">
									<PlatformIcon
										ios={{
											name: iconName,
											size: 13
										}}
										android={{
											name: androidName,
											size: 16,
											variant: 'outlined'
										}}
										web={{
											name: webName,
											size: 16
										}}
										style={{
											color: notificationColor,
											alignSelf: 'center',
											marginRight: 4
										}}
									/>
									<Text
										testID="food-meal-allergens"
										className="text-notification text-xs flex-1"
										numberOfLines={3}
									>
										{textContent}
									</Text>
								</View>
							)}
						</View>
						<View className="items-end">
							{priceLines.map((line) => (
								<Text
									key={line.kind}
									className={`text-xs ${
										line.kind === userKind
											? 'text-text font-semibold'
											: 'text-label'
									}`}
								>
									{`${line.price} ${line.label}`}
								</Text>
							))}
						</View>
					</View>
				</View>
			</Pressable>
		</Link>
	)

	if (Platform.OS === 'ios' && DeviceInfo.getDeviceType() !== 'Desktop') {
		return (
			<DragDropView
				mode="drag"
				scope="system"
				dragValue={t('details.share.message', {
					meal: meal.name[i18n.language as LanguageKey],
					price: formatPrice(meal.prices[userKind ?? 'guest']),
					location:
						humanLocations[meal.restaurant as keyof typeof humanLocations],
					link: mealShareLink(getMealRouteId(meal.id))
				})}
			>
				<ContextMenu
					title={humanLocations[meal.restaurant as keyof typeof humanLocations]}
					key={key}
					style={{ zIndex: 3 }}
					actions={[
						{
							title: meal.allergens?.join(', ') ?? t('card.noAllergenInfo'),
							subtitle:
								meal.allergens !== null
									? t('preferences.formlist.allergens')
									: undefined,
							systemIcon:
								Platform.OS === 'ios' ? 'exclamationmark.triangle' : undefined,
							disabled: true
						},
						{
							title: t('misc.share', { ns: 'common' }),
							systemIcon:
								Platform.OS === 'ios' ? 'square.and.arrow.up' : undefined
						}
					]}
					onPreviewPress={itemPressed}
					onPress={(e) => {
						if (e.nativeEvent.name === t('misc.share', { ns: 'common' })) {
							trackEvent('Share', {
								type: 'meal'
							})
							shareMeal(meal, i18n, userKind)
						}
						setKey(Math.random())
					}}
				>
					{cardContent}
				</ContextMenu>
			</DragDropView>
		)
	}

	return (
		<DragDropView
			mode="drag"
			scope="system"
			dragValue={t('details.share.message', {
				meal: meal.name[i18n.language as LanguageKey],
				price: formatPrice(meal.prices[userKind ?? 'guest']),
				location:
					humanLocations[meal.restaurant as keyof typeof humanLocations],
				link: mealShareLink(getMealRouteId(meal.id))
			})}
		>
			{cardContent}
		</DragDropView>
	)
})
