import { beforeAll, describe, expect, it, mock } from 'bun:test'
import type { TFunction } from 'i18next'
import type { Meal } from '@/types/hawconnect-api'
import { reactNativeOpenURLMock } from './react-native-mock'

const SRC_ROOT = new URL('../../', import.meta.url).pathname

const clipboardSetStringAsyncMock = mock(async () => {})
const trackEventMock = mock(() => {})
const mockGetFoodPlan = mock(
	async (): Promise<{ food: unknown }> => ({ food: [] })
)
const mockGetFragmentData = mock(() => ({ foodData: [] as unknown[] }))

mock.module(`${SRC_ROOT}localization/i18n.ts`, () => ({
	default: { language: 'de' }
}))

mock.module('expo-localization', () => ({
	getLocales: () => [{ languageCode: 'de' }]
}))

mock.module('react-i18next', () => ({
	initReactI18next: {}
}))

mock.module('@aptabase/react-native', () => ({
	trackEvent: trackEventMock
}))

mock.module('expo-clipboard', () => ({
	setStringAsync: clipboardSetStringAsyncMock
}))

mock.module('burnt', () => ({
	toast: () => {}
}))

mock.module(`${SRC_ROOT}__generated__/gql/graphql.ts`, () => ({
	FoodFieldsFragmentDoc: {}
}))

mock.module(`${SRC_ROOT}__generated__/gql/index.ts`, () => ({
	getFragmentData: mockGetFragmentData
}))

mock.module(`${SRC_ROOT}api/hawconnect-api.ts`, () => ({
	default: {
		getFoodPlan: mockGetFoodPlan
	}
}))

mock.module(`${SRC_ROOT}components/Universal/icon.tsx`, () => ({
	linkIcon: {
		ios: 'link',
		android: 'link',
		web: 'Link'
	}
}))

let mealDetailSections: typeof import('../meal-detail-sections')

const t = ((key: string, options?: { ns?: string; [key: string]: unknown }) => {
	if (options?.ns === 'common') {
		return `common:${key}`
	}
	if (key === 'details.formlist.allergenFooter') {
		return `allergens:${options?.allergens}`
	}
	return key
}) as TFunction<'food'>

const makeMeal = (overrides: Partial<Meal> = {}): Meal =>
	({
		id: 'meal-1',
		static: false,
		name: { de: 'Gericht', en: 'Meal' },
		category: 'Hauptgericht',
		prices: { guest: 4.5, employee: 3.5, student: 2.5 },
		allergens: ['Ei'],
		flags: ['V'],
		nutrition: {
			kj: 1000,
			kcal: 240,
			fat: 10,
			fatSaturated: 3,
			carbs: 20,
			sugar: 5,
			fiber: 2,
			protein: 12,
			salt: 1
		},
		variants: [
			{
				id: 'variant-1',
				additional: true,
				name: { de: 'Groß', en: 'Large' },
				prices: { guest: 1, employee: 1, student: 1 }
			}
		],
		originalLanguage: 'de',
		restaurant: 'BerlinerTorMensa',
		...overrides
	}) as Meal

const baseParams = () => ({
	foodData: makeMeal(),
	t,
	language: 'de' as const,
	userKind: 'student',
	allergenSelection: [] as string[],
	notificationColor: '#ff0000',
	onItemAlert: mock(() => {})
})

beforeAll(async () => {
	mealDetailSections = await import('../meal-detail-sections')
})

describe('meal-detail-sections', () => {
	it('isMealNutritionAvailable - Should return true when all nutrition values are present', () => {
		expect(mealDetailSections.isMealNutritionAvailable(makeMeal())).toBe(true)
	})

	it('isMealNutritionAvailable - Should return false when nutrition is missing or empty', () => {
		expect(
			mealDetailSections.isMealNutritionAvailable(makeMeal({ nutrition: null }))
		).toBe(false)
		expect(
			mealDetailSections.isMealNutritionAvailable(
				makeMeal({
					nutrition: {
						kj: 0,
						kcal: 240,
						fat: 10,
						fatSaturated: 3,
						carbs: 20,
						sugar: 5,
						fiber: 2,
						protein: 12,
						salt: 1
					}
				})
			)
		).toBe(false)
	})

	it('isMensaRestaurant - Should identify mensa restaurants', () => {
		expect(mealDetailSections.isMensaRestaurant('BerlinerTorMensa')).toBe(true)
		expect(mealDetailSections.isMensaRestaurant('BergedorfMensa')).toBe(true)
		expect(mealDetailSections.isMensaRestaurant('Campus Café')).toBe(false)
	})

	it('getMealHumanLocation - Should resolve known restaurant labels', () => {
		expect(mealDetailSections.getMealHumanLocation('BerlinerTorMensa')).toBe(
			'Mensa Berliner Tor'
		)
	})

	it('hasMealRestaurantLocation - Should detect mapped restaurant locations', () => {
		expect(
			mealDetailSections.hasMealRestaurantLocation('BerlinerTorMensa')
		).toBe(false)
		expect(mealDetailSections.hasMealRestaurantLocation('Campus Café')).toBe(
			false
		)
		expect(mealDetailSections.hasMealRestaurantLocation('Unknown')).toBe(false)
	})

	it('buildMealDetailSections - Should include mensa sections for mensa restaurants', () => {
		const sections = mealDetailSections.buildMealDetailSections(baseParams())
		const headers = sections.map((section) => section.header)

		expect(headers).toContain('details.formlist.variants')
		expect(headers).toContain('preferences.formlist.allergens')
		expect(headers).toContain('details.formlist.nutrition.title')
		expect(headers).toContain('details.formlist.about.title')
	})

	it('buildMealDetailSections - Should leave out the old flags list (the icons replace it)', () => {
		const sections = mealDetailSections.buildMealDetailSections(baseParams())
		const headers = sections.map((section) => section.header)

		expect(headers).not.toContain('preferences.formlist.flags')
	})

	it('buildMealDetailSections - Should omit mensa sections for non-mensa restaurants', () => {
		const params = {
			...baseParams(),
			foodData: makeMeal({ restaurant: 'Campus Café' })
		}
		const sections = mealDetailSections.buildMealDetailSections(params)
		const headers = sections.map((section) => section.header)

		expect(headers).toContain('details.formlist.variants')
		expect(headers).toContain('details.formlist.about.title')
		expect(headers).not.toContain('preferences.formlist.allergens')
	})

	it('buildMensaSection - Should show each allergen code exactly as sent next to its name', () => {
		const sections = mealDetailSections.buildMensaSection({
			...baseParams(),
			foodData: makeMeal({ allergens: ['Sl', 'Xy'], additives: [] })
		})

		expect(sections[0]?.header).toBe('preferences.formlist.allergens')
		expect(sections[0]?.items?.map((item) => item.title)).toEqual([
			'Sl · Sellerie und Sellerieerzeugnisse',
			'Xy'
		])
	})

	it('buildMensaSection - Should list additives in their own section only when sent', () => {
		const withAdditives = mealDetailSections.buildMensaSection({
			...baseParams(),
			foodData: makeMeal({ allergens: ['Sl'], additives: ['2'] })
		})
		const withoutAdditives = mealDetailSections.buildMensaSection({
			...baseParams(),
			foodData: makeMeal({ allergens: ['Sl'], additives: [] })
		})

		const additives = withAdditives.find(
			(section) => section.header === 'filter.additives'
		)
		expect(additives?.items?.map((item) => item.title)).toEqual([
			'Konservierungsstoff'
		])
		expect(additives?.footer).toBe('allergens:Sl')
		const onlyAdditives = mealDetailSections.buildMensaSection({
			...baseParams(),
			foodData: makeMeal({ allergens: [], additives: ['2'] })
		})
		expect(
			onlyAdditives.find((section) => section.header === 'filter.additives')
				?.footer
		).toBe('details.formlist.allergenFooterPlain')
		expect(
			withoutAdditives.some((section) => section.header === 'filter.additives')
		).toBe(false)
	})

	it('buildMensaSection - Should say "No allergen info" when the source sends none', () => {
		const sections = mealDetailSections.buildMensaSection({
			...baseParams(),
			foodData: makeMeal({ allergens: null })
		})

		expect(sections[0]?.items?.map((item) => item.title)).toEqual([
			'card.noAllergenInfo'
		])
		expect(sections[0]?.items?.[0]?.onPress).toBeUndefined()
	})

	it('buildMensaSection - Should wire allergen presses to onItemAlert', () => {
		const onItemAlert = mock(() => {})
		const sections = mealDetailSections.buildMensaSection({
			...baseParams(),
			onItemAlert
		})

		sections[0]?.items?.[0]?.onPress?.()

		expect(onItemAlert).toHaveBeenCalledWith('Ei', 'allergen')
	})

	it('buildMensaSection - Should mark selected allergens with an icon', () => {
		const sections = mealDetailSections.buildMensaSection({
			...baseParams(),
			allergenSelection: ['Ei']
		})

		expect(sections[0]?.items?.[0]?.icon).toBeDefined()
	})

	it('buildAboutSection - Should only link the data source (Mensa and category sit at the top now)', () => {
		const sections = mealDetailSections.buildAboutSection(baseParams())

		expect(sections[0]?.items).toHaveLength(1)
		sections[0]?.items?.[0]?.onPress?.()
		expect(reactNativeOpenURLMock).toHaveBeenCalledWith(
			'https://www.stwhh.de/speiseplan'
		)
	})

	it('buildVariantsSection - Should render variant rows without share actions', () => {
		const sections = mealDetailSections.buildVariantsSection(
			makeMeal(),
			t,
			'de',
			'student'
		)

		expect(sections[0]?.items).toEqual([
			{
				title: 'Groß',
				value: '+ 1,00 €'
			}
		])
		expect(sections[0]?.items?.[0]?.onPress).toBeUndefined()
	})
})
