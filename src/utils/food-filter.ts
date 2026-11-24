import type { Meal } from '@/types/hawconnect-api'

export type QuickFilter =
	| 'noAlcohol'
	| 'noPork'
	| 'fish'
	| 'vegetarian'
	| 'vegan'
	| 'favorite'

/**
 * Quick filters map to the Studierendenwerk icon stems shown on the menu page
 * (`meal.icons`), not to flag codes: vega = vegan, vege = vegetarian,
 * fish, pork, alc = alcohol, fave = favorite.
 * A meal whose `icons` is missing (older cached data) cannot be verified and is
 * hidden by every quick filter.
 */
export const QUICK_FILTER_ICONS: Record<
	QuickFilter,
	{ requires?: string; excludes?: string }
> = {
	vegan: { requires: 'vega' },
	vegetarian: { requires: 'vege' },
	fish: { requires: 'fish' },
	favorite: { requires: 'fave' },
	noPork: { excludes: 'pork' },
	noAlcohol: { excludes: 'alc' }
}

/** The Studierendenwerk's own menu filters, in the order its menu page lists them. */
export const QUICK_FILTERS = Object.keys(QUICK_FILTER_ICONS) as QuickFilter[]

export interface MealFilter {
	restaurants: string[]
	allergens: string[]
	additives: string[]
	quick: QuickFilter[]
}

/** True when the source published no allergen information for the meal. */
export function allergenInfoMissing(meal: Meal): boolean {
	return meal.allergens === null || meal.allergens === undefined
}

function passesQuick(meal: Meal, quick: QuickFilter): boolean {
	const icons = meal.icons
	if (!icons) return false
	const { requires, excludes } = QUICK_FILTER_ICONS[quick]
	if (requires && !icons.includes(requires)) return false
	if (excludes && icons.includes(excludes)) return false
	return true
}

/** Additives are the numbered codes; every other code is an allergen. */
export function isAdditiveCode(code: string): boolean {
	return /^\d+$/.test(code)
}

/** Selected codes per section; a code counts where it belongs, whichever store holds it. */
export function codeSelectionCounts(
	allergenSelection: readonly string[],
	selectedAdditives: readonly string[]
): { allergens: number; additives: number } {
	const all = new Set(
		[...allergenSelection, ...selectedAdditives].filter(
			(code) => code !== 'not-configured'
		)
	)
	let additives = 0
	for (const code of all) if (isAdditiveCode(code)) additives++
	return { allergens: all.size - additives, additives }
}

/** Applies all filters with AND semantics. Codes are compared exactly. */
export function filterMeals(meals: Meal[], filter: MealFilter): Meal[] {
	return meals.filter((meal) => {
		if (!meal.restaurant || !filter.restaurants.includes(meal.restaurant))
			return false
		const chosen = new Set([...filter.allergens, ...filter.additives])
		const listed = [...(meal.allergens ?? []), ...(meal.additives ?? [])]
		if (listed.some((code) => chosen.has(code))) return false
		return filter.quick.every((quick) => passesQuick(meal, quick))
	})
}

/** Icon stems the app bundles (assets/food-icons), in no particular order. */
export const MEAL_ICON_STEMS = [
	'vega',
	'vege',
	'fish',
	'pork',
	'beef',
	'poul',
	'lamb',
	'game',
	'alc',
	'gela',
	'lact',
	'fave',
	'new',
	'vita'
] as const

export type MealIconStem = (typeof MEAL_ICON_STEMS)[number]

/** The source's icon stems we can render, in the source's order; unknown stems are dropped. */
export function mealIconKeys(
	icons: readonly string[] | null | undefined
): MealIconStem[] {
	return (icons ?? []).filter((stem): stem is MealIconStem =>
		(MEAL_ICON_STEMS as readonly string[]).includes(stem)
	)
}

/** Meals grouped by restaurant, in the given restaurant order; restaurants without meals are left out. */
export function mealsByRestaurant(
	meals: Meal[],
	restaurants: readonly string[]
): { key: string; meals: Meal[] }[] {
	return restaurants
		.map((key) => ({ key, meals: meals.filter((m) => m.restaurant === key) }))
		.filter((section) => section.meals.length > 0)
}

/** Reset clears chosen allergens but must not mark allergens as configured. */
export function resetAllergenSelection(current: string[]): string[] {
	return current.includes('not-configured') ? ['not-configured'] : []
}
