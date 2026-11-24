import { useFocusEffect } from 'expo-router'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, Linking, Pressable, Text, View } from 'react-native'
import ErrorView from '@/components/Error/error-view'
import { DayHeading, EventListRow } from '@/components/Events/event-list-row'
import LoadingIndicator from '@/components/Universal/loading-indicator'
import { useHawEvents } from '@/hooks/useHawEvents'
import { useTransparentHeaderPadding } from '@/hooks/useTransparentHeader'
import { campusLifeFeed } from '@/utils/campus-life-feed'
import {
	dayHeading,
	eventTimes,
	groupEventsByDay,
	shortDay
} from '@/utils/haw-event-days'
import { hawEventWhen } from '@/utils/haw-event-when'

export default function PublicEventsScreen({
	campusLife = false
}: {
	campusLife?: boolean
}): React.JSX.Element {
	const { t, i18n } = useTranslation('common')
	const {
		data: source,
		isLoading,
		isError,
		isFetching,
		refetch
	} = useHawEvents()
	const prefix = campusLife ? 'pages.campusLifeEvents' : 'pages.hawEvents'
	const data =
		source && campusLife ? { ...source, ...campusLifeFeed(source) } : source
	useFocusEffect(
		useCallback(() => {
			if (campusLife) void refetch()
		}, [campusLife, refetch])
	)
	const items = useMemo(
		() => groupEventsByDay(data?.events ?? [], new Date()),
		[data?.events]
	)
	const paddingTop = useTransparentHeaderPadding() + 12
	if (isLoading)
		return (
			<View className="flex-1 items-center justify-center">
				<LoadingIndicator />
			</View>
		)
	if (!data?.available)
		return (
			<ErrorView
				title={t(`${prefix}.unavailable`)}
				onRefresh={() => void refetch()}
				refreshing={isFetching}
			/>
		)
	return (
		<View
			testID={campusLife ? 'campus-life-events-screen' : 'haw-events-screen'}
			className="flex-1"
			style={{ paddingTop }}
		>
			<FlatList
				data={items}
				keyExtractor={(item) => item.key}
				contentContainerClassName="px-page pb-bottom-safe gap-2 w-full max-w-[700px] self-center"
				refreshing={isFetching}
				onRefresh={() => void refetch()}
				ListHeaderComponent={
					(!campusLife && data.stale) || isError ? (
						<Text className="text-label text-xs py-2">
							{t(`${prefix}.cached`)}
						</Text>
					) : undefined
				}
				ListEmptyComponent={
					<Text className="text-label py-4">{t(`${prefix}.empty`)}</Text>
				}
				renderItem={({ item, index }) => {
					if (item.type === 'day')
						return (
							<DayHeading
								first={index === 0}
								text={
									item.kind === 'date'
										? dayHeading(item.date, i18n.language)
										: t(`pages.hawEvents.${item.kind}`)
								}
							/>
						)
					const event = item.event
					const times = eventTimes(event)
					const multiDay = event.endDate != null && event.endDate !== event.date
					return (
						<EventListRow
							testID="haw-event-row"
							title={event.title}
							label={event.origin === 'CLUB' ? t('pages.hawEvents.club') : null}
							location={event.location}
							start={times?.start ?? null}
							end={times?.end}
							allDayText={t('pages.hawEvents.allDay')}
							untilText={
								multiDay
									? t('pages.hawEvents.until', {
											date: shortDay(event.endDate as string, i18n.language)
										})
									: undefined
							}
							onPress={() => void Linking.openURL(event.sourceUrl)}
							accessibilityLabel={`${event.title}, ${hawEventWhen(event, i18n.language)}${event.location ? `, ${event.location}` : ''}`}
							accessibilityHint={t('pages.hawEvents.open')}
							trailing={
								<Text
									importantForAccessibility="no"
									accessibilityElementsHidden
									className="text-primary text-lg"
								>
									↗
								</Text>
							}
						/>
					)
				}}
				ListFooterComponent={
					campusLife ? undefined : (
						<Pressable
							testID="haw-events-source"
							accessibilityRole="link"
							onPress={() => void Linking.openURL(data.sourceUrl)}
							className="py-4"
						>
							<Text className="text-primary text-sm">
								{t(
									data.truncated
										? 'pages.hawEvents.more'
										: 'pages.hawEvents.source'
								)}
							</Text>
						</Pressable>
					)
				}
			/>
		</View>
	)
}
