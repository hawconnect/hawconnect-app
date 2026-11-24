import type React from 'react'
import { useTranslation } from 'react-i18next'
import {
	Modal,
	Platform,
	Pressable,
	ScrollView,
	Text,
	View
} from 'react-native'
import { useCSSVariable } from 'uniwind'
import PlatformIcon from '@/components/Universal/icon'
import { toColor } from '@/utils/uniwind-utils'

const cardClassName =
	'bg-card ios:rounded-ios android:rounded-md web:rounded-md border-hairline border-border shadow-card'

/** Inline error box, same look as the Calendar import error. */
export function InlineMessage({
	text,
	tone = 'error'
}: {
	text: string
	tone?: 'error' | 'success'
}): React.JSX.Element {
	const notification = String(
		toColor(useCSSVariable('--color-notification')) ?? '#ff3b30'
	)
	const success = String(
		toColor(useCSSVariable('--color-success')) ?? '#34c759'
	)
	return (
		<View
			accessibilityRole={tone === 'error' ? 'alert' : 'text'}
			accessibilityLiveRegion="polite"
			className={`flex-row gap-3 px-4 py-3 ${cardClassName}`}
		>
			{tone === 'error' ? (
				<PlatformIcon
					ios={{ name: 'exclamationmark.triangle', size: 17 }}
					android={{ name: 'error', size: 20 }}
					web={{ name: 'TriangleAlert', size: 18 }}
					style={{ color: notification }}
				/>
			) : (
				<PlatformIcon
					ios={{ name: 'checkmark.circle', size: 17 }}
					android={{ name: 'check_circle', size: 20 }}
					web={{ name: 'CircleCheck', size: 18 }}
					style={{ color: success }}
				/>
			)}
			<Text selectable className="text-text text-sm flex-1">
				{text}
			</Text>
		</View>
	)
}

/** Small pill label (type, status). */
export function MarketBadge({
	text,
	tone = 'default'
}: {
	text: string
	tone?: 'default' | 'primary' | 'warning'
}): React.JSX.Element {
	const className =
		tone === 'primary' ? 'bg-primary-background' : 'bg-card-contrast'
	const textClassName =
		tone === 'primary'
			? 'text-primary'
			: tone === 'warning'
				? 'text-notification'
				: 'text-label'
	return (
		<View className={`px-1.5 py-0.5 rounded-base self-start ${className}`}>
			<Text className={`text-xs font-medium ${textClassName}`}>{text}</Text>
		</View>
	)
}

interface MarketSheetProps {
	visible: boolean
	title: string
	onClose: () => void
	testID?: string
	children: React.ReactNode
}

/**
 * Sheet for the rules, contact and report flows: a page sheet on iOS and a
 * centered card on Android and web.
 */
export function MarketSheet({
	visible,
	title,
	onClose,
	testID,
	children
}: MarketSheetProps): React.JSX.Element {
	const { t } = useTranslation('marketplace')
	const textColor = String(toColor(useCSSVariable('--color-text')) ?? '#000')
	const ios = Platform.OS === 'ios'
	const header = (
		<View className="flex-row items-center justify-between pb-4">
			<Text accessibilityRole="header" className="text-text text-lg font-bold">
				{title}
			</Text>
			<Pressable
				testID={testID ? `${testID}-close` : undefined}
				accessibilityRole="button"
				accessibilityLabel={t('marketplace.contact.cancel')}
				onPress={onClose}
				hitSlop={10}
				className="active:opacity-60"
			>
				<PlatformIcon
					ios={{ name: 'xmark.circle.fill', size: 22 }}
					android={{ name: 'close', size: 24 }}
					web={{ name: 'X', size: 22 }}
					style={{ color: textColor }}
				/>
			</Pressable>
		</View>
	)
	const body = (
		<ScrollView
			keyboardShouldPersistTaps="handled"
			contentContainerClassName="p-4 pb-10"
		>
			{header}
			{children}
		</ScrollView>
	)
	if (ios)
		return (
			<Modal
				visible={visible}
				animationType="slide"
				presentationStyle="pageSheet"
				onRequestClose={onClose}
			>
				<View testID={testID} className="flex-1 bg-background">
					{body}
				</View>
			</Modal>
		)
	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			onRequestClose={onClose}
		>
			<View className="flex-1 items-center justify-center bg-black/40 px-page">
				<Pressable
					accessible={false}
					className="absolute inset-0"
					onPress={onClose}
				/>
				<View
					testID={testID}
					accessibilityViewIsModal
					className="w-full max-w-[520px] max-h-[90%] bg-background android:rounded-lg web:rounded-lg overflow-hidden"
				>
					{body}
				</View>
			</View>
		</Modal>
	)
}
