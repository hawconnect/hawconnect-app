// Regenerates src/assets/tabbar/*.png (black on transparent so the OS can tint
// them) from the Tabler icons the native tab bar shows. macOS only (uses swift).
// Run: bun scripts/render-tabbar-icons.ts
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const ICONS = {
	home: 'IconHome',
	timetable: 'IconClock',
	map: 'IconMap',
	food: 'IconToolsKitchen2',
	profile: 'IconUserCircle'
} as const
const STROKE = 1.75
const SIZE = 24
const root = join(import.meta.dir, '..')
const out = join(root, 'src/assets/tabbar')
const work = join(tmpdir(), 'hawconnect-tabbar-svg')
mkdirSync(out, { recursive: true })
mkdirSync(work, { recursive: true })

for (const [name, icon] of Object.entries(ICONS)) {
	const source = readFileSync(
		join(
			root,
			`node_modules/@tabler/icons-react-native/dist/esm/icons/${icon}.mjs`
		),
		'utf8'
	)
	const node = source.match(/createReactNativeComponent\([^[]*(\[\[.*\]\])\);/s)
	if (node == null) throw new Error(`No icon node in ${icon}`)
	const shapes = (JSON.parse(node[1]) as [string, Record<string, string>][])
		.map(([tag, attrs]) => {
			const props = Object.entries(attrs)
				.filter(([key]) => key !== 'key')
				.map(([key, value]) => `${key}="${value}"`)
				.join(' ')
			return `<${tag} ${props}/>`
		})
		.join('')
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round">${shapes}</svg>`
	const svgPath = join(work, `${name}.svg`)
	writeFileSync(svgPath, svg)
	for (const scale of [1, 2, 3]) {
		const file = join(out, scale === 1 ? `${name}.png` : `${name}@${scale}x.png`)
		const run = Bun.spawnSync([
			'swift',
			join(import.meta.dir, 'svg-to-png.swift'),
			svgPath,
			file,
			String(SIZE * scale)
		])
		if (run.exitCode !== 0) throw new Error(run.stderr.toString())
	}
}
console.log(`Wrote ${Object.keys(ICONS).length * 3} PNGs to ${out}`)
