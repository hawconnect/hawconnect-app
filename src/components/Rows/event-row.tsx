import { router } from 'expo-router'
import type React from 'react'
import { useTranslation } from 'react-i18next'
import { Text } from 'react-native'
import { EventListRow } from '@/components/Events/event-list-row'
import type { LanguageKey } from '@/localization/i18n'
import {
	CAMPUS_LIFE_PUBLIC_ORGANIZER_KIND_STUDENT_ASSOCIATION,
	type CampusLifeEvent,
	type CampusLifePublicOrganizerKind
} from '@/types/campus-life'
import { campusLifeEventDetailHref } from '@/utils/campus-life-utils'
import {
	dayHeading,
	eventTimes,
	hamburgDay,
	shortDay
} from '@/utils/haw-event-days'

/**
 * A club event in a list. Under a day heading (`grouped`) it shows only the
 * time; on its own (an organizer's page) it also shows the date.
 */
const CLEventRow = ({
	event,
	inSheet = false,
	grouped = false,
	organizerKind = CAMPUS_LIFE_PUBLIC_ORGANIZER_KIND_STUDENT_ASSOCIATION
}: {
	event: CampusLifeEvent
	inSheet?: boolean
	grouped?: boolean
	organizerKind?: CampusLifePublicOrganizerKind
}): React.JSX.Element => {
	const { t, i18n } = useTranslation('common')
	const title = event.titles[i18n.language as LanguageKey] ?? ''
	const start = new Date(event.startDateTime)
	const end = event.endDateTime ? new Date(event.endDateTime) : null
	const valid = Number.isFinite(start.getTime())
	const times = valid
		? eventTimes({ startTime: event.startDateTime, endTime: event.endDateTime })
		: null
	const startDay = valid ? hamburgDay(start) : null
	const endDay = end && Number.isFinite(end.getTime()) ? hamburgDay(end) : null
	const multiDay = startDay != null && endDay != null && endDay !== startDay
	const now = new Date()
	const running = valid && end != null && start <= now && now < end
	const when = startDay
		? `${dayHeading(startDay, i18n.language)}${times ? ` · ${times.start}${times.end ? ` – ${times.end}` : ''}` : ''}`
		: ''
	return (
		<EventListRow
			testID="campus-life-event-row"
			title={title}
			label={event.host.name}
			location={event.location}
			start={times?.start ?? null}
			end={multiDay ? null : times?.end}
			allDayText={t('dates.allDay')}
			dateText={
				!grouped && startDay ? dayHeading(startDay, i18n.language) : undefined
			}
			untilText={
				multiDay && endDay
					? t('pages.hawEvents.until', {
							date: shortDay(endDay, i18n.language)
						})
					: undefined
			}
			nowText={running ? t('dates.now') : undefined}
			cardClassName={inSheet ? 'bg-card-sheet' : 'bg-card'}
			onPress={() =>
				router.push(campusLifeEventDetailHref(event.id, organizerKind))
			}
			accessibilityLabel={[title, event.host.name, when, event.location]
				.filter(Boolean)
				.join(', ')}
			trailing={
				<Text
					importantForAccessibility="no"
					accessibilityElementsHidden
					className="text-label text-xl leading-6"
				>
					›
				</Text>
			}
		/>
	)
}

export default CLEventRow
