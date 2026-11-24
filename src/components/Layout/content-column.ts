import type { ViewStyle } from 'react-native'

/**
 * Keeps page content readable on wide windows: full width on phones, a
 * centred column of at most `maxWidth` on desktop web.
 */
export const contentColumn = (maxWidth = 960): ViewStyle => ({
	width: '100%',
	maxWidth,
	alignSelf: 'center'
})
