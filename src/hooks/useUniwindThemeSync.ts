import { useEffect } from 'react'
import { Appearance, Platform } from 'react-native'
import { Uniwind } from 'uniwind'
import { usePreferencesStore } from '@/hooks/usePreferencesStore'
import {
	accentSurfaceVariables,
	normalizeThemeColor,
	themeColorMap
} from '@/styles/theme-colors'
import { setNativeInterfaceFont, WEB_FONT_STACK } from '@/utils/interface-font'

const WEB_BROWSER_CHROME = {
	light: '#f7f6f8',
	dark: '#141019'
} as const

function resolveUniwindTheme(theme: string): 'light' | 'dark' | 'system' {
	if (theme === 'light' || theme === 'dark') {
		return theme
	}

	return 'system'
}

function resolveActiveTheme(theme: string): 'light' | 'dark' {
	const resolved = resolveUniwindTheme(theme)
	if (resolved === 'light' || resolved === 'dark') {
		return resolved
	}

	return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'
}

function syncWebBrowserChrome(activeTheme: 'light' | 'dark'): void {
	if (Platform.OS !== 'web' || typeof document === 'undefined') {
		return
	}

	const color = WEB_BROWSER_CHROME[activeTheme]

	// Drop static media-query tags so forced app theme can override the device.
	for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
		meta.remove()
	}

	const themeColor = document.createElement('meta')
	themeColor.setAttribute('name', 'theme-color')
	themeColor.setAttribute('content', color)
	document.head.appendChild(themeColor)

	let colorScheme = document.querySelector('meta[name="color-scheme"]')
	if (!colorScheme) {
		colorScheme = document.createElement('meta')
		colorScheme.setAttribute('name', 'color-scheme')
		document.head.appendChild(colorScheme)
	}
	colorScheme.setAttribute('content', activeTheme)
	document.documentElement.style.colorScheme = activeTheme
}

export function useUniwindThemeSync(): void {
	const theme = usePreferencesStore((state) => state.theme)
	const themeColor = usePreferencesStore((state) => state.themeColor)
	const interfaceFont = usePreferencesStore((state) => state.interfaceFont)

	useEffect(() => {
		if (Platform.OS === 'web') {
			if (typeof document !== 'undefined') {
				document.documentElement.style.setProperty(
					'--font-sans',
					WEB_FONT_STACK[interfaceFont]
				)
			}
			return
		}
		setNativeInterfaceFont(interfaceFont)
	}, [interfaceFont])

	useEffect(() => {
		Uniwind.setTheme(resolveUniwindTheme(theme))
	}, [theme])

	useEffect(() => {
		const accent = normalizeThemeColor(themeColor)
		const colors = themeColorMap[accent]
		const lightVariables = {
			'--color-primary': colors.light,
			'--color-secondary': colors.light,
			'--color-primary-background': `${colors.light}15`,
			'--color-on-primary': colors.onLight,
			...accentSurfaceVariables(accent, 'light')
		}
		const darkVariables = {
			'--color-primary': colors.dark,
			'--color-secondary': colors.dark,
			'--color-primary-background': `${colors.dark}25`,
			'--color-on-primary': colors.onDark,
			...accentSurfaceVariables(accent, 'dark')
		}
		const activeTheme = resolveActiveTheme(theme)

		// Update the inactive theme first so the active theme wins on first render.
		if (activeTheme === 'light') {
			Uniwind.updateCSSVariables('dark', darkVariables)
			Uniwind.updateCSSVariables('light', lightVariables)
			return
		}

		Uniwind.updateCSSVariables('light', lightVariables)
		Uniwind.updateCSSVariables('dark', darkVariables)
	}, [theme, themeColor])

	useEffect(() => {
		const apply = () => {
			syncWebBrowserChrome(resolveActiveTheme(theme))
		}

		apply()

		if (resolveUniwindTheme(theme) !== 'system') {
			return
		}

		const subscription = Appearance.addChangeListener(apply)
		return () => {
			subscription.remove()
		}
	}, [theme])
}
