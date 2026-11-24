import { describe, expect, it } from 'bun:test'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { PRIMARY_SCALE, RADIUS, TOKENS } from '../../styles/tokens'

const root = join(import.meta.dir, '..', '..', '..')
const css = readFileSync(join(root, 'src/global.css'), 'utf8')
const appConfig = readFileSync(join(root, 'app.config.ts'), 'utf8')

/** Body of the first top-level `@variant <name> {` block under :root. */
const variantBlock = (name: string) => {
	const start = css.indexOf(`@variant ${name} {`)
	expect(start).toBeGreaterThan(-1)
	let depth = 0
	for (let i = css.indexOf('{', start); i < css.length; i++) {
		if (css[i] === '{') depth++
		if (css[i] === '}' && --depth === 0) {
			return css.slice(css.indexOf('{', start) + 1, i)
		}
	}
	throw new Error(`unterminated @variant ${name}`)
}

const cssVar = (block: string, name: string) =>
	new RegExp(`--color-${name}:\\s*([^;]+);`).exec(block)?.[1]?.toLowerCase()

const fonts = ['Regular', 'Medium', 'SemiBold', 'Bold'].map(
	(w) => `Outfit-${w}.ttf`
)

describe('design tokens', () => {
	it('match the shared purple palette', () => {
		expect(TOKENS.light.primary).toBe('#40296C')
		expect(TOKENS.dark.primary).toBe('#AC97D3')
		expect(TOKENS.light['text-muted']).toBe('#646B78')
		expect(PRIMARY_SCALE).toHaveLength(10)
		expect(RADIUS.card).toBe('12px')
	})

	it('are applied to the light and dark CSS variables', () => {
		const light = variantBlock('light')
		const dark = variantBlock('dark')
		expect(cssVar(light, 'primary')).toBe('#40296c')
		expect(cssVar(light, 'background')).toBe('#f7f6f8')
		expect(cssVar(dark, 'primary')).toBe('#ac97d3')
		expect(cssVar(dark, 'background')).toBe('#141019')
		expect(cssVar(light, 'card')).toBe('#ffffff')
		expect(cssVar(dark, 'card')).toBe('#1d1726')
		expect(cssVar(light, 'text')).toBe('#211438')
		expect(cssVar(dark, 'text')).toBe('#f4f1f9')
		expect(cssVar(dark, 'on-primary')).toBe('#211438')
	})

	it('keeps tertiary label text at WCAG AA on page, card and fills', () => {
		const lum = (hex: string) => {
			const [r, g, b] = [1, 3, 5].map((i) => {
				const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255
				return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
			}) as [number, number, number]
			return 0.2126 * r + 0.7152 * g + 0.0722 * b
		}
		const ratio = (a: string, b: string) => {
			const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x) as [
				number,
				number
			]
			return (hi + 0.05) / (lo + 0.05)
		}
		for (const scheme of ['light', 'dark'] as const) {
			const block = variantBlock(scheme)
			for (const text of ['label', 'label-tertiary']) {
				for (const bg of [
					'background',
					'card',
					'input-background',
					'label-background'
				]) {
					if (
						text === 'label' &&
						bg !== 'input-background' &&
						bg !== 'label-background'
					)
						continue
					expect(
						ratio(cssVar(block, text) as string, cssVar(block, bg) as string)
					).toBeGreaterThanOrEqual(4.5)
				}
			}
		}
	})

	it('define every theme colour in dark mode too, including iOS sheets', () => {
		const names = (block: string) =>
			[...block.matchAll(/--color-([\w-]+):/g)].map((m) => m[1]).sort()
		expect(names(variantBlock('dark'))).toEqual(names(variantBlock('light')))
		expect(css).toMatch(
			/@variant ios\s*{\s*@variant dark\s*{[^}]*--color-card-sheet/
		)
	})

	it('contains no leftover iOS-blue values', () => {
		for (const blue of ['#007aff', '#0e83fd', '#087cfa']) {
			expect(css.toLowerCase()).not.toContain(blue)
			expect(appConfig.toLowerCase()).not.toContain(blue)
		}
	})

	it('has no hard-coded iOS-blue values in src', () => {
		const blues = /#007aff|#0e83fd|#087cfa|rgb\(0,\s*122,\s*255\)/i
		const offenders: string[] = []
		const walk = (dir: string) => {
			for (const name of readdirSync(dir)) {
				if (name === '__generated__' || name === 'tests') continue
				// The opt-in Blue accent keeps the original HAWConnect blue on purpose.
				if (name === 'theme-colors.ts') continue
				const path = join(dir, name)
				if (statSync(path).isDirectory()) walk(path)
				else if (blues.test(readFileSync(path, 'utf8'))) {
					offenders.push(path.slice(root.length))
				}
			}
		}
		walk(join(root, 'src'))
		expect(offenders).toEqual([])
	})

	it('bundles the Outfit faces and licence', () => {
		for (const file of fonts) {
			expect(appConfig).toContain(`./config/fonts/${file}`)
			expect(existsSync(join(root, 'config/fonts', file))).toBe(true)
		}
		expect(existsSync(join(root, 'config/fonts/OFL-Outfit.txt'))).toBe(true)
	})

	it('uses the purple app icon and launch screen config', () => {
		expect(appConfig).toContain("backgroundColor: '#40296C'")
		expect(appConfig).toContain("backgroundColor: '#F7F6F8'")
		expect(appConfig).toContain("backgroundColor: '#141019'")
		const splash = appConfig.slice(appConfig.indexOf("'expo-splash-screen'"))
		expect(splash).toContain('splash-light.png')
		expect(splash).toContain('splash-dark.png')
		expect(appConfig.toLowerCase()).not.toContain('#000000')
	})

	it('keeps the app icon image dimensions', () => {
		const width = (file: string) =>
			readFileSync(join(root, file)).readUInt32BE(16)
		const height = (file: string) =>
			readFileSync(join(root, file)).readUInt32BE(20)
		const sizes: Record<string, number> = {
			'icon.png': 1024,
			'icon-dark.png': 1024,
			'icon-tinted.png': 1024,
			'foreground.png': 1024,
			'splash-light.png': 1024,
			'splash-dark.png': 1024
		}
		for (const [name, size] of Object.entries(sizes)) {
			const file = `src/assets/hawconnect/${name}`
			expect([width(file), height(file)]).toEqual([size, size])
		}
		expect(width('public/hawconnect-icon-512.png')).toBe(512)
		expect(width('public/hawconnect-icon-192.png')).toBe(192)
	})

	it('has no blue in the web icon, manifest or page metadata', () => {
		for (const file of ['hawconnect-icon.svg', 'manifest.json', 'index.html']) {
			const text = readFileSync(
				join(root, 'public', file),
				'utf8'
			).toLowerCase()
			expect(text).not.toContain('#087cfa')
			expect(text).not.toContain('#f2f2f2')
		}
		expect(
			readFileSync(join(root, 'public/hawconnect-icon.svg'), 'utf8')
		).toContain('#40296C')
	})
})
