import type React from 'react'
import { useTranslation } from 'react-i18next'
import { type ColorValue, View } from 'react-native'
import { useCSSVariable } from 'uniwind'
import PlatformIcon, { type LucideIcon } from '@/components/Universal/icon'
import type { MaterialIcon } from '@/types/material-icons'
import { toColor } from '@/utils/uniwind-utils'

interface IndexHeaderRightProps {
	color?: ColorValue
	size?: number
	focused?: boolean
}

/** The Profile tab's person icon. */
export const SettingsTabButton = ({
	color,
	size = 24,
	focused = false
}: IndexHeaderRightProps): React.JSX.Element => {
	const { t } = useTranslation(['navigation', 'settings'])
	const textColor = toColor(useCSSVariable('--color-text'))
	return (
		<View accessibilityLabel={t('navigation.settings')}>
			<PlatformIcon
				ios={{
					name: focused ? 'person.crop.circle.fill' : 'person.crop.circle',
					size
				}}
				android={{
					name: 'account_circle' as MaterialIcon,
					size: size + 2,
					variant: focused ? 'filled' : 'outlined'
				}}
				web={{ name: 'CircleUserRound' as LucideIcon, size }}
				style={{ color: color || textColor }}
			/>
		</View>
	)
}
