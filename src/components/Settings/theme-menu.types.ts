import type React from 'react'
import type PlatformIcon from '@/components/Universal/icon'

export interface ThemeMenuOption {
	key: string
	title: string
	/** Swatch shown beside the title (accent colors). */
	color?: string
	/** Icon shown beside the title (appearance modes); sized and coloured by the menu. */
	icon?: Pick<
		React.ComponentProps<typeof PlatformIcon>,
		'ios' | 'android' | 'web'
	>
}

export interface ThemeMenuProps {
	testID?: string
	accessibilityLabel: string
	options: ThemeMenuOption[]
	selected: string
	onSelect: (key: string) => void
	/** Form look: a full-width pill with this placeholder and a chevron-down. */
	field?: { placeholder: string; invalid?: boolean }
}
