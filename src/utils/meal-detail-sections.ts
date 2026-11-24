import type { TFunction } from 'i18next'
import { type ColorValue, Linking } from 'react-native'
import { linkIcon } from '@/components/Universal/icon'
import allergenMap from '@/data/allergens.json'
import { USER_GUEST } from '@/data/constants'
import type { LanguageKey } from '@/localization/i18n'
import type { FormListSections, SectionGroup } from '@/types/components'
import type { Meal, Prices } from '@/types/hawconnect-api'
import { allergenInfoMissing, isAdditiveCode } from '@/utils/food-filter'
import {
	foodDataSources,
	foodRestaurantLocations,
	formatPrice,
	humanLocations
} from '@/utils/food-utils'
import { mealWarningCodes } from '@/utils/hamburg-food-labels'

export function isMealNutritionAvailable(foodData: Meal): boolean {
	return (
		foodData.nutrition != null &&
		Object.values(foodData.nutrition).every(
			(value) => value !== '' && value !== 0
		)
	)
}

export function isMensaRestaurant(
	restaurant: string | null | undefined
): boolean {
	return ['BerlinerTorMensa', 'BergedorfMensa', 'FinkenauMensa'].includes(
		restaurant ?? ''
	)
}

interface MealDetailSectionsParams {
	foodData: Meal
	t: TFunction<'food'>
	language: LanguageKey
	userKind: string
	allergenSelection: string[]
	notificationColor: ColorValue | undefined
	onItemAlert: (item: string, itemType: 'allergen' | 'flag') => void
}

export function buildNutritionSection(
	foodData: Meal,
	t: TFunction<'food'>
): FormListSections[] {
	return [
		{
			header: t('details.formlist.nutrition.title'),
			footer: t('details.formlist.nutrition.footer'),
			items: [
				{
					title: `${t('details.formlist.nutrition.energy')} (kJ)`,
					value: `${(foodData.nutrition?.kj ?? 'n/a').toString()} kJ`,
					copyable: `${foodData.nutrition?.kj}`
				},
				{
					title: `${t('details.formlist.nutrition.energy')} (kcal)`,
					value: `${(foodData.nutrition?.kcal ?? 'n/a').toString()} kcal`,
					copyable: `${foodData.nutrition?.kcal}`
				},
				{
					title: t('details.formlist.nutrition.fat'),
					value: `${(foodData.nutrition?.fat ?? 'n/a').toString()} g`,
					copyable: `${foodData.nutrition?.fat}`
				},
				{
					title: t('details.formlist.nutrition.saturated'),
					value: `${(foodData.nutrition?.fatSaturated ?? 'n/a').toString()} g`,
					copyable: `${foodData.nutrition?.fatSaturated}`
				},
				{
					title: t('details.formlist.nutrition.carbs'),
					value: `${(foodData.nutrition?.carbs ?? 'n/a').toString()} g`,
					copyable: `${foodData.nutrition?.carbs}`
				},
				{
					title: t('details.formlist.nutrition.sugar'),
					value: `${(foodData.nutrition?.sugar ?? 'n/a').toString()} g`,
					copyable: `${foodData.nutrition?.sugar}`
				},
				{
					title: t('details.formlist.nutrition.fiber'),
					value: `${(foodData.nutrition?.fiber ?? 'n/a').toString()} g`,
					copyable: `${foodData.nutrition?.fiber}`
				},
				{
					title: t('details.formlist.nutrition.protein'),
					value: `${(foodData.nutrition?.protein ?? 'n/a').toString()} g`,
					copyable: `${foodData.nutrition?.protein}`
				},
				{
					title: t('details.formlist.nutrition.salt'),
					value: `${(foodData.nutrition?.salt ?? 'n/a').toString()} g`,
					copyable: `${foodData.nutrition?.salt}`
				}
			]
		}
	]
}

/**
 * Allergens: "Sl · celery…", the code exactly as sent, then its name when we know it.
 * Additives: the name only ("preservatives"); the code is shown when the name is unknown.
 */
function codeTitle(code: string, language: LanguageKey): string {
	const name = allergenMap[code as keyof typeof allergenMap]?.[language]
	if (!name) return code
	return isAdditiveCode(code) ? name : `${code} · ${name}`
}

export function buildMensaSection(
	params: MealDetailSectionsParams
): FormListSections[] {
	const {
		foodData,
		t,
		language,
		allergenSelection,
		notificationColor,
		onItemAlert
	} = params

	const codeItem = (code: string): SectionGroup => ({
		title: codeTitle(code, language),
		icon: allergenSelection.includes(code)
			? {
					android: 'warning',
					ios: 'exclamationmark.triangle',
					web: 'TriangleAlert',
					endIcon: true
				}
			: undefined,
		hideChevron: true,
		iconColor: notificationColor,
		onPress: () => {
			onItemAlert(code, 'allergen')
		}
	})

	const codes = mealWarningCodes(foodData)
	const allergens = codes.filter((code) => !isAdditiveCode(code))
	const additives = codes.filter(isAdditiveCode)
	// Only allergen codes are listed; additives show their names above, not their numbers.
	const footer =
		allergens.length > 0
			? t('details.formlist.allergenFooter', {
					allergens: allergens.join(', ')
				})
			: t('details.formlist.allergenFooterPlain')

	const allergenSection: FormListSections = allergenInfoMissing(foodData)
		? {
				header: t('preferences.formlist.allergens'),
				items: [{ title: t('card.noAllergenInfo'), hideChevron: true }]
			}
		: {
				header: t('preferences.formlist.allergens'),
				items: allergens.map(codeItem),
				footer: additives.length === 0 ? footer : undefined
			}

	const additiveSection: FormListSections[] =
		additives.length > 0
			? [
					{
						header: t('filter.additives'),
						items: additives.map(codeItem),
						footer
					}
				]
			: []

	const nutritionSection = isMealNutritionAvailable(foodData)
		? buildNutritionSection(foodData, t)
		: []

	return [allergenSection, ...additiveSection, ...nutritionSection]
}

export function buildAboutSection(
	params: MealDetailSectionsParams
): FormListSections[] {
	const { foodData, t } = params

	return [
		{
			header: t('details.formlist.about.title'),
			items: [
				{
					title: t('details.formlist.about.source'),
					icon: linkIcon,
					onPress: () => {
						if (foodData.restaurant !== null) {
							const restaurant =
								foodData.restaurant as keyof typeof foodDataSources
							void Linking.openURL(foodDataSources[restaurant])
						}
					}
				}
			]
		}
	]
}

export function buildVariantsSection(
	foodData: Meal,
	t: TFunction<'food'>,
	language: LanguageKey,
	userKind: string
): FormListSections[] {
	return [
		{
			header: t('details.formlist.variants'),
			items:
				foodData.variants?.map((variant) => {
					const priceKey = (userKind ?? USER_GUEST) as keyof Prices
					return {
						title: variant.name[language],
						value:
							(variant?.additional ? '+ ' : '') +
							formatPrice(variant.prices[priceKey])
					}
				}) ?? []
		}
	]
}

export function buildMealDetailSections(
	params: MealDetailSectionsParams
): FormListSections[] {
	const { foodData, t, language, userKind } = params

	const variantsSection = buildVariantsSection(foodData, t, language, userKind)
	const aboutSection = buildAboutSection(params)

	if (isMensaRestaurant(foodData.restaurant)) {
		return [...variantsSection, ...buildMensaSection(params), ...aboutSection]
	}

	return [...variantsSection, ...aboutSection]
}

export function getMealHumanLocation(restaurant: string): string {
	return humanLocations[restaurant as keyof typeof humanLocations]
}

export function hasMealRestaurantLocation(restaurant: string): boolean {
	return (
		restaurant !== undefined &&
		foodRestaurantLocations[
			restaurant as keyof typeof foodRestaurantLocations
		] !== undefined
	)
}
