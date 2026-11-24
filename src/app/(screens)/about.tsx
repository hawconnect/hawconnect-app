import { useRouter } from 'expo-router'
import type React from 'react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, ScrollView, Text, View } from 'react-native'
import Animated, {
	cancelAnimation,
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withSequence,
	withTiming
} from 'react-native-reanimated'
import { useCSSVariable } from 'uniwind'
import LogoSVG from '@/components/Flow/svgs/logo'
import FormList from '@/components/Universal/form-list'
import { STATUS_URL } from '@/data/constants'
import { useTransparentHeaderPadding } from '@/hooks/useTransparentHeader'
import type { FormListSections } from '@/types/components'
import { appVersionLabel } from '@/utils/app-version'
import { toColor } from '@/utils/uniwind-utils'

export default function About(): React.JSX.Element {
	const router = useRouter()
	const { t } = useTranslation(['settings', 'account'])
	const headerPadding = useTransparentHeaderPadding()
	const labelTertiaryColor = String(
		toColor(useCSSVariable('--color-label-tertiary')) ?? '#99999a'
	)

	const shimmerOpacity = useSharedValue(0)
	const shimmerPosition = useSharedValue(-100)
	const shimmerScale = useSharedValue(1)
	const shimmerRotation = useSharedValue(0)

	useEffect(() => {
		const animate = () => {
			shimmerOpacity.value = 0
			shimmerPosition.value = -100
			shimmerScale.value = 1
			shimmerRotation.value = 0

			shimmerOpacity.value = withSequence(
				withTiming(0.6, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
				withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.ease) })
			)

			shimmerPosition.value = withTiming(200, {
				duration: 2400,
				easing: Easing.inOut(Easing.ease)
			})

			shimmerScale.value = withSequence(
				withTiming(1.1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
				withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
			)

			shimmerRotation.value = withTiming(25, {
				duration: 2400,
				easing: Easing.inOut(Easing.ease)
			})
		}

		animate()

		const interval = setInterval(animate, 8000)

		return () => {
			clearInterval(interval)
			cancelAnimation(shimmerOpacity)
			cancelAnimation(shimmerPosition)
			cancelAnimation(shimmerScale)
			cancelAnimation(shimmerRotation)
		}
	}, [])

	const shimmerStyle = useAnimatedStyle(() => {
		return {
			opacity: shimmerOpacity.value,
			transform: [
				{ translateX: shimmerPosition.value },
				{ scale: shimmerScale.value },
				{ rotate: `${shimmerRotation.value}deg` }
			]
		}
	})

	const appSection: FormListSections = {
		header: t('about.formlist.app.title'),
		items: [
			{
				testID: 'about-status-link',
				title: t('about.formlist.systemStatus'),
				icon: {
					ios: 'bubble.left.and.exclamationmark.bubble.right',
					android: 'troubleshoot',
					web: 'HeartPulse'
				},
				onPress: () => {
					if (STATUS_URL) void Linking.openURL(STATUS_URL)
				}
			}
		]
	}

	appSection.items = appSection.items?.filter(
		(item) => item.testID !== 'about-status-link' || !!STATUS_URL
	)

	const remainingSections: FormListSections[] = [
		{
			header: t('about.formlist.legal.title'),
			items: [
				{
					testID: 'about-legal-link',
					title: t('about.formlist.legal.button'),
					icon: {
						ios: 'hand.raised',
						android: 'privacy_tip',
						web: 'ShieldEllipsis'
					},
					onPress: () => {
						router.navigate('/legal')
					}
				}
			]
		}
	]

	return (
		<ScrollView
			testID="about-screen"
			contentContainerClassName="pb-bottom-safe w-full max-w-[700px] self-center"
			style={{ paddingTop: headerPadding }}
		>
			<View className="pb-5 pt-[30px]">
				<View className="items-center flex-row justify-center gap-[30px] max-w-[600px] self-center w-full">
					<View accessibilityRole="image" accessibilityLabel="HAWConnect">
						<View
							className="bg-card border-hairline border-border shadow-card rounded-md overflow-hidden"
							style={{ boxShadow: `4 4 10 0 ${labelTertiaryColor}` }}
						>
							<View className="h-[100px] w-[100px] items-center justify-center">
								<LogoSVG size={80} />
							</View>
							<Animated.View
								className="absolute inset-0 w-[45%] z-[1]"
								style={[
									{
										backgroundColor: 'rgba(255, 255, 255, 0.3)',
										transform: [{ skewX: '-20deg' }]
									},
									shimmerStyle
								]}
							/>
							<Animated.View
								className="absolute inset-0 w-[55%] z-[2]"
								style={[
									{
										backgroundColor: 'rgba(255, 255, 255, 0.15)',
										transform: [{ skewX: '-20deg' }]
									},
									shimmerStyle
								]}
							/>
						</View>
					</View>

					<View className="flex-col">
						<View className="mb-2.5">
							<Text className="text-text text-[22px] font-bold">
								{'HAWConnect'}
							</Text>
							<Text testID="about-version" className="text-label text-sm">
								{t('about.header.version', { version: appVersionLabel() })}
							</Text>
						</View>
						<View>
							<Text className="text-text text-base font-bold">
								{t('about.header.developed')}
							</Text>
							<Text className="text-text text-base">
								{t('about.maintainers')}
							</Text>
						</View>
					</View>
				</View>
			</View>

			<View className="self-center gap-4 mt-2.5 px-page w-full">
				<FormList
					sections={[
						{
							header: t('about.projectTitle'),
							item: (
								<View className="gap-3">
									<Text className="text-text">{t('about.description')}</Text>
									<Text className="text-label text-sm">
										{t('about.independence')}
									</Text>
								</View>
							)
						}
					]}
				/>
				<FormList sections={[appSection]} />
				<FormList sections={remainingSections} />
			</View>
		</ScrollView>
	)
}
