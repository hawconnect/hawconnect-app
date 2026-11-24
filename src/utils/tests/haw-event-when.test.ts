import { describe, expect, it } from 'bun:test'
import { hawEventWhen } from '../haw-event-when'

const event = {
	date: '2026-11-17',
	dateLabel: 'Di., 17.11.2026',
	timeLabel: '16:00 – 19:00 Uhr',
	startTime: '2026-11-17T15:00:00.000Z',
	endTime: '2026-11-17T18:00:00.000Z'
}

describe('hawEventWhen', () => {
	it('writes English dates and Hamburg times for English readers', () => {
		expect(hawEventWhen(event, 'en')).toBe('Tue, 17 Nov 2026 · 16:00 – 19:00')
	})
	it('keeps the familiar German form', () => {
		expect(hawEventWhen(event, 'de')).toBe(
			'Di., 17.11.2026 · 16:00 – 19:00 Uhr'
		)
	})
	it('shows multi-day events and events without times', () => {
		expect(
			hawEventWhen(
				{ ...event, endDate: '2026-11-19', startTime: null, endTime: null },
				'en'
			)
		).toBe('Tue, 17 Nov 2026 – Thu, 19 Nov 2026')
	})
	it('falls back to the website text when the date is unusable', () => {
		expect(hawEventWhen({ ...event, date: 'soon' }, 'en')).toBe(
			'Di., 17.11.2026 · 16:00 – 19:00 Uhr'
		)
	})
})
