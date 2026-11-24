import { describe, expect, it } from 'bun:test'
import { calendarRecordPayload } from '@/utils/calendar-record'

const linkCalendar = {
	name: 'myHAW',
	sourceType: 'link' as const,
	updatedAt: '2026-10-31T10:01:10.265Z'
}

describe('calendarRecordPayload', () => {
	it('attaches the private link when it is available', () => {
		expect(
			calendarRecordPayload('account.u1', linkCalendar, 'https://x.invalid/c')
		).toEqual({ ...linkCalendar, privateLink: 'https://x.invalid/c' })
	})

	it('keeps a guest calendar whose private link is missing from secure storage', () => {
		expect(calendarRecordPayload('guest', linkCalendar, null)).toEqual(
			linkCalendar
		)
	})

	it('refuses to describe an account calendar without its link', () => {
		// Syncing a link-less payload would erase the link from the cloud copy.
		expect(() =>
			calendarRecordPayload('account.u1', linkCalendar, null)
		).toThrow('CalendarLinkUnavailable')
	})

	it('never adds a link to file calendars', () => {
		const file = { ...linkCalendar, sourceType: 'file' as const }
		expect(calendarRecordPayload('account.u1', file, null)).toEqual(file)
	})
})
