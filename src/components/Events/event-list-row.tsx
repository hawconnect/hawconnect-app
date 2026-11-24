import type React from 'react'
import { Pressable, Text, View } from 'react-native'
import { useCSSVariable } from 'uniwind'
import PlatformIcon from '@/components/Universal/icon'
import { toColor } from '@/utils/uniwind-utils'

/**
 * One event in an event list: a time column (clock, start, end), then an
 * optional label, the title and the place (pin). Used by HAW Events and
 * Campus Life so both lists read the same way.
 */
export function EventListRow({
	testID,
	title,
	label,
	location,
	start,
	end,
	allDayText,
	dateText,
	untilText,
	nowText,
	trailing,
	onPress,
	accessibilityLabel,
	accessibilityHint,
	accessibilityRole = 'link',
	cardClassName = 'bg-card'
}: {
	testID?: string
	title: string
	/** Small accent line above the title (club name, "Club event"). */
	label?: string | null
	location?: string | null
	/** "18:00"; null shows `allDayText`. */
	start: string | null
	end?: string | null
	allDayText: string
	/** Shown above the time when the list has no day headings. */
	dateText?: string
	/** "until 26 Nov" for events spanning several days. */
	untilText?: string
	/** Shown instead of the end time while the event is running. */
	nowText?: string
	trailing?: React.ReactNode
	onPress: () => void
	accessibilityLabel: string
	accessibilityHint?: string
	accessibilityRole?: 'link' | 'button'
	cardClassName?: string
}): React.JSX.Element {
	const accent = String(
		toColor(useCSSVariable('--color-secondary')) ?? '#3d0b44'
	)
	return (
		<Pressable
			testID={testID}
			accessibilityRole={accessibilityRole}
			accessibilityLabel={accessibilityLabel}
			accessibilityHint={accessibilityHint}
			onPress={onPress}
			className={`flex-row items-start gap-3.5 rounded-mg border-hairline border-border shadow-card px-3.5 py-3.5 ${cardClassName}`}
		>
			<View className="w-[72px]">
				{dateText && (
					<Text className="text-label text-xs font-medium mb-0.5">
						{dateText}
					</Text>
				)}
				<View className="flex-row items-center gap-1">
					<PlatformIcon
						ios={{ name: 'clock', size: 12 }}
						android={{ name: 'schedule', size: 14, variant: 'outlined' }}
						web={{ name: 'Clock', size: 14 }}
						style={{ color: accent }}
					/>
					<Text
						className={
							start ? 'text-text text-base font-semibold' : 'text-label text-sm'
						}
					>
						{start ?? allDayText}
					</Text>
				</View>
				{nowText ? (
					<Text className="text-primary text-sm font-medium ms-[18px]">
						{nowText}
					</Text>
				) : (
					end && <Text className="text-label text-sm ms-[18px]">{end}</Text>
				)}
				{untilText && (
					<Text className="text-label text-xs mt-0.5 ms-[18px]">
						{untilText}
					</Text>
				)}
			</View>
			<View className="flex-1 gap-0.5">
				{label && (
					<Text className="text-primary text-xs font-medium" numberOfLines={1}>
						{label}
					</Text>
				)}
				<Text className="text-text text-base font-semibold" numberOfLines={2}>
					{title}
				</Text>
				{location && (
					<View className="flex-row items-start gap-1">
						<PlatformIcon
							ios={{ name: 'mappin', size: 12 }}
							android={{ name: 'location_on', size: 14, variant: 'outlined' }}
							web={{ name: 'MapPin', size: 14 }}
							style={{ color: accent, marginTop: 3 }}
						/>
						<Text className="text-label text-sm flex-1" numberOfLines={2}>
							{location}
						</Text>
					</View>
				)}
			</View>
			{trailing}
		</Pressable>
	)
}

/** Day heading above a group of events ("Today", "Thu, 19 Nov"). */
export function DayHeading({
	text,
	first
}: {
	text: string
	first: boolean
}): React.JSX.Element {
	return (
		<Text
			accessibilityRole="header"
			className={`text-label text-sm font-semibold px-1 pb-0.5 ${first ? '' : 'pt-3'}`}
		>
			{text}
		</Text>
	)
}
