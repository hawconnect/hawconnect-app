import type { BottomTabBarProps } from 'expo-router/js-tabs'
import { type JSX, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, Text, View } from 'react-native'
import { useCSSVariable } from 'uniwind'
import LogoSVG from '@/components/Flow/svgs/logo'
import { toColor } from '@/utils/uniwind-utils'

const BUTTON = 52
const ICON = 24
/** React Navigation's header height on web (the page header the rail sits beside). */
const HEADER_HEIGHT = 64
/** Outer width of the rail: buttons plus its padding and border. */
const RAIL_WIDTH = BUTTON + 2 * 8 + 2
/** Gap between the window edge and the rail (and the brand above it). */
const EDGE = 24
/** Just the rail and its margins, so pages get the rest of the window. */
const COLUMN_WIDTH = RAIL_WIDTH + 2 * EDGE

/** Tab routes rendered without a page header. */
const HEADERLESS_TABS = new Set(['map'])

const colorOf = (value: unknown, fallback: string) =>
	String(toColor(value as never) ?? fallback)

/**
 * Desktop web navigation: a floating rounded rail of icon buttons. The active
 * tab sits on a soft circle; hovering or focusing a button shows its name in a
 * small bubble beside the rail.
 */
export default function SideRail({
	state,
	descriptors,
	emitter,
	navigateToTab
}: BottomTabBarProps): JSX.Element {
	const card = colorOf(useCSSVariable('--color-card'), '#ffffff')
	const border = colorOf(useCSSVariable('--color-border'), '#d8d8d8')
	const text = colorOf(useCSSVariable('--color-text'), '#1c1c1e')
	// Same colours as the previous sidebar: accent for the active tab, label grey otherwise.
	const primary = colorOf(useCSSVariable('--color-primary'), '#40296c')
	const primaryBackground = colorOf(
		useCSSVariable('--color-primary-background'),
		'#40296c15'
	)
	const label = colorOf(useCSSVariable('--color-label'), '#606062')
	const hover = colorOf(useCSSVariable('--color-card-contrast'), '#eeeeee')
	const { t } = useTranslation('navigation')
	const [hovered, setHovered] = useState<string | null>(null)
	// Tabs whose page has no header (the map is full-bleed): no strip to continue.
	const headerless = HEADERLESS_TABS.has(state.routes[state.index]?.name ?? '')
	// The phone header's title for the home page.
	const homeTitle = t('navigation.dashboard')

	return (
		<View
			testID="side-rail"
			style={{
				width: COLUMN_WIDTH,
				backgroundColor: 'transparent',
				// The name bubble sticks out over the page beside the rail.
				overflow: 'visible',
				zIndex: 10
			}}
		>
			{/* Continues the page header across the rail column and shows the logo on the home page. */}
			<View
				style={{
					height: HEADER_HEIGHT,
					backgroundColor: headerless ? 'transparent' : card,
					// The name reaches past the rail column into the empty home header.
					overflow: 'visible',
					zIndex: 1
				}}
			>
				{state.index === 0 && (
					<View
						testID="side-rail-logo"
						accessibilityRole="header"
						style={{
							// Same place and size as the phone header: logo, then the name.
							position: 'absolute',
							left: 16,
							top: 0,
							height: HEADER_HEIGHT,
							flexDirection: 'row',
							alignItems: 'center',
							gap: 12
						}}
					>
						<LogoSVG size={24} />
						<Text
							numberOfLines={1}
							style={{ color: text, fontSize: 18, fontWeight: '500' }}
						>
							{homeTitle}
						</Text>
					</View>
				)}
			</View>
			<View
				style={{
					flex: 1,
					justifyContent: 'center',
					alignItems: 'center',
					overflow: 'visible'
				}}
			>
				<View
					accessibilityRole="tablist"
					style={{
						backgroundColor: card,
						borderColor: border,
						borderWidth: 1,
						borderRadius: 999,
						paddingVertical: 10,
						paddingHorizontal: 8,
						gap: 10,
						boxShadow: '0 8px 28px rgba(0, 0, 0, 0.10)'
					}}
				>
					{state.routes.map((route, index) => {
						const { options } = descriptors[route.key]
						const focused = state.index === index
						const title =
							typeof options.tabBarLabel === 'string'
								? options.tabBarLabel
								: (options.title ?? route.name)
						const color = focused ? primary : label
						const showName = hovered === route.key
						return (
							<View key={route.key} style={{ position: 'relative' }}>
								<Pressable
									testID={`side-rail-${route.name}`}
									accessibilityRole="tab"
									accessibilityLabel={title}
									accessibilityState={{ selected: focused }}
									onHoverIn={() => setHovered(route.key)}
									onHoverOut={() => setHovered(null)}
									onFocus={() => setHovered(route.key)}
									onBlur={() => setHovered(null)}
									onPress={() => {
										const event = emitter.emit({
											type: 'tabPress',
											target: route.key,
											canPreventDefault: true
										})
										if (!focused && !event.defaultPrevented)
											navigateToTab(route.key)
									}}
									onLongPress={() =>
										emitter.emit({ type: 'tabLongPress', target: route.key })
									}
									style={({ pressed }) => ({
										width: BUTTON,
										height: BUTTON,
										borderRadius: BUTTON / 2,
										alignItems: 'center',
										justifyContent: 'center',
										backgroundColor: focused
											? primaryBackground
											: showName
												? hover
												: 'transparent',
										opacity: pressed ? 0.7 : 1
									})}
								>
									{options.tabBarIcon?.({ focused, color, size: ICON })}
								</Pressable>
								{showName && (
									<View
										pointerEvents="none"
										style={{
											position: 'absolute',
											left: BUTTON + 22,
											top: (BUTTON - 40) / 2,
											height: 40,
											justifyContent: 'center',
											paddingHorizontal: 18,
											borderRadius: 999,
											backgroundColor: card,
											borderColor: border,
											borderWidth: 1,
											boxShadow: '0 4px 16px rgba(0, 0, 0, 0.10)',
											zIndex: 10
										}}
									>
										<Text
											numberOfLines={1}
											style={{ color: text, fontSize: 16, fontWeight: '500' }}
										>
											{title}
										</Text>
									</View>
								)}
							</View>
						)
					})}
				</View>
			</View>
		</View>
	)
}
