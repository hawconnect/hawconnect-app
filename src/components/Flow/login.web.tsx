import { router } from 'expo-router'
import type React from 'react'
import { useTranslation } from 'react-i18next'
import { Text, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import LoginForm from '@/components/Account/sign-in-form'
import LoginAnimatedText from './login-animated-text'
import LogoSVG from './svgs/logo'

export default function Login(): React.JSX.Element {
	const { t } = useTranslation('flow')
	const navigateHome = (): void => {
		router.replace('/(tabs)')
	}

	return (
		<>
			<View className="items-start w-full absolute top-0 left-0 right-0 z-[1] bg-card px-[4%] py-2.5 border-b-hairline border-border">
				<View className="flex-row items-center gap-3">
					<LogoSVG size={32} />
					<View className="flex-col">
						<Text className="text-text text-xl font-semibold tracking-tight">
							HAWConnect
						</Text>
						<Text className="text-label text-sm font-normal tracking-tight">
							{t('login.title1Sub')}
						</Text>
					</View>
				</View>
			</View>
			<ScrollView
				className="flex-1 bg-background"
				contentContainerClassName="self-center grow pt-5 w-[92%] mt-[100px]"
			>
				<LoginAnimatedText />
				<View className="flex-col gap-10 pt-[50px] pb-bottom-safe">
					<LoginForm navigateHome={navigateHome} />
				</View>
			</ScrollView>
		</>
	)
}
