import type React from 'react'
import type { TextStyle } from 'react-native'
import { useCSSVariable } from 'uniwind'
import type { MaterialIcon } from '@/types/material-icons'
import { tablerIconFor, type WebIconName } from '@/utils/tabler-icons'
import { toColor } from '@/utils/uniwind-utils'

export type CommunityIcon = 'instagram' | 'github' | 'map-marker'
/** Icon name for `PlatformIcon`'s `web` prop; every name has a Tabler icon. */
export type WebIcon = WebIconName
/** Former lucide name type, kept so call sites need no change. */
export type LucideIcon = WebIconName

/** Tabler stroke width for every icon in the app. */
const STROKE_WIDTH = 1.75

interface PlatformIconProps {
	/** Legacy, not rendered: icons are Tabler on every platform (see `web`). */
	android: {
		name: MaterialIcon | CommunityIcon
		size: number
		variant?: 'filled' | 'outlined'
	}
	/** Legacy, not rendered: icons are Tabler on every platform (see `web`). */
	ios: {
		name: string
		size: number
		weight?:
			| 'ultraLight'
			| 'thin'
			| 'light'
			| 'regular'
			| 'medium'
			| 'semibold'
			| 'bold'
			| 'heavy'
			| 'black'
		variant?: string
		fallback?: boolean
		renderMode?:
			| 'multicolor'
			| 'monochrome'
			| 'hierarchical'
			| 'palette'
			| undefined
		variableValue?: number | undefined
		additionalColor?: string
	}
	/** The icon every platform renders: a Tabler icon looked up from this name. */
	web: {
		name: WebIcon
		size: number
		variant?: 'filled' | 'outlined'
	}
	style?: TextStyle
}

export const lucidErrorIcon = {
	name: 'error',
	size: 24,
	color: 'red'
}

export const linkIcon = {
	ios: 'safari',
	android: 'link' as MaterialIcon,
	web: 'Link' as LucideIcon
}

/**
 * Draws an icon. Every platform renders the Tabler icon for `web.name` at
 * `web.size`, coloured by `style.color`; `ios` and `android` are unused.
 */
const PlatformIcon = ({ web, style }: PlatformIconProps): React.JSX.Element => {
	const primaryColor = String(
		toColor(useCSSVariable('--color-primary')) ?? '#40296C'
	)
	const { color, ...rest } = style ?? {}
	const Icon = tablerIconFor(web.name, web.variant)

	return (
		<Icon
			size={web.size}
			strokeWidth={STROKE_WIDTH}
			color={typeof color === 'string' ? color : primaryColor}
			style={rest as TextStyle}
		/>
	)
}

export default PlatformIcon
