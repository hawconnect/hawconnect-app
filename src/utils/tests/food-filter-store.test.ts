import { describe, expect, it } from 'bun:test'
import { useFoodFilterStore } from '@/hooks/useFoodFilterStore'
import { zustandStorage } from '@/utils/storage'

describe('useFoodFilterStore restaurants', () => {
	it('offers only the three mensas with a menu', () => {
		expect(useFoodFilterStore.getState().selectedRestaurants).toEqual([
			'BerlinerTorMensa',
			'BergedorfMensa',
			'FinkenauMensa'
		])
	})

	it('keeps an existing stored selection when rehydrating', async () => {
		zustandStorage.setItem(
			'food-filter-storage',
			JSON.stringify({
				state: { selectedRestaurants: ['BerlinerTorMensa'] },
				version: 1
			})
		)
		await useFoodFilterStore.persist.rehydrate()
		expect(useFoodFilterStore.getState().selectedRestaurants).toEqual([
			'BerlinerTorMensa'
		])
	})

	it('drops Café Alexanderstraße from a stored selection (no menu)', async () => {
		zustandStorage.setItem(
			'food-filter-storage',
			JSON.stringify({
				state: {
					selectedRestaurants: ['BerlinerTorMensa', 'AlexanderstrasseCafe']
				},
				version: 1
			})
		)
		await useFoodFilterStore.persist.rehydrate()
		expect(useFoodFilterStore.getState().selectedRestaurants).toEqual([
			'BerlinerTorMensa'
		])
	})
})
