import { describe, expect, it } from 'bun:test'
import { expandCalendar, parseCalendar, replaceCalendar } from '../ical-import'

const wrap = (events: string) =>
	`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//HAWConnect//Tests//EN\r\n${events}\r\nEND:VCALENDAR`
const event = (
	extra = '',
	start = '20261019T090000Z',
	end = '20261019T103000Z'
) =>
	`BEGIN:VEVENT\r\nUID:class-1\r\nDTSTART:${start}\r\nDTEND:${end}\r\nSUMMARY:Programming\r\nLOCATION:Berliner Tor\r\n${extra}\r\nEND:VEVENT`
const range = [new Date('2026-10-01'), new Date('2026-12-01')] as const
const occurrences = (text: string) =>
	expandCalendar(
		{
			...parseCalendar(text),
			id: 'one',
			name: 'Classes',
			sourceType: 'file',
			updatedAt: '2026-10-19T00:00:00Z'
		},
		...range
	)
describe('calendar imports', () => {
	it('rejects malformed calendars and missing event identity', () => {
		expect(() => parseCalendar('not a calendar')).toThrow()
		expect(() =>
			parseCalendar(wrap(event().replace('UID:class-1\r\n', '')))
		).toThrow()
	})
	it('omits token-bearing URL and ATTACH properties from persisted preview data', () => {
		const preview = parseCalendar(
			wrap(
				event(
					'URL:https://example.test/calendar.ics?token=secret-token\r\nATTACH:https://example.test/file?sig=secret-signature'
				)
			)
		)

		expect(preview.raw).not.toContain('secret-token')
		expect(preview.raw).not.toContain('secret-signature')
		expect(preview.components?.[0]?.raw).not.toContain('secret-token')
		expect(preview.components?.[0]?.raw).not.toContain('secret-signature')
	})
	it('removes links embedded in free-text and custom properties', () => {
		const preview = parseCalendar(
			wrap(
				event(
					'DESCRIPTION:Join https://zoom.example/j/1?pwd=zoom-secret now\r\n' +
						'COMMENT:Slides: http://moodle.example/file?authtoken=moodle-secret\r\n' +
						'X-ALT-DESC;FMTTYPE=text/html:<a href="https://x.example/?k=x-secret">x</a>\r\n' +
						'CONTACT;ALTREP="https://dir.example/?id=altrep-secret":Prof. Example'
				).replace(
					'LOCATION:Berliner Tor',
					'LOCATION:Online https://meet.example/room-secret'
				)
			)
		)

		for (const secret of [
			'zoom-secret',
			'moodle-secret',
			'x-secret',
			'altrep-secret',
			'room-secret'
		]) {
			expect(preview.raw).not.toContain(secret)
			expect(preview.components?.[0]?.raw).not.toContain(secret)
		}
		expect(preview.raw).toContain('Join')
		expect(preview.raw).toContain('Prof. Example')
	})
	it('keeps ordinary text containing query-like punctuation', () => {
		const preview = parseCalendar(
			wrap(event().replace('SUMMARY:Programming', 'SUMMARY:Q&A: why? R&D'))
		)

		expect(preview.raw).toContain('SUMMARY:Q&A: why? R&D')
	})
	it('omits token-bearing properties outside VEVENT components', async () => {
		const input = await Bun.file(
			new URL(
				'./fixtures/calendar/non-event-sensitive-properties.ics',
				import.meta.url
			)
		).text()
		const preview = parseCalendar(input)

		expect(preview.raw).not.toContain('calendar-secret')
		expect(preview.raw).not.toContain('task-secret')
	})
	it('keeps conflicting VTIMEZONE imports isolated in either order', () => {
		const zone = (offset: string, summary: string) =>
			`BEGIN:VTIMEZONE\r\nTZID:Custom/Calendar\r\nBEGIN:STANDARD\r\nDTSTART:20261025T030000\r\nTZOFFSETFROM:${offset}\r\nTZOFFSETTO:${offset}\r\nSUMMARY:${summary}\r\nEND:STANDARD\r\nEND:VTIMEZONE`
		const calendar = (timezone: string) =>
			`BEGIN:VCALENDAR\r\nVERSION:2.0\r\n${timezone}\r\n${event()
				.replace(
					'DTSTART:20261019T090000Z',
					'DTSTART;TZID=Custom/Calendar:20261026T090000'
				)
				.replace(
					'DTEND:20261019T103000Z',
					'DTEND;TZID=Custom/Calendar:20261026T100000'
				)}\r\nEND:VCALENDAR`
		const first = parseCalendar(calendar(zone('+0100', 'One')))
		const second = parseCalendar(calendar(zone('+0300', 'Two')))
		const firstOccurrence = expandCalendar(
			{
				...first,
				id: 'one',
				name: 'One',
				sourceType: 'file',
				updatedAt: 'now'
			},
			new Date('2026-10-26'),
			new Date('2026-10-27')
		)[0]
		const secondOccurrence = expandCalendar(
			{
				...second,
				id: 'two',
				name: 'Two',
				sourceType: 'file',
				updatedAt: 'now'
			},
			new Date('2026-10-26'),
			new Date('2026-10-27')
		)[0]
		expect(firstOccurrence.start).toBe('2026-10-26T08:00:00.000Z')
		expect(secondOccurrence.start).toBe('2026-10-26T06:00:00.000Z')
	})
	it('preserves timed event text and location', () => {
		const [e] = occurrences(wrap(event('DESCRIPTION:Bring a laptop')))
		expect(e.title).toBe('Programming')
		expect(e.location).toBe('Berliner Tor')
		expect(e.description).toBe('Bring a laptop')
		expect(e.start).toBe('2026-10-19T09:00:00.000Z')
	})
	it('expands weekly rules and exclusions without duplicates', () => {
		const e = occurrences(
			wrap(event('RRULE:FREQ=WEEKLY;COUNT=3\r\nEXDATE:20261026T090000Z'))
		)
		expect(e).toHaveLength(2)
		expect(new Set(e.map((x) => x.key)).size).toBe(2)
	})
	it('adds RDATE occurrences while retaining EXDATE exclusions', () => {
		const e = occurrences(
			wrap(
				event(
					'RRULE:FREQ=WEEKLY;COUNT=3\r\nRDATE:20261110T090000Z\r\nEXDATE:20261026T090000Z'
				)
			)
		)
		expect(e.map((entry) => entry.start)).toEqual([
			'2026-10-19T09:00:00.000Z',
			'2026-11-02T09:00:00.000Z',
			'2026-11-10T09:00:00.000Z'
		])
	})
	it('applies modified and cancelled recurrence instances', () => {
		const override = event(
			'RECURRENCE-ID:20261026T090000Z',
			'20261026T110000Z',
			'20261026T123000Z'
		)
		const cancel = event(
			'RECURRENCE-ID:20261102T090000Z\r\nSTATUS:CANCELLED',
			'20261102T090000Z',
			'20261102T103000Z'
		)
		const e = occurrences(
			wrap(`${event('RRULE:FREQ=WEEKLY;COUNT=3')}\r\n${override}\r\n${cancel}`)
		)
		expect(e).toHaveLength(2)
		expect(e[1].start).toBe('2026-10-26T11:00:00.000Z')
	})
	it('preserves all-day exclusive end dates', () => {
		const e = occurrences(
			wrap(
				'BEGIN:VEVENT\r\nUID:holiday\r\nDTSTART;VALUE=DATE:20261024\r\nDTEND;VALUE=DATE:20261027\r\nSUMMARY:Holiday\r\nEND:VEVENT'
			)
		)[0]
		expect(e.allDay).toBe(true)
		expect(e.start).toBe('2026-10-24')
		expect(e.end).toBe('2026-10-27')
	})
	it('uses Berlin daylight saving for floating local times', () => {
		const e = occurrences(
			wrap(
				event('RRULE:FREQ=WEEKLY;COUNT=2', '20261019T090000', '20261019T103000')
			)
		)
		expect(e[0].start).toBe('2026-10-19T07:00:00.000Z')
		expect(e[1].start).toBe('2026-10-26T08:00:00.000Z')
	})
	it('rejects unknown timezones', () => {
		expect(() =>
			parseCalendar(
				wrap(event().replace('DTSTART:', 'DTSTART;TZID=Unknown/Zone:'))
			)
		).toThrow()
	})
	it('retains the highest sequence of a repeated UID', () => {
		const text = wrap(
			event('SEQUENCE:1') +
				'\r\n' +
				event('SEQUENCE:2').replace('SUMMARY:Programming', 'SUMMARY:Updated')
		)
		expect(occurrences(text)).toHaveLength(1)
		expect(occurrences(text)[0].title).toBe('Updated')
	})
	it('atomically replaces only one calendar', () => {
		const a = {
			...parseCalendar(wrap(event())),
			id: 'a',
			name: 'A',
			sourceType: 'file' as const,
			updatedAt: 'now'
		}
		const b = { ...a, id: 'b' }
		const next = { ...a, name: 'Changed' }
		const result = replaceCalendar([a, b], next)
		expect(result).toHaveLength(2)
		expect(result[1]).toBe(b)
		expect(a.name).toBe('A')
	})
	it('rejects oversized files and excessively dense recurrences', () => {
		expect(() => parseCalendar('x'.repeat(2_000_001))).toThrow()
		expect(() =>
			occurrences(wrap(event('RRULE:FREQ=SECONDLY;COUNT=20000')))
		).toThrow()
	})
})
