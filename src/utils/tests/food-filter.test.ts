import { describe, expect, it } from 'bun:test'
import type { Meal } from '@/types/hawconnect-api'
import {
	allergenInfoMissing,
	codeSelectionCounts,
	filterMeals,
	mealIconKeys,
	mealsByRestaurant,
	resetAllergenSelection
} from '@/utils/food-filter'

function meal(overrides: Partial<Meal> & { id: string }): Meal {
	return {
		name: { de: 'Gericht', en: 'Dish' },
		category: 'Hauptgericht',
		prices: { student: 1, employee: 2, guest: 3 },
		allergens: [],
		additives: [],
		flags: [],
		icons: [],
		nutrition: null,
		variants: [],
		originalLanguage: 'de',
		static: false,
		restaurant: 'BerlinerTorMensa',
		...overrides
	} as Meal
}

const base = {
	restaurants: ['BerlinerTorMensa'],
	allergens: [] as string[],
	additives: [] as string[],
	quick: [] as never[]
}

const ids = (meals: Meal[]) => meals.map((m) => m.id)

describe('filterMeals', () => {
	it('an additive chosen in Settings hides meals listing it', () => {
		const meals = [
			meal({ id: 'a', additives: ['2'] }),
			meal({ id: 'b', additives: ['3'] }),
			meal({ id: 'c', allergens: ['Ei'] })
		]
		expect(ids(filterMeals(meals, { ...base, allergens: ['2'] }))).toEqual([
			'b',
			'c'
		])
	})

	it('an additive chosen in the sheet hides meals listing it in either list', () => {
		const meals = [
			meal({ id: 'a', allergens: ['2'] }),
			meal({ id: 'b', additives: ['2'] }),
			meal({ id: 'c' })
		]
		expect(ids(filterMeals(meals, { ...base, additives: ['2'] }))).toEqual([
			'c'
		])
	})

	it('hides meals listing a selected allergen', () => {
		const meals = [
			meal({ id: 'a', allergens: ['Sw'] }),
			meal({ id: 'b', allergens: ['Ei'] })
		]
		expect(ids(filterMeals(meals, { ...base, allergens: ['Sw'] }))).toEqual([
			'b'
		])
	})

	it('keeps a meal with allergens null and marks it unknown', () => {
		const m = meal({ id: 'a', allergens: null })
		expect(ids(filterMeals([m], { ...base, allergens: ['Sw'] }))).toEqual(['a'])
		expect(allergenInfoMissing(m)).toBe(true)
		expect(allergenInfoMissing(meal({ id: 'b' }))).toBe(false)
	})

	it('hides meals listing a selected additive', () => {
		const meals = [
			meal({ id: 'a', additives: ['2'] }),
			meal({ id: 'b', additives: ['3'] })
		]
		expect(ids(filterMeals(meals, { ...base, additives: ['2'] }))).toEqual([
			'b'
		])
	})

	it('vegan keeps only meals with the vegan icon', () => {
		const meals = [
			meal({ id: 'a', icons: ['vega'] }),
			meal({ id: 'b', icons: ['vege'] }),
			meal({ id: 'c', icons: undefined })
		]
		expect(ids(filterMeals(meals, { ...base, quick: ['vegan'] }))).toEqual([
			'a'
		])
	})

	it('vegetarian keeps only meals with the vegetarian icon', () => {
		const meals = [
			meal({ id: 'a', icons: ['vega'] }),
			meal({ id: 'b', icons: ['vege'] })
		]
		expect(ids(filterMeals(meals, { ...base, quick: ['vegetarian'] }))).toEqual(
			['b']
		)
	})

	it('without pork hides meals with the pork icon and meals with icons missing', () => {
		const meals = [
			meal({ id: 'a', icons: ['pork'] }),
			meal({ id: 'b', icons: ['beef'] }),
			meal({ id: 'c', icons: null }),
			meal({ id: 'd', icons: undefined })
		]
		expect(ids(filterMeals(meals, { ...base, quick: ['noPork'] }))).toEqual([
			'b'
		])
	})

	it('without alcohol hides meals with the alcohol icon', () => {
		const meals = [
			meal({ id: 'a', icons: ['alc'] }),
			meal({ id: 'b', icons: [] })
		]
		expect(ids(filterMeals(meals, { ...base, quick: ['noAlcohol'] }))).toEqual([
			'b'
		])
	})

	it('with fish keeps only fish meals', () => {
		const meals = [
			meal({ id: 'a', icons: ['fish'] }),
			meal({ id: 'b', icons: ['pork'] })
		]
		expect(ids(filterMeals(meals, { ...base, quick: ['fish'] }))).toEqual(['a'])
	})

	it('favorite keeps only favorite meals', () => {
		const meals = [
			meal({ id: 'a', icons: ['fave'] }),
			meal({ id: 'b', icons: [] })
		]
		expect(ids(filterMeals(meals, { ...base, quick: ['favorite'] }))).toEqual([
			'a'
		])
	})

	it('no restaurant selected returns no meals', () => {
		expect(
			filterMeals([meal({ id: 'a' })], { ...base, restaurants: [] })
		).toEqual([])
	})

	it('hides meals of unselected restaurants', () => {
		const meals = [
			meal({ id: 'a', restaurant: 'BergedorfMensa' }),
			meal({ id: 'b' })
		]
		expect(ids(filterMeals(meals, base))).toEqual(['b'])
	})

	it('filters combine with AND', () => {
		const meals = [
			meal({ id: 'a', icons: ['vege'], allergens: ['Sw'] }),
			meal({ id: 'b', icons: ['vege'], allergens: [] }),
			meal({ id: 'c', icons: ['pork'], allergens: [] }),
			meal({ id: 'd', icons: ['vege'], restaurant: 'BergedorfMensa' })
		]
		expect(
			ids(
				filterMeals(meals, {
					...base,
					allergens: ['Sw'],
					quick: ['vegetarian', 'noPork']
				})
			)
		).toEqual(['b'])
	})

	it('allergen codes are compared exactly as sent', () => {
		const meals = [meal({ id: 'a', allergens: ['sw'] })]
		expect(ids(filterMeals(meals, { ...base, allergens: ['Sw'] }))).toEqual([
			'a'
		])
		expect(ids(filterMeals(meals, { ...base, allergens: ['sw'] }))).toEqual([])
	})
})

describe('mealIconKeys', () => {
	it('keeps known icon stems in page order and skips unknown ones', () => {
		expect(mealIconKeys(['vege', 'mystery', 'fish', 'fave'])).toEqual([
			'vege',
			'fish',
			'fave'
		])
	})

	it('returns nothing without icons', () => {
		expect(mealIconKeys(null)).toEqual([])
		expect(mealIconKeys(undefined)).toEqual([])
	})
})

describe('resetAllergenSelection', () => {
	it('keeps the not-configured marker so reset does not configure allergens', () => {
		expect(resetAllergenSelection(['not-configured'])).toEqual([
			'not-configured'
		])
	})

	it('clears chosen allergens', () => {
		expect(resetAllergenSelection(['Sw', 'Ei'])).toEqual([])
		expect(resetAllergenSelection([])).toEqual([])
	})
})

describe('mealsByRestaurant', () => {
	it('groups in restaurant order and drops restaurants without meals', () => {
		const meals = [
			meal({ id: 'a', restaurant: 'BergedorfMensa' }),
			meal({ id: 'b', restaurant: 'BerlinerTorMensa' }),
			meal({ id: 'c', restaurant: 'BergedorfMensa' })
		]
		const sections = mealsByRestaurant(meals, [
			'BerlinerTorMensa',
			'BergedorfMensa',
			'FinkenauMensa'
		])
		expect(sections.map((s) => s.key)).toEqual([
			'BerlinerTorMensa',
			'BergedorfMensa'
		])
		expect(sections[1].meals.map((m) => m.id)).toEqual(['a', 'c'])
	})
})

describe('codeSelectionCounts', () => {
	it('counts numeric codes as additives from either store, the rest as allergens', () => {
		expect(
			codeSelectionCounts(['Sw', '2', 'not-configured'], ['2', '5'])
		).toEqual({ allergens: 1, additives: 2 })
	})
})
