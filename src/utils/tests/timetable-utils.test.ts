import { beforeAll, describe, expect, it, mock } from 'bun:test'
import type { Calendar } from '@/types/data'
import type { FriendlyTimetableEntry } from '@/types/utils'

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

const mockGetTimetable = mock(
	async (): Promise<{
		timetable: unknown[]
		holidays: unknown[]
		semester: unknown[]
	}> => ({
		timetable: [],
		holidays: [],
		semester: []
	})
)

mock.module(`${SRC_ROOT}api/university-authenticated-api.ts`, () => ({
	default: {
		getTimetable: mockGetTimetable
	}
}))

let timetableUtils: typeof import('../timetable-utils')

const formatYmd = (d: Date) =>
	`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

beforeAll(async () => {
	timetableUtils = await import('../timetable-utils')
})

describe('timetable-utils', () => {
	it('getGroupedTimetable - Should group timetable and calendar entries correctly', () => {
		const timetable: FriendlyTimetableEntry[] = [
			{
				date: new Date('2026-04-07T00:00:00'),
				startDate: new Date('2026-04-07T08:00:00'),
				endDate: new Date('2026-04-07T09:30:00'),
				name: 'Mathe',
				shortName: 'MATH',
				rooms: ['G101'],
				lecturer: 'Prof. X',
				lecturerIds: [],
				course: 'INF',
				studyGroup: 'INF1',
				sws: '2',
				ects: '5',
				goal: null,
				contents: null,
				literature: null
			}
		]

		const calendarEvents: Calendar[] = [
			{
				id: '1',
				name: { de: 'Feiertag', en: 'Holiday' },
				begin: new Date('2026-04-08T00:00:00'),
				end: new Date('2026-04-09T00:00:00'),
				hasHours: false
			}
		]

		const grouped = timetableUtils.getGroupedTimetable(
			timetable,
			true,
			calendarEvents
		)

		expect(grouped).toHaveLength(3)
		expect(formatYmd(grouped[0].title as Date)).toBe('2026-04-07')
		expect(grouped[0].data).toHaveLength(1)
		expect(formatYmd(grouped[1].title as Date)).toBe('2026-04-08')
		expect(formatYmd(grouped[2].title as Date)).toBe('2026-04-09')
	})

	it('convertTimetableToWeekViewEvents - Should map color, title and room', () => {
		const entries: FriendlyTimetableEntry[] = [
			{
				date: new Date('2026-04-07T00:00:00'),
				startDate: new Date('2026-04-07T08:00:00'),
				endDate: new Date('2026-04-07T09:30:00'),
				name: 'Mathe',
				shortName: 'MATH',
				rooms: ['G101'],
				lecturer: 'Prof. X',
				lecturerIds: [],
				course: 'INF',
				studyGroup: 'INF1',
				sws: '2',
				ects: '5',
				goal: null,
				contents: null,
				literature: null
			}
		]

		const events = timetableUtils.convertTimetableToWeekViewEvents(
			entries,
			'#123456',
			'#ffffff'
		)

		expect(events).toHaveLength(1)
		expect(events[0].title).toBe('MATH')
		expect(events[0].color).toBe('#123456')
		expect(events[0].textColor).toBe('#ffffff')
		expect(events[0].location).toBe('G101')
	})

	it('generateKey - Should create a stable key', () => {
		const start = new Date('2026-04-07T08:15:00')
		const key = timetableUtils.generateKey('Mathe', start, 'G101')
		expect(key).toBe(`Mathe-${start.getTime().toString()}-G101`)
	})

	it('isValidRoom - Should accept valid and reject invalid room formats', () => {
		expect(timetableUtils.isValidRoom('G101')).toBe(true)
		expect(timetableUtils.isValidRoom('BN201')).toBe(true)
		expect(timetableUtils.isValidRoom('BU12')).toBe(true)
		expect(timetableUtils.isValidRoom('101G')).toBe(false)
		expect(timetableUtils.isValidRoom('G1')).toBe(false)
		expect(timetableUtils.isValidRoom('G-101')).toBe(false)
	})

	it('getGroupedTimetable - Should handle timed calendar events without an end date', () => {
		const grouped = timetableUtils.getGroupedTimetable([], true, [
			{
				id: 'timed-1',
				name: { de: 'Workshop', en: 'Workshop' },
				begin: new Date('2026-04-07T14:00:00'),
				hasHours: true
			}
		])

		expect(grouped).toHaveLength(1)
		expect(grouped[0].data[0]).toMatchObject({
			name: { de: 'Workshop', en: 'Workshop' },
			eventType: 'calendar',
			isAllDay: false
		})
	})
})
