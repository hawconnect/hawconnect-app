import { Link } from 'expo-router'
import type React from 'react'
import { useTranslation } from 'react-i18next'
import { Platform, Pressable, View } from 'react-native'
import { useCSSVariable } from 'uniwind'
import PlatformIcon from '@/components/Universal/icon'
import { toColor } from '@/utils/uniwind-utils'

export const FoodHeaderRight = (): React.JSX.Element => {
	const { t } = useTranslation(['accessibility', 'food'])
	const iconColor = toColor(useCSSVariable('--color-text'))
	const spacing = Platform.OS !== 'ios' ? 'mx-3.5' : 'mx-1.5'

	return (
		<View className="flex-row items-center">
			<Link asChild href="/cafeterias">
				<Pressable
					testID="food-cafeterias-button"
					hitSlop={10}
					className={spacing}
					accessibilityLabel={t('cafeterias.title', { ns: 'food' })}
				>
					<PlatformIcon
						ios={{
							name: 'cup.and.saucer',
							size: 19
						}}
						android={{
							name: 'local_cafe',
							size: 24
						}}
						web={{
							name: 'Coffee',
							size: 24
						}}
						style={{ color: iconColor }}
					/>
				</Pressable>
			</Link>
			<Link asChild href="/food-preferences">
				<Pressable
					hitSlop={10}
					className={spacing}
					accessibilityLabel={t('button.foodPreferences')}
				>
					<PlatformIcon
						ios={{
							name: 'line.3.horizontal.decrease',
							size: 19
						}}
						android={{
							name: 'filter_list',
							size: 24
						}}
						web={{
							name: 'ListFilter',
							size: 24
						}}
						style={{ color: iconColor }}
					/>
				</Pressable>
			</Link>
		</View>
	)
}
