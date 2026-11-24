import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
	accentSurfaceColors,
	accentSurfaceTokens,
	accentSurfaceVariables,
	contrastRatio,
	migrateStoredThemeColor,
	normalizeThemeColor,
	themeColorMap,
	themeColors
} from '@/styles/theme-colors'
import { validSyncedPreference } from '@/utils/account-sync-response'

describe('accent colors', () => {
	it('accepts every offered accent from account sync', () => {
		for (const color of themeColors)
			expect(validSyncedPreference('themeColor', color)).toBe(true)
	})

	it('still accepts the retired purple accent from older devices', () => {
		expect(validSyncedPreference('themeColor', 'purple')).toBe(true)
	})

	it('rejects unknown accents from account sync', () => {
		expect(validSyncedPreference('themeColor', 'teal')).toBe(false)
	})

	it('offers the purple default first and a separate blue', () => {
		expect(themeColors[0]).toBe('default')
		expect(themeColors).toContain('blue')
	})

	it('keeps Blue identical to the original HAWConnect blue', () => {
		expect(themeColorMap.blue.light).toBe('#007aff')
		expect(themeColorMap.blue.dark).toBe('#0e83fd')
	})

	it('maps the retired purple accent to the default accent', () => {
		expect(normalizeThemeColor('purple')).toBe('default')
	})

	it('falls back to the default for unknown stored values', () => {
		expect(normalizeThemeColor(undefined)).toBe('default')
		expect(normalizeThemeColor('teal')).toBe('default')
	})

	it('migrates the old default blue from unversioned storage only', () => {
		expect(migrateStoredThemeColor('blue', 0)).toBe('default')
		expect(migrateStoredThemeColor('orange', 0)).toBe('orange')
		expect(migrateStoredThemeColor('blue', 1)).toBe('blue')
	})
})

describe('accent-tinted fills', () => {
	const label = { light: ['#646b78', '#6c6776'], dark: ['#a39cb0', '#9a91a6'] }

	it('keeps label and tertiary text AA on every fill, accent and scheme', () => {
		for (const color of themeColors) {
			for (const scheme of ['light', 'dark'] as const) {
				const fills = accentSurfaceColors(color, scheme)
				for (const token of accentSurfaceTokens) {
					for (const text of label[scheme]) {
						expect(contrastRatio(text, fills[token])).toBeGreaterThanOrEqual(
							4.5
						)
					}
				}
			}
		}
	})

	it('tints fills differently for different accents', () => {
		expect(accentSurfaceColors('blue', 'light')['card-contrast']).not.toBe(
			accentSurfaceColors('default', 'light')['card-contrast']
		)
	})

	it('matches the static default values in global.css', () => {
		const css = readFileSync(join(import.meta.dir, '../../global.css'), 'utf8')
		const block = (name: string) =>
			css.slice(
				css.indexOf(`@variant ${name}`),
				css.indexOf('}', css.indexOf(`@variant ${name}`))
			)
		for (const scheme of ['light', 'dark'] as const) {
			for (const [name, value] of Object.entries(
				accentSurfaceVariables('default', scheme)
			)) {
				expect(block(scheme)).toContain(`${name}: ${value};`)
			}
		}
	})
})
