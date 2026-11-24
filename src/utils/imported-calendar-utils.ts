import type {
	CalendarPreview,
	CalendarSnapshot
} from '@/types/imported-calendar'

export function replaceCalendar(
	calendars: CalendarSnapshot[],
	next: CalendarSnapshot
): CalendarSnapshot[] {
	const index = calendars.findIndex((calendar) => calendar.id === next.id)
	if (index < 0) return [...calendars, next]
	return calendars.map((calendar, current) =>
		current === index ? next : calendar
	)
}

export function snapshotCalendar(
	preview: CalendarPreview,
	input: {
		id: string
		name: string
		sourceType: CalendarSnapshot['sourceType']
		now?: string
	}
): CalendarSnapshot {
	return {
		...preview,
		id: input.id,
		name: input.name,
		sourceType: input.sourceType,
		updatedAt: input.now ?? new Date().toISOString()
	}
}
