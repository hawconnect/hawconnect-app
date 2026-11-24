export interface ImportedCalendarComponent {
	uid: string
	recurrenceId: string | null
	start: string
	end: string | null
	startIsDate: boolean
	timeZone: string | null
	sequence: number
	dtstamp: string | null
	status: string | null
	raw: string
}

export interface CalendarPreview {
	raw: string
	eventCount: number
	defaultTimeZone: string
	components?: ImportedCalendarComponent[]
	diagnostics?: string[]
}
export interface CalendarSnapshot extends CalendarPreview {
	id: string
	name: string
	sourceType: 'file' | 'link' | 'demo'
	updatedAt: string
}
export interface ImportedOccurrence {
	key: string
	calendarId: string
	uid: string
	title: string
	description: string
	location: string
	start: string
	end: string
	allDay: boolean
}
