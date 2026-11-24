import type { i18n } from 'i18next'
import rawCalendar from '@/data/calendar.json'
import type { LanguageKey } from '@/localization/i18n'
import type { Calendar, Semester } from '@/types/data'
import type { CalendarEvent } from '@/types/utils'

import { ignoreTime } from './date-utils'

export const compileTime = new Date()

// Extract and flatten events from all semesters
export const calendar: Calendar[] = rawCalendar.semesters
	.flatMap((semester: Semester) =>
		semester.events.map((event) => ({
			...event,
			semesterName: semester.name
		}))
	)
	.map((x: unknown) => {
		const event: Calendar = {
			...(x as Calendar),
			begin: new Date((x as Calendar).begin),
			end:
				(x as Calendar).end != null
					? new Date((x as Calendar).end as unknown as string)
					: undefined
		}

		return event
	})
	.filter(
		(x) => (x.end != null && x.end > compileTime) || x.begin > compileTime
	)
	.sort((a, b) => (a.end?.getTime() ?? 0) - (b.end?.getTime() ?? 0))
	.sort((a, b) => a.begin.getTime() - b.begin.getTime())

// Get the raw semesters for displaying in sections
export const semesters = rawCalendar.semesters
	.filter((semester) =>
		semester.events.some((event) => {
			const beginDate = new Date(event.begin)
			const endDate = event.end ? new Date(event.end) : beginDate
			return endDate > compileTime
		})
	)
	.map((semester) => ({
		...semester,
		events: semester.events
			.map((event) => ({
				...event,
				begin: new Date(event.begin),
				end: event.end ? new Date(event.end) : undefined
			}))
			.filter(
				(event) =>
					(event.end && event.end > compileTime) || event.begin > compileTime
			)
			.sort((a, b) => a.begin.getTime() - b.begin.getTime())
	}))

export function convertCalendarToWeekViewEvents(
	entries: Calendar[],
	i18n: i18n,
	color: string,
	textColor: string
): CalendarEvent[] {
	return entries.map((entry) => {
		const allDay = entry.hasHours === false || !entry.hasHours
		const endDate = entry.end ?? entry.begin

		return {
			start: allDay ? ignoreTime(entry.begin) : entry.begin,
			end: allDay ? ignoreTime(endDate) : endDate,
			title: entry?.name[i18n.language as LanguageKey],
			color,
			textColor
		}
	})
}
