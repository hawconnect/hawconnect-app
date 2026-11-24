import type { Calendar } from '@/types/data'
import type {
	CalendarEvent,
	FriendlyTimetableEntry,
	TimetableSections
} from '@/types/utils'

/**
 * Groups the given timetable by date.
 * @param timetable Timetable to group
 * @returns Timetable grouped by date
 **/

export function getGroupedTimetable(
	timetable: FriendlyTimetableEntry[],
	includeCalendar = false,
	calendarEvents: Calendar[] = []
): TimetableSections[] {
	const combinedData = [
		...timetable.map((lecture) => ({ ...lecture, eventType: 'timetable' }))
	]

	if (includeCalendar && calendarEvents.length > 0) {
		const processedCalendarEvents = calendarEvents.map((event) => {
			const originalStartDate = new Date(event.begin)
			const originalEndDate = event.end ? new Date(event.end) : null

			const startDate = new Date(event.begin)

			let endDate: Date
			if (event.end) {
				endDate = new Date(event.end)
			} else {
				endDate = new Date(startDate)
				if (event.hasHours) {
					endDate.setHours(endDate.getHours() + 2)
				}
			}

			const isAllDay = event.hasHours !== true

			if (isAllDay && originalEndDate) {
				const eventDays = []
				const currentDate = new Date(startDate)
				currentDate.setHours(0, 0, 0, 0)

				while (currentDate <= endDate) {
					eventDays.push({
						id: event.id,
						date: new Date(currentDate),
						startDate: new Date(currentDate),
						endDate: null,
						originalStartDate,
						originalEndDate,
						name: event.name,
						isAllDay: true,
						eventType: 'calendar'
					})

					currentDate.setDate(currentDate.getDate() + 1)
				}
				return eventDays
			}
			return [
				{
					date: startDate,
					startDate,
					endDate: isAllDay ? null : endDate,
					originalStartDate,
					originalEndDate,
					name: event.name,
					isAllDay,
					eventType: 'calendar'
				}
			]
		})

		const flattenedCalendarEvents = processedCalendarEvents.flat()
		// biome-ignore lint/suspicious/noExplicitAny: TODO
		combinedData.push(...(flattenedCalendarEvents as any))
	}

	// Sort combinedData by date
	combinedData.sort(
		(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
	)

	const dates = [
		...new Set(
			combinedData.map(
				(item) => new Date(item.date).toISOString().split('T')[0]
			)
		)
	]

	const groups = dates.map((date) => ({
		title: new Date(date),
		data: combinedData.filter(
			(item) => new Date(item.date).toISOString().split('T')[0] === date
		)
	}))

	return groups as TimetableSections[]
}

export function convertTimetableToWeekViewEvents(
	entries: FriendlyTimetableEntry[],
	color: string,
	textColor: string
): CalendarEvent[] {
	return entries.map((entry) => {
		return {
			start: entry.startDate,
			end: entry.endDate,
			title: entry.shortName,
			color,
			textColor,
			location: entry.rooms?.[0],
			entry
		}
	})
}

/**
 * Generate a key for a lecture to be used for the notification hashmap
 * @param lectureName
 * @param startDate
 * @param room
 * @returns {string}
 */
export function generateKey(
	lectureName: string,
	startDate: Date | string,
	room: string
): string {
	return `${lectureName}-${new Date(startDate).getTime().toString()}-${room}`
}

// This function checks if a given room string is valid based on the following criteria:
// - The room string must start with 1 or 2 alphabetic characters (A-Z or a-z).
// - Followed by 3 numeric digits (0-9).
// - Optionally, it can have a 'U' in place of the first digit for basement rooms.
export const isValidRoom = (room: string): boolean => {
	return /^[A-Za-z]{1,2}U?\d{2,3}$/.test(room)
}
