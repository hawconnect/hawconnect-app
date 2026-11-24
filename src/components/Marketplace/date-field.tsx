import DateTimePicker from '@react-native-community/datetimepicker'
import type React from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform, Pressable, Text, View } from 'react-native'
import PlatformIcon from '@/components/Universal/icon'
import { PillBox, useFormColors } from './form-controls'
import { formatMarketDate } from './market-labels'

const toDay = (date: Date) =>
	`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const fromDay = (value: string) => {
	const [y, m, d] = value.split('-').map(Number)
	return new Date(y, m - 1, d)
}

interface DateFieldProps {
	value: string | null
	onChange: (value: string | null) => void
	/** Accessible name of the field. */
	label: string
	placeholder: string
	invalid?: boolean
	testID?: string
}

/** Date in a pill box with a calendar icon: native picker on iOS/Android, input on web. */
export function DateField({
	value,
	onChange,
	label,
	placeholder,
	invalid = false,
	testID = 'marketplace-form-date'
}: DateFieldProps): React.JSX.Element {
	const { t, i18n } = useTranslation('marketplace')
	const [androidOpen, setAndroidOpen] = useState(false)
	const { text, placeholder: muted } = useFormColors()
	const shown = (
		<Text
			className="text-base flex-1"
			numberOfLines={1}
			style={{ color: value ? text : muted }}
		>
			{value ? formatMarketDate(value, i18n.language) : placeholder}
		</Text>
	)
	const picker =
		Platform.OS === 'web' ? (
			<View className="flex-1 justify-center" style={{ height: 46 }}>
				{!value && shown}
				<input
					type="date"
					aria-label={label}
					data-testid={testID}
					value={value ?? ''}
					onChange={(event) => onChange(event.currentTarget.value || null)}
					onClick={(event) => {
						try {
							event.currentTarget.showPicker?.()
						} catch {
							// Browsers without showPicker still open from the icon.
						}
					}}
					style={{
						position: 'absolute',
						left: 0,
						top: 0,
						width: '100%',
						height: '100%',
						border: 'none',
						outline: 'none',
						padding: 0,
						background: 'transparent',
						color: text,
						fontSize: 16,
						// An empty date input stays invisible; the placeholder shows through.
						opacity: value ? 1 : 0,
						cursor: 'pointer'
					}}
				/>
			</View>
		) : Platform.OS === 'ios' && value ? (
			<View className="flex-1 flex-row">
				<DateTimePicker
					testID={testID}
					mode="date"
					display="compact"
					value={fromDay(value)}
					onValueChange={(_event, date) => onChange(toDay(date))}
				/>
			</View>
		) : (
			<Pressable
				testID={testID}
				accessibilityRole="button"
				accessibilityLabel={label}
				onPress={() =>
					Platform.OS === 'ios'
						? onChange(toDay(new Date()))
						: setAndroidOpen(true)
				}
				className="flex-1 flex-row items-center active:opacity-60"
				style={{ height: 46 }}
			>
				{shown}
			</Pressable>
		)
	return (
		<PillBox invalid={invalid}>
			<View className="flex-row items-center gap-3">
				<PlatformIcon
					ios={{ name: 'calendar', size: 17 }}
					android={{ name: 'calendar_today', size: 20 }}
					web={{ name: 'Calendar', size: 18 }}
					style={{ color: muted }}
				/>
				{picker}
				{value != null && (
					<Pressable
						testID={`${testID}-clear`}
						accessibilityRole="button"
						accessibilityLabel={t('marketplace.form.dateClear')}
						onPress={() => onChange(null)}
						hitSlop={10}
						className="active:opacity-60"
					>
						<PlatformIcon
							ios={{ name: 'xmark.circle.fill', size: 17 }}
							android={{ name: 'cancel', size: 20 }}
							web={{ name: 'CircleX', size: 18 }}
							style={{ color: muted }}
						/>
					</Pressable>
				)}
			</View>
			{androidOpen && (
				<DateTimePicker
					mode="date"
					value={value ? fromDay(value) : new Date()}
					onValueChange={(_event, date) => {
						setAndroidOpen(false)
						onChange(toDay(date))
					}}
					onDismiss={() => setAndroidOpen(false)}
				/>
			)}
		</PillBox>
	)
}
