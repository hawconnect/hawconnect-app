/**
 * Builds the sync/observation payload for an imported calendar.
 *
 * A link calendar's private URL lives in secure storage and can go missing
 * (device restore, keychain reset). For an account this must stop: syncing a
 * link-less payload would erase the link from the cloud copy. A guest profile
 * never syncs, so it keeps the calendar (with its last imported events)
 * instead of blocking the whole profile.
 */
export function calendarRecordPayload<T extends { sourceType: string }>(
	profile: string,
	calendar: T,
	privateLink: string | null
): T & { privateLink?: string } {
	if (calendar.sourceType !== 'link') return calendar
	if (privateLink) return { ...calendar, privateLink }
	if (profile === 'guest') return calendar
	throw new Error('CalendarLinkUnavailable')
}
