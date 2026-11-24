import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { contentColumn } from '@/components/Layout/content-column'
import CalendarImportScreen from '@/components/Timetable/calendar-import-screen'
import TimetableList from '@/components/Timetable/timetable-list'
import TimetableWeek from '@/components/Timetable/timetable-week'
import Button from '@/components/Universal/button'
import { useImportedCalendarStore } from '@/hooks/useImportedCalendarStore'
import { TimetableMode, useTimetableStore } from '@/hooks/useTimetableStore'
import { useTransparentHeaderPadding } from '@/hooks/useTransparentHeader'
import { expandCalendar } from '@/utils/ical-import'
import { toFriendlyTimetable } from '@/utils/imported-timetable-adapter'

export const loadTimetable = async () => {
	const now = Date.now()
	return toFriendlyTimetable(
		useImportedCalendarStore
			.getState()
			.calendars.flatMap((c) =>
				expandCalendar(
					c,
					new Date(now - 180 * 86400000),
					new Date(now + 365 * 86400000)
				)
			)
	)
}

export default function TimetableScreen(): React.JSX.Element {
	const { t } = useTranslation(['timetable', 'navigation'])
	const insets = useSafeAreaInsets()
	const headerPadding = useTransparentHeaderPadding()
	// SafeAreaView already supplies the status-bar inset; add only the overlay header.
	const navigationPadding = Math.max(0, headerPadding - insets.top)
	const calendars = useImportedCalendarStore((s) => s.calendars)
	const mode = useTimetableStore((s) => s.timetableMode)
	const selectedDate = useTimetableStore((s) => s.selectedDate)
	const [showAllDay, setShowAllDay] = useState(false)
	const { events, error } = useMemo(() => {
		try {
			const date = new Date(selectedDate).getTime()
			return {
				events: calendars.flatMap((c) =>
					expandCalendar(
						c,
						new Date(date - 31 * 86400000),
						new Date(date + 62 * 86400000)
					)
				),
				error: false
			}
		} catch {
			return { events: [], error: true }
		}
	}, [calendars, selectedDate])
	const timetable = useMemo(() => toFriendlyTimetable(events), [events])
	const allDay = events.filter((e) => e.allDay)
	return (
		<SafeAreaView
			testID="timetable-screen"
			style={[styles.page, { paddingTop: navigationPadding }]}
			className="bg-background"
			edges={['top', 'bottom']}
		>
			<View className="px-page py-2 gap-2" style={contentColumn()}>
				{error && (
					<Text className="text-notification">{t('import.failed')}</Text>
				)}
				{allDay.length > 0 && (
					<Button
						variant="secondary"
						onPress={() => setShowAllDay(!showAllDay)}
					>
						{t('import.allDayCount', { count: allDay.length })}
					</Button>
				)}
				{showAllDay &&
					allDay.slice(0, 20).map((e) => (
						<Text key={e.key} className="text-text">
							{e.title} · {e.start} → {e.end} ({t('import.allDay')})
						</Text>
					))}
			</View>
			{calendars.length === 0 ? (
				// No calendar yet: the import form itself, so the first step is right here.
				<CalendarImportScreen />
			) : mode === TimetableMode.List ? (
				<View style={[styles.page, contentColumn()]}>
					<TimetableList timetable={timetable} />
				</View>
			) : (
				<TimetableWeek timetable={timetable} />
			)}
		</SafeAreaView>
	)
}

// SafeAreaView comes from a third-party package; native flex sizing must
// be explicit so CalendarKit receives a non-zero layout and fires onLoad.
const styles = StyleSheet.create({ page: { flex: 1 } })
