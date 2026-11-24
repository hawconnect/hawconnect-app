import { BlurView } from 'expo-blur'
import { Stack } from 'expo-router'
import type React from 'react'
import { useTranslation } from 'react-i18next'
import {
	Platform,
	StyleSheet,
	Text,
	useWindowDimensions,
	View
} from 'react-native'
import LogoSVG from '@/components/Flow/svgs/logo'
import { SIDE_RAIL_MIN_WIDTH } from '@/components/Layout/sidebar-breakpoint'
import { useTransparentHeaderStyle } from '@/hooks/useTransparentHeader'

/** On wide web windows the logo sits on the side rail instead. */
const HeaderLeft = (): React.JSX.Element | null => {
	const { width } = useWindowDimensions()
	if (width >= SIDE_RAIL_MIN_WIDTH) return null
	return (
		<View className="pl-4 pr-2">
			<LogoSVG size={24} />
		</View>
	)
}

export default function HomeLayout(): React.JSX.Element {
	const { t } = useTranslation('navigation')
	const transparentHeaderStyle = useTransparentHeaderStyle()
	// On wide web windows the logo and name sit on the side rail instead.
	const wideWeb = useWindowDimensions().width >= SIDE_RAIL_MIN_WIDTH

	return (
		<Stack
			screenOptions={{
				...transparentHeaderStyle,
				headerBackground:
					Platform.OS === 'ios'
						? () => (
								<BlurView
									tint="systemUltraThinMaterial"
									intensity={75}
									style={StyleSheet.absoluteFill}
								/>
							)
						: undefined,
				headerShadowVisible: false
			}}
		>
			<Stack.Screen
				name="index"
				options={{
					title: t('navigation.dashboard'),
					headerLargeTitle: false,
					headerTitle:
						Platform.OS === 'web' && wideWeb
							? () => null
							: Platform.OS === 'ios'
								? () => (
										<View className="flex-row items-center gap-2">
											<LogoSVG size={24} />
											<Text className="text-text text-xl font-semibold">
												{t('navigation.dashboard')}
											</Text>
										</View>
									)
								: undefined,
					headerLeft: Platform.OS === 'web' ? () => <HeaderLeft /> : undefined
				}}
			/>
		</Stack>
	)
}
