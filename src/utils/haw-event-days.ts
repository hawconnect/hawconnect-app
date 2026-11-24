/**
 * Groups HAW events under day headings for the events list, and gives each
 * row its start and end time. All in Hamburg time.
 */
import type { HawEventDates } from './haw-event-when'

const ZONE = 'Europe/Berlin'

export type DayKind = 'today' | 'tomorrow' | 'date'

export type EventListItem<T> =
	| { type: 'day'; key: string; kind: DayKind; date: string }
	| { type: 'event'; key: string; event: T }

/** The calendar day in Hamburg as YYYY-MM-DD. */
export function hamburgDay(at: Date): string {
	return new Intl.DateTimeFormat('en-CA', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		timeZone: ZONE
	}).format(at)
}

const addDays = (day: string, n: number) => {
	const at = new Date(`${day}T12:00:00Z`)
	at.setUTCDate(at.getUTCDate() + n)
	return at.toISOString().slice(0, 10)
}

/**
 * Keeps the order the items arrive in (the sources sort them) and inserts a
 * heading whenever the day changes. A multi-day item that has already begun
 * is listed under today.
 */
export function groupByDay<T>(
	items: T[],
	get: {
		key: (item: T) => string
		/** YYYY-MM-DD in Hamburg, or null when unknown. */
		day: (item: T) => string | null
		endDay?: (item: T) => string | null
	},
	now: Date
): EventListItem<T>[] {
	const today = hamburgDay(now)
	const tomorrow = addDays(today, 1)
	const out: EventListItem<T>[] = []
	let current: string | null = null
	for (const item of items) {
		const start = get.day(item)
		const end = get.endDay?.(item) ?? null
		const day =
			start == null
				? 'unknown'
				: start < today && end != null && end >= today
					? today
					: start
		if (day !== current) {
			current = day
			out.push({
				type: 'day',
				key: `day-${day}`,
				kind: day === today ? 'today' : day === tomorrow ? 'tomorrow' : 'date',
				date: day
			})
		}
		out.push({ type: 'event', key: get.key(item), event: item })
	}
	return out
}

const DAY = /^\d{4}-\d{2}-\d{2}$/

export function groupEventsByDay<T extends HawEventDates & { id: string }>(
	events: T[],
	now: Date
): EventListItem<T>[] {
	return groupByDay(
		events,
		{
			key: (event) => event.id,
			day: (event) => (DAY.test(event.date) ? event.date : null),
			endDay: (event) => event.endDate ?? null
		},
		now
	)
}

/** Start and end time ("18:00", "20:00") or null when the event has no time. */
export function eventTimes(
	event: Pick<HawEventDates, 'startTime' | 'endTime'>
): { start: string; end: string | null } | null {
	const format = (iso: string) =>
		new Intl.DateTimeFormat('de-DE', {
			hour: '2-digit',
			minute: '2-digit',
			hourCycle: 'h23',
			timeZone: ZONE
		}).format(new Date(iso))
	const ok = (iso?: string | null): iso is string =>
		iso != null && Number.isFinite(Date.parse(iso))
	if (!ok(event.startTime)) return null
	return {
		start: format(event.startTime),
		end: ok(event.endTime) ? format(event.endTime) : null
	}
}

/** Heading text for a dated day: "Thu, 19 Nov" / "Do., 19. Nov.". */
export function dayHeading(day: string, language: string): string {
	const de = language.startsWith('de')
	const locale = de ? 'de-DE' : 'en-GB'
	const at = new Date(`${day}T12:00:00Z`)
	const weekday = new Intl.DateTimeFormat(locale, {
		weekday: 'short',
		timeZone: 'UTC'
	}).format(at)
	const date = new Intl.DateTimeFormat(locale, {
		day: 'numeric',
		month: 'short',
		timeZone: 'UTC'
	}).format(at)
	// German weekday abbreviations take a full stop ("Do.").
	const short = de && !weekday.endsWith('.') ? `${weekday}.` : weekday
	return `${short}, ${date}`
}

/** Short day without weekday for tight spots: "26 Nov" / "26. Nov.". */
export function shortDay(day: string, language: string): string {
	return new Intl.DateTimeFormat(
		language.startsWith('de') ? 'de-DE' : 'en-GB',
		{
			day: 'numeric',
			month: 'short',
			timeZone: 'UTC'
		}
	).format(new Date(`${day}T12:00:00Z`))
}
