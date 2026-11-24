import { darkTheme, lightTheme } from '@/styles/themes'

/** Accent colors in menu order. `mono` is black in light mode and white in dark mode. */
export const themeColors = [
	'default',
	'blue',
	'cyan',
	'green',
	'lime',
	'yellow',
	'orange',
	'pink',
	'magenta',
	'mono'
] as const

export type ThemeColor = (typeof themeColors)[number]

interface AccentColor {
	light: string
	dark: string
	/** Text/icon color drawn on top of the accent (e.g. filled buttons). */
	onLight: string
	onDark: string
}

// Light values are darkened so accent text stays readable on white cards.
export const themeColorMap: Record<ThemeColor, AccentColor> = {
	default: {
		light: lightTheme.colors.primary,
		dark: darkTheme.colors.primary,
		onLight: '#ffffff',
		onDark: '#211438'
	},
	// The original HAWConnect blue, offered as an opt-in accent (same as the live site).
	blue: {
		light: '#007aff',
		dark: '#0e83fd',
		onLight: '#ffffff',
		onDark: '#ffffff'
	},
	cyan: {
		light: '#0a84b8',
		dark: '#4cc3ff',
		onLight: '#ffffff',
		onDark: '#000000'
	},
	green: {
		light: '#2d9e66',
		dark: '#24ff88',
		onLight: '#ffffff',
		onDark: '#000000'
	},
	lime: {
		light: '#5b8c00',
		dark: '#b5e61d',
		onLight: '#ffffff',
		onDark: '#000000'
	},
	yellow: {
		light: '#a87a00',
		dark: '#ffd60a',
		onLight: '#ffffff',
		onDark: '#000000'
	},
	orange: {
		light: '#d9480f',
		dark: '#ff8a5b',
		onLight: '#ffffff',
		onDark: '#000000'
	},
	pink: {
		light: '#d6336c',
		dark: '#ff6fae',
		onLight: '#ffffff',
		onDark: '#000000'
	},
	magenta: {
		light: '#9c36b5',
		dark: '#d07cf0',
		onLight: '#ffffff',
		onDark: '#000000'
	},
	mono: {
		light: '#000000',
		dark: '#ffffff',
		onLight: '#ffffff',
		onDark: '#000000'
	}
}

/** Maps stored or synced values to a supported accent. The retired `purple` key and unknown values map to `default`, the purple brand accent. */
export function normalizeThemeColor(value: unknown): ThemeColor {
	if (value === 'purple') return 'default'
	return themeColors.includes(value as ThemeColor)
		? (value as ThemeColor)
		: 'default'
}

/** Before version 1 of the stored preferences, `blue` was the default accent; it now means the purple `default`. */
export function migrateStoredThemeColor(
	value: unknown,
	version: number
): ThemeColor {
	if (version < 1 && value === 'blue') return 'default'
	return normalizeThemeColor(value)
}

export function accentColorFor(color: ThemeColor, dark: boolean): string {
	const entry = themeColorMap[color]
	return dark ? entry.dark : entry.light
}

type Scheme = 'light' | 'dark'

/** Neutral fills tinted with the accent. `date-picker-background` follows `input-background`. */
export const accentSurfaceTokens = [
	'card-button',
	'card-contrast',
	'label-background',
	'input-background'
] as const

type AccentSurfaceToken = (typeof accentSurfaceTokens)[number]

/** How much accent is mixed into the card colour, per fill. */
const SURFACE_TINT: Record<Scheme, Record<AccentSurfaceToken, number>> = {
	light: {
		'card-button': 0.08,
		'card-contrast': 0.2,
		'label-background': 0.14,
		'input-background': 0.11
	},
	dark: {
		'card-button': 0.09,
		'card-contrast': 0.06,
		'label-background': 0.11,
		'input-background': 0.09
	}
}

/** Alpha of `--color-primary-background` (hex `15` light, `25` dark in useUniwindThemeSync). */
export const PRIMARY_BACKGROUND_ALPHA: Record<Scheme, number> = {
	light: 0x15 / 255,
	dark: 0x25 / 255
}

const SURFACE_BASE: Record<Scheme, string> = {
	light: '#ffffff',
	dark: '#1d1726'
}

/** Text drawn on these fills (label and label-tertiary) that must stay at 4.5:1. */
const SURFACE_TEXT: Record<Scheme, readonly string[]> = {
	light: ['#646b78', '#6c6776'],
	dark: ['#a39cb0', '#9a91a6']
}

function channels(hex: string): number[] {
	return [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16))
}

function luminance(hex: string): number {
	const [r, g, b] = channels(hex).map((v) => {
		const c = v / 255
		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
	})
	return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(a: string, b: string): number {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
	return (hi + 0.05) / (lo + 0.05)
}

function mix(color: string, base: string, amount: number): string {
	const c = channels(color)
	const b = channels(base)
	return `#${b
		.map((v, i) =>
			Math.round(v + (c[i] - v) * amount)
				.toString(16)
				.padStart(2, '0')
		)
		.join('')}`
}

/** Accent-tinted neutral fills for one scheme; the tint backs off until label text stays AA. */
export function accentSurfaceColors(
	color: ThemeColor,
	scheme: Scheme
): Record<AccentSurfaceToken, string> {
	// The brighter (dark-scheme) accent keeps light tints colourful; mono would turn white, so it keeps black.
	const accent = accentColorFor(color, scheme === 'dark' || color !== 'mono')
	// card-contrast (chips, image tiles) matches the primary-background tint: the scheme's own accent at the same alpha.
	const primaryBackground = accentColorFor(color, scheme === 'dark')
	const result = {} as Record<AccentSurfaceToken, string>
	for (const token of accentSurfaceTokens) {
		const source = token === 'card-contrast' ? primaryBackground : accent
		let amount =
			token === 'card-contrast'
				? PRIMARY_BACKGROUND_ALPHA[scheme]
				: SURFACE_TINT[scheme][token]
		let fill = mix(source, SURFACE_BASE[scheme], amount)
		while (
			amount > 0 &&
			SURFACE_TEXT[scheme].some((text) => contrastRatio(text, fill) < 4.5)
		) {
			amount = Math.max(0, amount - 0.005)
			fill = mix(source, SURFACE_BASE[scheme], amount)
		}
		result[token] = fill
	}
	return result
}

/** CSS variables for the accent-tinted fills, ready for `Uniwind.updateCSSVariables`. */
export function accentSurfaceVariables(
	color: ThemeColor,
	scheme: Scheme
): Record<string, string> {
	const colors = accentSurfaceColors(color, scheme)
	return {
		'--color-card-button': colors['card-button'],
		'--color-card-contrast': colors['card-contrast'],
		'--color-label-background': colors['label-background'],
		'--color-input-background': colors['input-background'],
		'--color-date-picker-background': colors['input-background']
	}
}
