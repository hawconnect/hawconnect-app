import { Stack } from 'expo-router'
import type React from 'react'
import { useTranslation } from 'react-i18next'
import { Platform } from 'react-native'
import { useTransparentHeaderStyle } from '@/hooks/useTransparentHeader'

export default function SettingsLayout(): React.JSX.Element {
	const { t } = useTranslation('navigation')
	const transparentHeaderStyle = useTransparentHeaderStyle()

	return (
		<Stack screenOptions={transparentHeaderStyle}>
			<Stack.Screen
				name="index"
				options={{
					title: t('navigation.profile'),
					// A tab's first page has nowhere to go back to (the tabs sit above the start route).
					headerBackVisible: false,
					// The web stack ignores headerBackVisible and only checks headerLeft.
					headerLeft: Platform.OS === 'web' ? () => null : undefined,
					...transparentHeaderStyle
				}}
			/>
		</Stack>
	)
}
