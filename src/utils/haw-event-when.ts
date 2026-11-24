/**
 * The HAW website writes event dates in German even on its English pages
 * ("Di., 17.11.2026 · 16:00 – 19:00 Uhr"). Format them from the raw values in
 * the reader's language instead, in Hamburg time.
 */
export interface HawEventDates {
	date: string
	endDate?: string | null
	dateLabel: string
	timeLabel?: string | null
	startTime?: string | null
	endTime?: string | null
}

const ZONE = 'Europe/Berlin'

export function hawEventWhen(event: HawEventDates, language: string): string {
	const de = language.startsWith('de')
	const locale = de ? 'de-DE' : 'en-GB'
	// "Di., 17.11.2026" / "Tue, 17 Nov 2026": weekday, comma, date.
	const day = (iso: string) => {
		const at = new Date(`${iso}T12:00:00Z`)
		const weekday = new Intl.DateTimeFormat(locale, {
			weekday: 'short',
			timeZone: 'UTC'
		}).format(at)
		const date = new Intl.DateTimeFormat(locale, {
			day: de ? '2-digit' : 'numeric',
			month: de ? '2-digit' : 'short',
			year: 'numeric',
			timeZone: 'UTC'
		}).format(at)
		// German abbreviations take a full stop ("Di."); the standalone format leaves it out.
		const short = de && !weekday.endsWith('.') ? `${weekday}.` : weekday
		return `${short}, ${date}`
	}
	const time = (iso: string) =>
		new Intl.DateTimeFormat(locale, {
			hour: '2-digit',
			minute: '2-digit',
			hourCycle: 'h23',
			timeZone: ZONE
		}).format(new Date(iso))
	if (!/^\d{4}-\d{2}-\d{2}$/.test(event.date))
		return [event.dateLabel, event.timeLabel].filter(Boolean).join(' · ')
	const days =
		event.endDate && event.endDate !== event.date
			? `${day(event.date)} – ${day(event.endDate)}`
			: day(event.date)
	const valid = (iso?: string | null) =>
		iso != null && Number.isFinite(Date.parse(iso))
	if (!valid(event.startTime)) return days
	const start = time(event.startTime as string)
	const range = valid(event.endTime)
		? `${start} – ${time(event.endTime as string)}`
		: start
	return `${days} · ${de ? `${range} Uhr` : range}`
}
