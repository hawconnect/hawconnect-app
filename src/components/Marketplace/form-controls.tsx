import type React from 'react'
import { useState } from 'react'
import {
	Pressable,
	Text,
	TextInput,
	type TextInputProps,
	View
} from 'react-native'
import { useCSSVariable } from 'uniwind'
import PlatformIcon from '@/components/Universal/icon'
import { toColor } from '@/utils/uniwind-utils'

export const PILL_HEIGHT = 48
export const PILL_PADDING = 18

/** Border and text colours shared by the form controls (theme tokens only). */
export function useFormColors() {
	return {
		border: String(toColor(useCSSVariable('--color-border')) ?? '#d1d1d6'),
		inputBorder: String(
			toColor(useCSSVariable('--color-input-border')) ?? '#767180'
		),
		primary: String(toColor(useCSSVariable('--color-primary')) ?? '#40296c'),
		text: String(toColor(useCSSVariable('--color-text')) ?? '#000'),
		card: String(toColor(useCSSVariable('--color-card')) ?? '#fff'),
		placeholder: String(
			toColor(useCSSVariable('--color-label-tertiary')) ?? '#8e8e93'
		),
		notification: String(
			toColor(useCSSVariable('--color-notification')) ?? '#ff3b30'
		)
	}
}

/** The single bordered card holding the whole form. */
export function FormCard({
	children
}: {
	children: React.ReactNode
}): React.JSX.Element {
	const { border, card } = useFormColors()
	return (
		<View
			className="gap-6 p-5"
			style={{
				backgroundColor: card,
				borderColor: border,
				borderWidth: 1,
				borderRadius: 12
			}}
		>
			{children}
		</View>
	)
}

/** Bold heading with a thin divider above it (except for the first section). */
export function FormSectionBlock({
	title,
	first,
	children
}: {
	title: string
	first: boolean
	children: React.ReactNode
}): React.JSX.Element {
	const { border } = useFormColors()
	return (
		<View className="gap-4">
			{!first && (
				<View style={{ height: 1, backgroundColor: border, marginBottom: 8 }} />
			)}
			<Text accessibilityRole="header" className="text-text text-lg font-bold">
				{title}
			</Text>
			{children}
		</View>
	)
}

interface FieldShellProps {
	label: string
	required?: boolean
	hint?: string | null
	error?: string | null
	children: React.ReactNode
}

/** Label above the control, then hint and the validation message. */
export function FieldShell({
	label,
	required = false,
	hint,
	error,
	children
}: FieldShellProps): React.JSX.Element {
	const { notification } = useFormColors()
	return (
		<View className="gap-2">
			<Text className="text-label text-base font-medium">
				{required ? `${label} *` : label}
			</Text>
			{children}
			{hint != null && hint !== '' && (
				<Text className="text-label text-sm">{hint}</Text>
			)}
			{error != null && error !== '' && (
				<Text className="text-sm" style={{ color: notification }}>
					{error}
				</Text>
			)}
		</View>
	)
}

/** Border colour of a pill or box: error, focus or rest. */
export const useBoxBorder = (focused: boolean, invalid: boolean) => {
	const { inputBorder, primary, notification } = useFormColors()
	return invalid ? notification : focused ? primary : inputBorder
}

interface PillBoxProps {
	focused?: boolean
	invalid?: boolean
	multiline?: boolean
	children: React.ReactNode
	className?: string
}

/** Pill-shaped box (radius 999) or a softly rounded one for multiline text. */
export function PillBox({
	focused = false,
	invalid = false,
	multiline = false,
	children,
	className = ''
}: PillBoxProps): React.JSX.Element {
	const { card } = useFormColors()
	const borderColor = useBoxBorder(focused, invalid)
	return (
		<View
			className={className}
			style={{
				backgroundColor: card,
				borderColor,
				borderWidth: 1,
				borderRadius: multiline ? 16 : 999,
				paddingHorizontal: PILL_PADDING,
				...(multiline
					? { minHeight: 96, paddingVertical: 12 }
					: {
							height: PILL_HEIGHT,
							justifyContent: 'center' as const
						})
			}}
		>
			{children}
		</View>
	)
}

/** Text input in a pill box; the border turns primary while focused. */
export function PillInput({
	multiline = false,
	invalid = false,
	style,
	...props
}: TextInputProps & { invalid?: boolean }): React.JSX.Element {
	const [focused, setFocused] = useState(false)
	const { text, placeholder } = useFormColors()
	return (
		<PillBox focused={focused} invalid={invalid} multiline={multiline}>
			<TextInput
				{...props}
				multiline={multiline}
				textAlignVertical={multiline ? 'top' : 'center'}
				placeholderTextColor={placeholder}
				onFocus={(event) => {
					setFocused(true)
					props.onFocus?.(event)
				}}
				onBlur={(event) => {
					setFocused(false)
					props.onBlur?.(event)
				}}
				style={[
					{
						color: text,
						fontSize: 16,
						padding: 0,
						minHeight: multiline ? 72 : undefined,
						outlineStyle: 'none'
					} as object,
					style
				]}
			/>
		</PillBox>
	)
}

interface ChoiceRowProps {
	kind: 'radio' | 'checkbox'
	checked: boolean
	label: string
	onPress: () => void
	disabled?: boolean
	testID?: string
}

/** Radio (round, inner dot) or checkbox (rounded square, check) row. */
export function ChoiceRow({
	kind,
	checked,
	label,
	onPress,
	disabled = false,
	testID
}: ChoiceRowProps): React.JSX.Element {
	const { inputBorder, primary, card } = useFormColors()
	const radio = kind === 'radio'
	return (
		<Pressable
			testID={testID}
			accessibilityRole={kind}
			accessibilityState={
				radio ? { selected: checked, checked, disabled } : { checked, disabled }
			}
			accessibilityLabel={label}
			disabled={disabled}
			onPress={onPress}
			className="flex-row items-center gap-3 py-1 active:opacity-60"
		>
			<View
				style={{
					width: 22,
					height: 22,
					borderRadius: radio ? 11 : 6,
					borderWidth: 1.5,
					borderColor: checked ? primary : inputBorder,
					backgroundColor: checked ? primary : card,
					alignItems: 'center',
					justifyContent: 'center'
				}}
			>
				{checked &&
					(radio ? (
						<View
							style={{
								width: 8,
								height: 8,
								borderRadius: 4,
								backgroundColor: card
							}}
						/>
					) : (
						<PlatformIcon
							ios={{ name: 'checkmark', size: 13, weight: 'bold' }}
							android={{ name: 'check', size: 16 }}
							web={{ name: 'Check', size: 15 }}
							style={{ color: card }}
						/>
					))}
			</View>
			<Text className="text-text text-base flex-1">{label}</Text>
		</Pressable>
	)
}
