import { selectionAsync } from 'expo-haptics'
import type React from 'react'
import { type ComponentRef, useRef, useState } from 'react'
import {
	type GestureResponderEvent,
	Modal,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	useWindowDimensions,
	View
} from 'react-native'
import { useCSSVariable } from 'uniwind'
import PlatformIcon from '@/components/Universal/icon'
import { IosGlassSurface } from '@/components/Universal/ios-glass-surface'
import { toColor } from '@/utils/uniwind-utils'
import type { ThemeMenuProps } from './theme-menu.types'

const MENU_WIDTH = 240
const ITEM_HEIGHT = 48
const EDGE = 12
/** Space kept free at the bottom on iOS/Android for the floating native tab bar, which takes touches above a Modal. */
const BOTTOM_RESERVE = Platform.OS === 'web' ? EDGE : 100

interface Anchor {
	right: number
	top: number
	bottom: number
}

/**
 * Pull-down menu used on iOS, Android and web: ✓ • Title rows with colored
 * swatches (native iOS menus render swatches monochrome, so this is custom).
 */
export default function ThemeMenu({
	testID,
	accessibilityLabel,
	options,
	selected,
	onSelect,
	field
}: ThemeMenuProps): React.JSX.Element {
	const trigger = useRef<ComponentRef<typeof View>>(null)
	const [anchor, setAnchor] = useState<Anchor | null>(null)
	const window = useWindowDimensions()
	const labelColor = toColor(useCSSVariable('--color-label'))
	const textColor = toColor(useCSSVariable('--color-text'))
	const cardColor = String(toColor(useCSSVariable('--color-card')) ?? '#ffffff')
	const current = options.find((option) => option.key === selected)
	const borderColor = String(
		toColor(useCSSVariable('--color-border')) ?? '#d1d1d6'
	)
	const notification = String(
		toColor(useCSSVariable('--color-notification')) ?? '#ff3b30'
	)
	const placeholderColor = String(
		toColor(useCSSVariable('--color-label-tertiary')) ?? '#8e8e93'
	)
	const empty = field != null && (selected === '' || current == null)

	const open = (event: GestureResponderEvent) => {
		const { pageX, pageY } = event.nativeEvent
		// Fallback: anchor at the touch point if layout measurement is unavailable.
		const touch = { right: pageX + 24, top: pageY - 12, bottom: pageY + 12 }
		const node = trigger.current
		if (!node) return setAnchor(touch)
		node.measure((_x, _y, width, height, left, top) => {
			setAnchor(
				width > 0 && (left > 0 || top > 0)
					? { right: left + width, top, bottom: top + height }
					: touch
			)
		})
	}
	const close = () => setAnchor(null)
	const choose = (key: string) => {
		if (Platform.OS !== 'web') void selectionAsync()
		close()
		if (key !== selected) onSelect(key)
	}

	const menuHeight = options.length * ITEM_HEIGHT + 12
	const fitsBelow =
		anchor && anchor.bottom + 6 + menuHeight < window.height - BOTTOM_RESERVE
	const menuTop = anchor
		? fitsBelow
			? anchor.bottom + 6
			: Math.max(EDGE, anchor.top - 6 - menuHeight)
		: 0
	const menuLeft = anchor
		? Math.min(
				Math.max(EDGE, anchor.right - MENU_WIDTH),
				window.width - MENU_WIDTH - EDGE
			)
		: 0

	return (
		<>
			{field ? (
				<Pressable
					ref={trigger}
					testID={testID}
					onPress={open}
					accessibilityRole="button"
					accessibilityLabel={accessibilityLabel}
					accessibilityValue={{ text: empty ? undefined : current?.title }}
					className="flex-row items-center justify-between gap-2 bg-card active:opacity-60"
					style={{
						height: 48,
						borderRadius: 999,
						borderWidth: 1,
						borderColor: field.invalid ? notification : borderColor,
						paddingHorizontal: 18
					}}
				>
					<Text
						className="text-base flex-1"
						numberOfLines={1}
						style={{ color: empty ? placeholderColor : textColor }}
					>
						{empty ? field.placeholder : current?.title}
					</Text>
					<PlatformIcon
						ios={{ name: 'chevron.down', size: 14 }}
						android={{ name: 'keyboard_arrow_down', size: 22 }}
						web={{ name: 'ChevronDown', size: 18 }}
						style={{ color: labelColor }}
					/>
				</Pressable>
			) : (
				<Pressable
					ref={trigger}
					testID={testID}
					onPress={open}
					accessibilityRole="button"
					accessibilityLabel={accessibilityLabel}
					accessibilityValue={{ text: current?.title }}
					className="flex-row items-center gap-2 active:opacity-60"
					hitSlop={10}
				>
					{current?.color != null && (
						<View
							className="size-3 rounded-full"
							style={{ backgroundColor: current.color }}
						/>
					)}
					{current?.icon != null && (
						<PlatformIcon
							ios={{ ...current.icon.ios, size: 15 }}
							android={{ ...current.icon.android, size: 18 }}
							web={{ ...current.icon.web, size: 16 }}
							style={{ color: labelColor }}
						/>
					)}
					<Text className="text-base" style={{ color: labelColor }}>
						{current?.title}
					</Text>
					<PlatformIcon
						ios={{ name: 'chevron.up.chevron.down', size: 13 }}
						android={{ name: 'unfold_more', size: 18 }}
						web={{ name: 'ChevronsUpDown', size: 16 }}
						style={{ color: labelColor }}
					/>
				</Pressable>
			)}
			<Modal
				visible={anchor != null}
				transparent
				animationType="fade"
				onRequestClose={close}
			>
				<Pressable accessible={false} className="flex-1" onPress={close} />
				<View
					accessibilityRole="menu"
					className="absolute ios:rounded-ios android:rounded-lg web:rounded-lg border-hairline border-border py-1.5 overflow-hidden"
					style={{
						top: menuTop,
						left: menuLeft,
						width: MENU_WIDTH,
						boxShadow: '0 8 24 0 rgba(0,0,0,0.25)'
					}}
				>
					<IosGlassSurface
						tinted
						style={StyleSheet.absoluteFill}
						fallbackBackgroundColor={cardColor}
					/>
					{options.map((option) => {
						const isSelected = option.key === selected
						return (
							<Pressable
								key={option.key}
								testID={testID ? `${testID}-${option.key}` : undefined}
								onPress={() => choose(option.key)}
								accessibilityRole="menuitem"
								accessibilityState={{ selected: isSelected }}
								className="flex-row items-center px-3 gap-3 active:bg-card-contrast web:hover:bg-card-contrast"
								style={{ height: ITEM_HEIGHT }}
							>
								<View className="w-5 items-center">
									{isSelected && (
										<PlatformIcon
											ios={{ name: 'checkmark', size: 15 }}
											android={{ name: 'check', size: 20 }}
											web={{ name: 'Check', size: 18 }}
											style={{ color: textColor }}
										/>
									)}
								</View>
								{option.color != null && (
									<View
										className="size-4 rounded-full"
										style={{ backgroundColor: option.color }}
									/>
								)}
								{option.icon != null && (
									<PlatformIcon
										ios={{ ...option.icon.ios, size: 17 }}
										android={{ ...option.icon.android, size: 20 }}
										web={{ ...option.icon.web, size: 18 }}
										style={{ color: textColor }}
									/>
								)}
								<Text className="text-text text-base">{option.title}</Text>
							</Pressable>
						)
					})}
				</View>
			</Modal>
		</>
	)
}
