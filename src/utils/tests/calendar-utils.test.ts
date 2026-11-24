import { beforeAll, describe, expect, it, mock } from 'bun:test'
import type { i18n } from 'i18next'
import type { Calendar } from '@/types/data'

const SRC_ROOT = new URL('../../', import.meta.url).pathname

mock.module('expo-localization', () => ({
	getLocales: () => [{ languageCode: 'de' }]
}))

mock.module('react-i18next', () => ({
	initReactI18next: {}
}))

mock.module(`${SRC_ROOT}localization/i18n.ts`, () => ({
	default: { language: 'de' }
}))

mock.module('i18next', () => ({
	t: (key: string) => key
}))

let calendarUtils: typeof import('../calendar-utils')

beforeAll(async () => {
	calendarUtils = await import('../calendar-utils')
})

describe('calendar-utils', () => {
	describe('convertCalendarToWeekViewEvents', () => {
		const i18nMock = { language: 'de' } as i18n

		it('maps all-day events to midnight boundaries', () => {
			const entries: Calendar[] = [
				{
					id: 'holiday',
					name: { de: 'Feiertag', en: 'Holiday' },
					begin: new Date('2026-06-04T00:00:00'),
					end: new Date('2026-06-05T00:00:00'),
					hasHours: false
				}
			]

			const [event] = calendarUtils.convertCalendarToWeekViewEvents(
				entries,
				i18nMock,
				'#123456',
				'#ffffff'
			)

			expect(event.title).toBe('Feiertag')
			expect(event.color).toBe('#123456')
			expect(event.textColor).toBe('#ffffff')
			expect(event.start.getHours()).toBe(0)
			expect(event.end.getHours()).toBe(0)
		})

		it('keeps timed events at their original start and end', () => {
			const begin = new Date('2026-06-04T08:15:00')
			const end = new Date('2026-06-04T09:45:00')
			const entries: Calendar[] = [
				{
					id: 'lecture',
					name: { de: 'Vorlesung', en: 'Lecture' },
					begin,
					end,
					hasHours: true
				}
			]

			const [event] = calendarUtils.convertCalendarToWeekViewEvents(
				entries,
				i18nMock,
				'#654321',
				'#000000'
			)

			expect(event.start).toBe(begin)
			expect(event.end).toBe(end)
			expect(event.title).toBe('Vorlesung')
		})
	})
})
