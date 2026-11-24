import { describe, expect, it } from 'bun:test'
import {
	cafeteriaMapHref,
	cafeteriaMapRoom,
	cardHours,
	directionsUrl,
	groupByCampus,
	isCafeteriaId,
	selectionWithRestaurant
} from '../cafeterias'

const blueberry = [
	{
		days: 'Monday to Thursday',
		time: '07:45 a.m. to 05:00 p.m.',
		parsed: { weekdays: [1, 2, 3, 4], open: '07:45', close: '17:00' }
	},
	{
		days: 'Friday',
		time: '07:45 a.m. to 04:00 p.m.',
		parsed: { weekdays: [5], open: '07:45', close: '16:00' }
	}
]

// As served for Café Alexanderstraße: German times, so not parsed.
const unparsed = [
	{
		days: 'Monday to Wednesday',
		time: '08:00 a.m. to 04:30 p.m.',
		parsed: null
	},
	{ days: 'Friday', time: '08:00 a.m. to 03:00 p.m.', parsed: null }
]

const hamburg = (local: string) => new Date(`${local}+01:00`)

describe('cardHours', () => {
	it("shows today's line and the hint", () => {
		expect(cardHours(blueberry, hamburg('2026-11-27T10:00:00'))).toEqual({
			state: 'open',
			lines: [{ days: 'Friday', time: '07:45 a.m. to 04:00 p.m.' }]
		})
	})

	it('shows no line on a closed day, only the hint', () => {
		expect(cardHours(blueberry, hamburg('2026-11-28T10:00:00'))).toEqual({
			state: 'closed',
			lines: []
		})
	})

	it('shows the published lines without a hint when they are not parsed', () => {
		expect(cardHours(unparsed, hamburg('2026-11-23T10:00:00'))).toEqual({
			state: 'unknown',
			lines: [
				{ days: 'Monday to Wednesday', time: '08:00 a.m. to 04:30 p.m.' },
				{ days: 'Friday', time: '08:00 a.m. to 03:00 p.m.' }
			]
		})
	})
})

describe('groupByCampus', () => {
	it('orders Berliner Tor, Bergedorf, Finkenau and keeps the order inside', () => {
		const groups = groupByCampus([
			{ id: 'FinkenauMensa', campus: 'Finkenau' },
			{ id: 'BerlinerTorMensa', campus: 'Berliner Tor' },
			{ id: 'BergedorfMensa', campus: 'Bergedorf' },
			{ id: 'BlueberryCafe', campus: 'Berliner Tor' }
		])
		expect(groups.map((group) => group.campus)).toEqual([
			'Berliner Tor',
			'Bergedorf',
			'Finkenau'
		])
		expect(groups[0].places.map((place) => place.id)).toEqual([
			'BerlinerTorMensa',
			'BlueberryCafe'
		])
	})
})

describe('cafeteriaMapRoom', () => {
	it("uses the place's map entry, else its campus", () => {
		expect(
			cafeteriaMapRoom('BerlinerTorMensa', 'Berliner Tor', {
				BerlinerTorMensa: 'M001'
			})
		).toBe('M001')
		expect(cafeteriaMapRoom('BlueberryCafe', 'Berliner Tor', {})).toBe(
			'Berliner Tor'
		)
		expect(cafeteriaMapRoom('X', 'Nowhere', {})).toBeUndefined()
	})
})

describe('directionsUrl', () => {
	it('opens Apple Maps on iOS and Google Maps elsewhere', () => {
		const address = ['Berliner Tor 5', '20099 Hamburg']
		expect(directionsUrl(address, true)).toBe(
			'https://maps.apple.com/?daddr=Berliner%20Tor%205%2C%2020099%20Hamburg&dirflg=w'
		)
		expect(directionsUrl(address, false)).toBe(
			'https://www.google.com/maps/dir/?api=1&destination=Berliner%20Tor%205%2C%2020099%20Hamburg&travelmode=walking'
		)
	})
})

describe('isCafeteriaId', () => {
	it('knows the meal restaurants that have a page', () => {
		expect(isCafeteriaId('BergedorfMensa')).toBe(true)
		expect(isCafeteriaId('AlexanderstrasseCafe')).toBe(true)
		expect(isCafeteriaId('SomewhereElse')).toBe(false)
		expect(isCafeteriaId(undefined)).toBe(false)
	})
})

describe('cafeteriaMapHref', () => {
	it('passes the campus as the room, never an empty one', () => {
		expect(cafeteriaMapHref('FinkenauCafe', 'Finkenau', {})).toEqual({
			pathname: '/(tabs)/map',
			params: { room: 'Finkenau' }
		})
		expect(cafeteriaMapHref('X', 'Nowhere', {})).toBeUndefined()
		expect(cafeteriaMapHref('X', 'Nowhere', { X: '' })).toBeUndefined()
	})
})

describe('selectionWithRestaurant', () => {
	it('keeps the list when the restaurant is already selected', () => {
		const selected = ['BerlinerTorMensa', 'AlexanderstrasseCafe']
		expect(selectionWithRestaurant(selected, 'AlexanderstrasseCafe')).toBe(
			selected
		)
	})

	it('appends the restaurant when it is not selected', () => {
		expect(
			selectionWithRestaurant(['BerlinerTorMensa'], 'AlexanderstrasseCafe')
		).toEqual(['BerlinerTorMensa', 'AlexanderstrasseCafe'])
	})
})
