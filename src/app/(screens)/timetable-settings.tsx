import { router } from 'expo-router'
import type React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import MultiSectionRadio, {
	type FoodLanguageElement
} from '@/components/Food/food-language-section'
import TimetablePreview from '@/components/Timetable/timetable-preview'
import FormList from '@/components/Universal/form-list'
import SectionView from '@/components/Universal/sections-view'
import { TimetableMode, useTimetableStore } from '@/hooks/useTimetableStore'

export default function TimetableSettings(): React.JSX.Element {
	const { t } = useTranslation(['navigation', 'timetable'])
	const insets = useSafeAreaInsets()

	const timetableMode = useTimetableStore((state) => state.timetableMode)
	const setTimetableMode = useTimetableStore((state) => state.setTimetableMode)
	const showCalendarEvents = useTimetableStore(
		(state) => state.showCalendarEvents
	)

	const viewModeElements: FoodLanguageElement[] = [
		{
			key: TimetableMode.List,
			title: t('viewModes.list', { ns: 'timetable' })
		},
		{
			key: TimetableMode.Timeline1,
			title: t('viewModes.oneDay', { ns: 'timetable' })
		},
		{
			key: TimetableMode.Timeline3,
			title: t('viewModes.threeDays', { ns: 'timetable' })
		},
		{
			key: TimetableMode.Timeline5,
			title: t('viewModes.fiveDays', { ns: 'timetable' })
		},
		{
			key: TimetableMode.Timeline7,
			title: t('viewModes.sevenDays', { ns: 'timetable' })
		}
	]

	const setViewMode = (mode: string) => {
		setTimetableMode(mode as TimetableMode)
	}

	return (
		<ScrollView
			testID="timetable-settings-screen"
			style={{
				paddingBottom: insets.bottom + 32
			}}
			contentInsetAdjustmentBehavior="automatic"
			showsVerticalScrollIndicator={false}
		>
			<View className="flex-1 w-full max-w-[700px] self-center">
				<View className="px-page mt-4">
					<FormList
						sections={[
							{
								items: [
									{
										testID: 'timetable-settings-import',
										title: t('import.manage', { ns: 'timetable' }),
										icon: {
											ios: 'calendar.badge.plus',
											android: 'event',
											web: 'CalendarPlus'
										},
										onPress: () => router.navigate('/calendar-import')
									}
								]
							}
						]}
					/>
				</View>
				<SectionView title={t('timetable:preferences.title')}>
					<MultiSectionRadio
						elements={viewModeElements}
						selectedItem={timetableMode}
						action={setViewMode}
					/>
				</SectionView>

				<View className="px-page mt-10 w-full items-center">
					<View className="w-full max-w-[600px]">
						<TimetablePreview
							mode={timetableMode}
							showCalendarEvents={showCalendarEvents}
						/>
					</View>
				</View>
			</View>
		</ScrollView>
	)
}
