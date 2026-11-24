import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Text, View } from 'react-native'
import EventItem from '@/components/Universal/event-item'
import { useImportedCalendarStore } from '@/hooks/useImportedCalendarStore'
import { useNow } from '@/hooks/useNow'
import { classProgress, ENDING_SOON_MINUTES } from '@/utils/class-progress'
import { upcomingImportedClasses } from '@/utils/upcoming-imported-classes'
import BaseCard from './base-card'

export default function ImportedClassesCard(): React.JSX.Element {
	const { t, i18n } = useTranslation('navigation')
	const calendars = useImportedCalendarStore((state) => state.calendars)
	const now = useNow(true)
	const result = useMemo(
		() => upcomingImportedClasses(calendars, now),
		[calendars, now]
	)
	const locale = i18n.language.startsWith('de') ? 'de-DE' : 'en-GB'
	const date = new Intl.DateTimeFormat(locale, {
		weekday: 'short',
		day: '2-digit',
		month: '2-digit',
		timeZone: 'Europe/Berlin'
	})
	const time = new Intl.DateTimeFormat(locale, {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
		timeZone: 'Europe/Berlin'
	})
	return (
		<BaseCard
			title="timetable"
			testID="dashboard-card-imported-timetable"
			onPressRoute="/timetable"
		>
			<View className="mt-2.5 gap-3">
				{result.events.map((event, index) => {
					const start = new Date(event.start)
					const end = new Date(event.end)
					const differentDay = date.format(start) !== date.format(end)
					if (index === 0 && start <= now && now < end && !differentDay)
						return (
							<OngoingClass
								key={event.key}
								title={event.title}
								location={event.location || undefined}
								range={`${time.format(start)} – ${time.format(end)}`}
								endTime={time.format(end)}
								{...classProgress(start, end, now)}
							/>
						)
					return (
						<EventItem
							key={event.key}
							title={event.title}
							subtitle={
								start <= now ? t('cards.importedClasses.ongoing') : undefined
							}
							timeLabel={`${date.format(start)} · ${time.format(start)}–${differentDay ? `${date.format(end)} ` : ''}${time.format(end)}`}
							location={event.location || undefined}
						/>
					)
				})}
			</View>
		</BaseCard>
	)
}

/** The class happening right now: time range, how long is left and a progress bar. */
function OngoingClass({
	title,
	location,
	range,
	endTime,
	fraction,
	minutesLeft
}: {
	title: string
	location?: string
	range: string
	endTime: string
	fraction: number
	minutesLeft: number
}): React.JSX.Element {
	const { t } = useTranslation('navigation')
	const status =
		minutesLeft <= ENDING_SOON_MINUTES
			? t('cards.timetable.endingSoon', { count: minutesLeft })
			: t('cards.timetable.ongoing', { time: endTime })
	return (
		<View testID="up-next-ongoing" className="gap-2">
			<View className="flex-row items-center justify-between gap-3">
				<Text className="text-text text-base">{range}</Text>
				<Text className="text-primary text-base">{status}</Text>
			</View>
			<View
				accessibilityRole="progressbar"
				accessibilityLabel={status}
				accessibilityValue={{
					min: 0,
					max: 100,
					now: Math.round(fraction * 100)
				}}
				className="h-1.5 rounded-full bg-card-contrast overflow-hidden"
			>
				<View
					className="h-full rounded-full bg-primary"
					style={{ width: `${fraction * 100}%` }}
				/>
			</View>
			<Text className="text-text text-lg font-semibold" numberOfLines={2}>
				{title}
			</Text>
			{location && (
				<Text className="text-label text-base" numberOfLines={1}>
					{location}
				</Text>
			)}
		</View>
	)
}
