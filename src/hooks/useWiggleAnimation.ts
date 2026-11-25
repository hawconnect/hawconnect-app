import * as Haptics from 'expo-haptics'
import {
	useAnimatedStyle,
	useSharedValue,
	withSpring
} from 'react-native-reanimated'

export const useWiggleAnimation = (
	options = { rotation: 5, damping: 3, stiffness: 300 }
) => {
	const iconRotation = useSharedValue(0)

	const iconAnimatedStyle = useAnimatedStyle(() => {
		return {
			transform: [
				{
					rotate: `${iconRotation.value}deg`
				}
			]
		}
	})

	const triggerWiggle = async () => {
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
		iconRotation.set(
			withSpring(-options.rotation, {
				damping: options.damping,
				stiffness: options.stiffness
			})
		)
		setTimeout(() => {
			iconRotation.set(
				withSpring(options.rotation, {
					damping: options.damping,
					stiffness: options.stiffness
				})
			)
			setTimeout(() => {
				iconRotation.set(
					withSpring(0, {
						damping: options.damping,
						stiffness: options.stiffness
					})
				)
			}, 100)
		}, 100)
	}

	return {
		iconAnimatedStyle,
		triggerWiggle
	}
}
