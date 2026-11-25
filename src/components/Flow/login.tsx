import { router } from 'expo-router'
import type React from 'react'
import { useEffect, useState } from 'react'
import {
	Dimensions,
	Keyboard,
	KeyboardAvoidingView,
	type KeyboardEvent,
	Platform,
	TouchableWithoutFeedback,
	View
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import LoginForm from '@/components/Account/sign-in-form'
import LoginAnimatedText from './login-animated-text'
import LogoSVG from './svgs/logo'

const useIsFloatingKeyboard = (): boolean => {
	const windowWidth = Dimensions.get('window').width
	const [floating, setFloating] = useState(false)

	useEffect(() => {
		const onKeyboardWillChangeFrame = (event: KeyboardEvent): void => {
			setFloating(event.endCoordinates.width !== windowWidth)
		}

		const subscription = Keyboard.addListener(
			'keyboardWillChangeFrame',
			onKeyboardWillChangeFrame
		)
		return () => {
			subscription.remove()
		}
	}, [windowWidth])

	return floating
}

export default function Login(): React.JSX.Element {
	const floatingKeyboard = useIsFloatingKeyboard()

	const navigateHome = (): void => {
		router.replace('/(tabs)')
	}

	const insets = useSafeAreaInsets()

	return (
		<TouchableWithoutFeedback
			onPress={Keyboard.dismiss}
			disabled={Platform.OS === 'web'}
			accessible={false}
		>
			<View
				className="self-center flex-1 w-[90%]"
				style={{ paddingTop: insets.top }}
			>
				<KeyboardAvoidingView
					className="flex-1 justify-evenly"
					behavior="padding"
					enabled={!floatingKeyboard}
				>
					<View className="gap-4">
						<LogoSVG size={64} />
						<LoginAnimatedText />
					</View>
					<LoginForm navigateHome={navigateHome} />
					<View />
					<View />
				</KeyboardAvoidingView>
			</View>
		</TouchableWithoutFeedback>
	)
}
