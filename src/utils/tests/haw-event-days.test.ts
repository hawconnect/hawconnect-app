import { describe, expect, it } from 'bun:test'
import {
	dayHeading,
	eventTimes,
	groupByDay,
	groupEventsByDay,
	hamburgDay,
	shortDay
} from '../haw-event-days'

const now = new Date('2026-11-17T20:30:00Z') // 21:30 in Hamburg
const event = (id: string, date: string, endDate: string | null = null) => ({
	id,
	date,
	endDate,
	dateLabel: '',
	startTime: null,
	endTime: null
})

describe('groupEventsByDay', () => {
	it('adds a heading when the day changes and names today and tomorrow', () => {
		const items = groupEventsByDay(
			[
				event('a', '2026-11-17'),
				event('b', '2026-11-18'),
				event('c', '2026-11-18'),
				event('d', '2026-11-20')
			],
			now
		)
		expect(
			items.map((i) => (i.type === 'day' ? `#${i.kind}:${i.date}` : i.key))
		).toEqual([
			'#today:2026-11-17',
			'a',
			'#tomorrow:2026-11-18',
			'b',
			'c',
			'#date:2026-11-20',
			'd'
		])
	})
	it('lists a multi-day event that already began under today', () => {
		const items = groupEventsByDay(
			[event('long', '2026-11-15', '2026-11-19')],
			now
		)
		expect(items[0]).toMatchObject({ type: 'day', kind: 'today' })
	})
	it('uses Hamburg time for "today" around midnight UTC', () => {
		expect(hamburgDay(new Date('2026-11-17T23:30:00Z'))).toBe('2026-11-18')
	})
})

describe('eventTimes', () => {
	it('gives Hamburg start and end times', () => {
		expect(
			eventTimes({
				startTime: '2026-11-18T17:00:00.000Z',
				endTime: '2026-11-18T19:00:00.000Z'
			})
		).toEqual({ start: '18:00', end: '20:00' })
	})
	it('handles a missing end and a missing start', () => {
		expect(
			eventTimes({ startTime: '2026-11-18T18:00:00.000Z', endTime: null })
		).toEqual({ start: '19:00', end: null })
		expect(eventTimes({ startTime: null, endTime: null })).toBeNull()
	})
})

describe('dayHeading', () => {
	it('writes the day in the reader language', () => {
		expect(dayHeading('2026-11-19', 'en')).toBe('Thu, 19 Nov')
		expect(dayHeading('2026-11-19', 'de')).toBe('Do., 19. Nov.')
		expect(shortDay('2026-11-26', 'en')).toBe('26 Nov')
		expect(shortDay('2026-11-26', 'de')).toBe('26. Nov.')
	})
})

describe('groupByDay', () => {
	it('groups timestamped items by their Hamburg day', () => {
		const items = groupByDay(
			[
				{ id: 'late', at: '2026-11-17T22:30:00Z' }, // 23:30 Hamburg, still the 17th
				{ id: 'next', at: '2026-11-17T23:30:00Z' } // 00:30 Hamburg, the 18th
			],
			{ key: (i) => i.id, day: (i) => hamburgDay(new Date(i.at)) },
			now
		)
		expect(items.map((i) => (i.type === 'day' ? `#${i.kind}` : i.key))).toEqual(
			['#today', 'late', '#tomorrow', 'next']
		)
	})
})
