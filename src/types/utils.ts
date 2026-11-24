export interface FriendlyDateOptions {
	weekday?: 'short' | 'long'
	relative?: boolean
}

export interface Labels {
	[key: string]: string
	guest: string
	employee: string
	student: string
}

export interface Prices {
	[key: string]: number
	guest: number
	employee: number
	student: number
}

export interface FriendlyTimetableEntry {
	date: Date
	startDate: Date
	endDate: Date
	name: string
	shortName: string
	rooms: string[]
	lecturer: string | null
	lecturerIds: string[]
	exam?: string
	course: string
	studyGroup: string
	sws: string
	ects: string
	goal: string | null
	contents: string | null
	literature: string | null
}

export interface TimetableEntry extends FriendlyTimetableEntry {
	eventType: 'timetable'
}
export interface CalendarTimetableEntry extends FriendlyTimetableEntry {
	eventType: string
	color: string
	id: number
	startDate: Date
	endDate: Date
}

export interface TimetableSections {
	title: Date
	data: TimetableEntry[]
}

export interface CalendarEvent {
	start: Date
	end: Date
	title: string
	textColor: string
	color: string
	location?: string
	entry?: FriendlyTimetableEntry
}
