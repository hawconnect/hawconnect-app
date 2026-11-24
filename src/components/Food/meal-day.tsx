import type React from 'react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import Button from '@/components/Universal/button'
import { useCanteens } from '@/hooks/useCanteens'
import { useFoodFilterStore } from '@/hooks/useFoodFilterStore'
import type { Food } from '@/types/hawconnect-api'
import { filterMeals, mealsByRestaurant } from '@/utils/food-filter'
import { FOOD_DETAIL_RESTAURANTS, humanLocations } from '@/utils/food-utils'
import { CanteenHeader } from './canteen-header'
import { EmptyFoodAnimation } from './empty-food-animation'
import { MealEntry } from './meal-entry'

export const MealDay = ({ day }: { day: Food }): React.JSX.Element => {
	const { t } = useTranslation('food')
	const { data: canteens } = useCanteens()
	const selectedRestaurants = useFoodFilterStore(
		(state) => state.selectedRestaurants
	)
	const allergenSelection = useFoodFilterStore(
		(state) => state.allergenSelection
	)
	const selectedAdditives = useFoodFilterStore(
		(state) => state.selectedAdditives
	)
	const quickFilters = useFoodFilterStore((state) => state.quickFilters)
	const resetFilters = useFoodFilterStore((state) => state.resetFilters)

	const visible = useMemo(
		() =>
			filterMeals(day.meals, {
				restaurants: selectedRestaurants,
				allergens: allergenSelection,
				additives: selectedAdditives,
				quick: quickFilters
			}),
		[
			day.meals,
			selectedRestaurants,
			allergenSelection,
			selectedAdditives,
			quickFilters
		]
	)

	if (day.meals.length === 0) {
		return <EmptyFoodAnimation />
	}

	if (visible.length === 0) {
		return (
			<View testID="food-no-match" className="items-center gap-4 pt-16 px-6">
				<Text className="text-text text-base font-medium text-center">
					{t('filter.noMatch')}
				</Text>
				<Button onPress={resetFilters}>{t('filter.reset')}</Button>
			</View>
		)
	}

	return (
		<View style={styles.foodContainer}>
			{mealsByRestaurant(visible, FOOD_DETAIL_RESTAURANTS).map(
				({ key, meals }) => {
					return (
						<View key={key}>
							<CanteenHeader
								canteen={canteens?.find((canteen) => canteen.id === key)}
								name={humanLocations[key as keyof typeof humanLocations]}
							/>
							{meals.map((meal, index) => (
								<MealEntry key={`${meal.id}-${index}`} meal={meal} />
							))}
						</View>
					)
				}
			)}
		</View>
	)
}

const styles = StyleSheet.create({
	foodContainer: {
		paddingBottom: 90
	}
})
