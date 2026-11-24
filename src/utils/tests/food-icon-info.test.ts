import { describe, expect, it } from 'bun:test'
import de from '@/localization/de/food.json'
import en from '@/localization/en/food.json'
import { mealIconKeys } from '@/utils/food-filter'

describe('icon explanations from the Studierendenwerk', () => {
	it('exist for the same icons in German and English, all of them known icons', () => {
		const deKeys = Object.keys(de.iconInfo).sort()
		const enKeys = Object.keys(en.iconInfo).sort()
		expect(deKeys).toEqual(enKeys)
		expect(mealIconKeys(deKeys)).toEqual(deKeys as never)
	})

	it('always have a title', () => {
		for (const info of [
			...Object.values(de.iconInfo),
			...Object.values(en.iconInfo)
		])
			expect(info.title.length).toBeGreaterThan(0)
	})
})
