import { describe, expect, it } from 'bun:test'
import { hamburgClock, openState, todayLines } from '../cafeteria-hours'

// As the backend parses the English Café Blueberry page.
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

// The English Café Alexanderstraße page lists no Thursday.
const alexanderstrasse = [
	{
		days: 'Monday to Wednesday',
		time: '08:00 a.m. to 03:00 p.m.',
		parsed: { weekdays: [1, 2, 3], open: '08:00', close: '15:00' }
	},
	{
		days: 'Friday',
		time: '08:00 a.m. to 03:00 p.m.',
		parsed: { weekdays: [5], open: '08:00', close: '15:00' }
	}
]

// As the backend parses the English Cafeteria Berliner Tor page.
const berlinerTorMensa = [
	{
		days: 'Monday to Friday',
		time: '11:00 a.m. to 04:00 p.m.',
		parsed: { weekdays: [1, 2, 3, 4, 5], open: '11:00', close: '16:00' }
	}
]

// November is CET (UTC+1).
const hamburg = (local: string) => new Date(`${local}+01:00`)

describe('openState', () => {
	it('is open during the published hours', () => {
		expect(openState(blueberry, hamburg('2026-11-23T10:00:00'))).toBe('open')
	})

	it('is closed after closing time', () => {
		expect(openState(blueberry, hamburg('2026-11-23T17:30:00'))).toBe('closed')
		expect(openState(blueberry, hamburg('2026-11-27T16:30:00'))).toBe('closed')
	})

	it('is closed on a day without hours', () => {
		expect(openState(blueberry, hamburg('2026-11-28T10:00:00'))).toBe('closed')
		expect(openState(alexanderstrasse, hamburg('2026-11-26T10:00:00'))).toBe(
			'closed'
		)
	})

	it('is unknown when any line could not be parsed', () => {
		const lines = [
			...blueberry,
			{ days: 'Weekends', time: 'by arrangement', parsed: null }
		]
		expect(openState(lines, hamburg('2026-11-23T10:00:00'))).toBe('unknown')
	})

	it('is unknown without any lines', () => {
		expect(openState([], hamburg('2026-11-23T10:00:00'))).toBe('unknown')
	})

	it('uses Hamburg time whatever the device time zone', () => {
		// 09:00 UTC is 10:00 in Hamburg.
		expect(openState(blueberry, new Date('2026-11-23T09:00:00Z'))).toBe('open')
		// 07:00 UTC is 08:00 in Hamburg, 07:00 in UTC itself would be closed.
		expect(openState(blueberry, new Date('2026-11-23T07:00:00Z'))).toBe('open')
		// 16:30 UTC is 17:30 in Hamburg.
		expect(openState(blueberry, new Date('2026-11-23T16:30:00Z'))).toBe(
			'closed'
		)
	})
})

describe('todayLines', () => {
	it('returns the lines that cover today in Hamburg', () => {
		expect(todayLines(blueberry, hamburg('2026-11-27T10:00:00'))).toEqual([
			{ days: 'Friday', time: '07:45 a.m. to 04:00 p.m.' }
		])
	})

	it('returns nothing on a day without hours', () => {
		expect(
			todayLines(alexanderstrasse, hamburg('2026-11-26T10:00:00'))
		).toEqual([])
	})

	it('leaves out lines that could not be parsed', () => {
		const lines = [{ days: 'Daily', time: 'varies', parsed: null }]
		expect(todayLines(lines, hamburg('2026-11-23T10:00:00'))).toEqual([])
	})
})

describe('daylight saving time switches', () => {
	const places = [blueberry, alexanderstrasse, berlinerTorMensa]

	it('reads 02:30 on Sunday 25 October 2026 (CEST to CET)', () => {
		const now = new Date('2026-10-25T00:30:00Z')
		expect(hamburgClock(now)).toEqual({ weekday: 7, time: '02:30' })
		for (const lines of places) expect(openState(lines, now)).toBe('closed')
	})

	it('reads 03:30 on Sunday 29 March 2026 (CET to CEST)', () => {
		const now = new Date('2026-03-29T01:30:00Z')
		expect(hamburgClock(now)).toEqual({ weekday: 7, time: '03:30' })
		for (const lines of places) expect(openState(lines, now)).toBe('closed')
	})

	it('uses summer time on the Monday after the switch', () => {
		// 06:00 UTC is 08:00 CEST; with winter time it would be 07:00, closed.
		const now = new Date('2026-03-30T06:00:00Z')
		expect(hamburgClock(now)).toEqual({ weekday: 1, time: '08:00' })
		expect(openState(blueberry, now)).toBe('open')
	})
})
