import * as SplashScreen from 'expo-splash-screen'
import type React from 'react'
import { useEffect, useState } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import Animated, {
	Easing,
	interpolate,
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withTiming
} from 'react-native-reanimated'
import { useCSSVariable } from 'uniwind'
import LogoSVG from '@/components/Flow/svgs/logo'
import { toColor } from '@/utils/uniwind-utils'

type Props = { isReady: boolean }

export function Splash({ isReady, children }: React.PropsWithChildren<Props>) {
	const contrastColor = String(
		toColor(useCSSVariable('--color-contrast')) ?? '#ffffff'
	)
	const primaryColor = String(
		toColor(useCSSVariable('--color-primary')) ?? '#40296c'
	)
	const [loaded, setLoaded] = useState(false)
	const [hideSplash, setHideSplash] = useState(false)

	const intro = useSharedValue(0)
	const introBackground = useSharedValue(0)

	useEffect(() => {
		setLoaded(true)
	}, [])

	const logoSize = 190

	const animatedLogoStyle = useAnimatedStyle(() => ({
		transform: [
			{
				scale: interpolate(
					intro.value,
					[0, 0.2, 0.4, 1],
					[1, 1, 0.8, 10],
					'clamp'
				)
			}
		],
		opacity: interpolate(intro.value, [0, 0.7, 0.8, 1], [1, 1, 0.4, 0], 'clamp')
	}))

	const animatedBackgroundStyle = useAnimatedStyle(() => ({
		backgroundColor: contrastColor,
		opacity: interpolate(introBackground.value, [0, 1], [1, 0], 'clamp')
	}))

	const animateSplashWithTransformation = () => {
		intro.set(
			withTiming(0.2, { duration: 100 }, () => {
				intro.set(
					withTiming(0.4, { duration: 200 }, () => {
						intro.set(
							withTiming(
								1,
								{ duration: 500, easing: Easing.out(Easing.exp) },
								() => {
									introBackground.set(
										withTiming(1, { duration: 200 }, () => {
											runOnJS(setHideSplash)(true)
										})
									)
								}
							)
						)
					})
				)
			})
		)
	}

	useEffect(() => {
		if (isReady && loaded) {
			void SplashScreen.hideAsync()
			animateSplashWithTransformation()
		}
	}, [isReady, loaded])

	return (
		<View style={StyleSheet.absoluteFill}>
			{children}
			{!hideSplash && Platform.OS !== 'web' && (
				<>
					<Animated.View
						style={[StyleSheet.absoluteFill, animatedBackgroundStyle]}
					/>
					<Animated.View
						style={[
							StyleSheet.absoluteFill,
							{ justifyContent: 'center', alignItems: 'center' }
						]}
					>
						<Animated.View style={animatedLogoStyle}>
							<LogoSVG size={logoSize} color={primaryColor} />
						</Animated.View>
					</Animated.View>
				</>
			)}
		</View>
	)
}
