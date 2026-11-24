/**
 * "Open now" for the Studierendenwerk cafés and mensas, always in Hamburg
 * time, whatever the device's time zone. A line the backend could not parse
 * (`parsed: null`) means the hours are not known, so no hint is given.
 */

const ZONE = 'Europe/Berlin'

export interface ParsedOpening {
	/** ISO weekdays, 1 = Monday … 7 = Sunday. */
	weekdays: number[]
	/** 24 h `HH:MM`. */
	open: string
	/** 24 h `HH:MM`. */
	close: string
}

export interface OpeningLine {
	days: string
	time: string
	parsed: ParsedOpening | null
}

export type OpenState = 'open' | 'closed' | 'unknown'

const WEEKDAYS: Record<string, number> = {
	Mon: 1,
	Tue: 2,
	Wed: 3,
	Thu: 4,
	Fri: 5,
	Sat: 6,
	Sun: 7
}

/** The ISO weekday and `HH:MM` time in Hamburg at `now`. */
export function hamburgClock(now: Date): { weekday: number; time: string } {
	const parts = new Intl.DateTimeFormat('en-GB', {
		weekday: 'short',
		hour: '2-digit',
		minute: '2-digit',
		hourCycle: 'h23',
		timeZone: ZONE
	}).formatToParts(now)
	const part = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
	return {
		weekday: WEEKDAYS[part('weekday')] ?? 0,
		time: `${part('hour').padStart(2, '0')}:${part('minute').padStart(2, '0')}`
	}
}

/**
 * Whether a place is open at `now` (Hamburg time). `'unknown'` when there are
 * no lines or any line could not be parsed.
 */
export function openState(
	lines: { parsed: ParsedOpening | null }[],
	now: Date
): OpenState {
	if (lines.length === 0 || lines.some((line) => line.parsed == null)) {
		return 'unknown'
	}
	const { weekday, time } = hamburgClock(now)
	const open = lines.some(({ parsed }) => {
		if (parsed == null || !parsed.weekdays.includes(weekday)) return false
		return parsed.open <= time && time < parsed.close
	})
	return open ? 'open' : 'closed'
}

/**
 * The published lines that apply to today in Hamburg. Lines that could not be
 * parsed are left out, since it is not known which days they cover.
 */
export function todayLines(
	lines: OpeningLine[],
	now: Date
): { days: string; time: string }[] {
	const { weekday } = hamburgClock(now)
	return lines
		.filter((line) => line.parsed?.weekdays.includes(weekday) === true)
		.map(({ days, time }) => ({ days, time }))
}
