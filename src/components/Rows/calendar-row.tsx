import { useLocalSearchParams } from 'expo-router'
import type React from 'react'
import { useTranslation } from 'react-i18next'
import { Text, View } from 'react-native'
import RelativeTimeLabel from '@/components/Universal/relative-time-label'
import type { LanguageKey } from '@/localization/i18n'
import type { Calendar } from '@/types/data'
import {
	formatFriendlyDateTimeRange,
	formatFriendlyRelativeTime
} from '@/utils/date-utils'
import { dayHeading, hamburgDay } from '@/utils/haw-event-days'

const ZONE = 'Europe/Berlin'

/**
 * One semester date: a date tile (day and month), the name, then the weekday
 * for single days or "until …" for periods, and how far away it is.
 */
const CalendarRow = ({ event }: { event: Calendar }): React.JSX.Element => {
	const { t, i18n } = useTranslation('common')
	const { event: selectedEventId } = useLocalSearchParams<{ event: string }>()
	const language = i18n.language
	const locale = language.startsWith('de') ? 'de-DE' : 'en-GB'
	const now = new Date()
	const isActive = event.begin < now && event.end != null && event.end > now
	const isSelected = selectedEventId === event.id
	const startDay = hamburgDay(event.begin)
	const endDay = event.end ? hamburgDay(event.end) : null
	const period = endDay != null && endDay !== startDay
	const dayNumber = new Intl.DateTimeFormat(locale, {
		day: 'numeric',
		timeZone: ZONE
	}).format(event.begin)
	const month = new Intl.DateTimeFormat(locale, {
		month: 'short',
		timeZone: ZONE
	}).format(event.begin)
	const detail =
		event.hasHours === true
			? formatFriendlyDateTimeRange(event.begin, event.end ?? null)
			: period && endDay
				? t('pages.calendar.until', { date: dayHeading(endDay, language) })
				: new Intl.DateTimeFormat(locale, {
						weekday: 'long',
						timeZone: ZONE
					}).format(event.begin)
	const relative =
		event.end != null && event.begin < now
			? t('dates.endsIn', { time: formatFriendlyRelativeTime(event.end) })
			: formatFriendlyRelativeTime(event.begin)
	const name = event.name[language as LanguageKey]
	return (
		<View
			accessible
			accessibilityLabel={`${name}, ${dayHeading(startDay, language)}${period && endDay ? `, ${t('pages.calendar.until', { date: dayHeading(endDay, language) })}` : ''}, ${relative}`}
			className={`flex-row items-center gap-3.5 rounded-mg border-hairline border-border shadow-card px-3.5 py-3 ${isSelected ? 'bg-primary-background' : 'bg-card'}`}
		>
			<View
				className={`w-12 items-center rounded-md py-1.5 ${isActive || isSelected ? 'bg-primary' : 'bg-primary-background'}`}
			>
				<Text
					className={`text-lg font-bold leading-6 ${isActive || isSelected ? 'text-white' : 'text-primary'}`}
				>
					{dayNumber}
				</Text>
				<Text
					className={`text-xs font-medium ${isActive || isSelected ? 'text-white' : 'text-primary'}`}
				>
					{month}
				</Text>
			</View>
			<View className="flex-1 gap-0.5">
				<Text className="text-text text-base font-semibold" numberOfLines={2}>
					{name}
				</Text>
				<Text className="text-label text-sm" numberOfLines={2}>
					{detail}
				</Text>
			</View>
			<RelativeTimeLabel
				showNowDot={isActive}
				highlighted={isActive || isSelected}
				numberOfLines={2}
				label={relative}
			/>
		</View>
	)
}

export { CalendarRow }
