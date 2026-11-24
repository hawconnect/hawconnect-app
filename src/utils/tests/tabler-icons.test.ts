import { describe, expect, it, mock } from 'bun:test'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { quickLinkIconMap } from '../managed-quick-links'

// The real package needs the native react-native-svg runtime, which bun cannot
// load. A stand-in gives every icon name its own stable component; the check
// that each name exists in the real package reads its files instead.
const tablerStub: Record<string, () => null> = Object.fromEntries(
	[
		...readFileSync(
			join(import.meta.dir, '..', 'tabler-icons.ts'),
			'utf8'
		).matchAll(/^\t(Icon[A-Za-z0-9]+),$/gm)
	].map((m) => [m[1], () => null])
)
mock.module('@tabler/icons-react-native', () => tablerStub)

const { TABLER_FALLBACK_ICON, TABLER_ICONS, tablerIconFor } = await import(
	'../tabler-icons'
)
type WebIconName = keyof typeof TABLER_ICONS
const stub = (name: string) => tablerStub[name] as never

const SRC = join(import.meta.dir, '..', '..')

function sourceFiles(dir: string): string[] {
	return readdirSync(dir).flatMap((entry) => {
		const path = join(dir, entry)
		if (entry === '__generated__' || entry === 'tests') return []
		if (statSync(path).isDirectory()) return sourceFiles(path)
		return /\.(ts|tsx)$/.test(entry) ? [path] : []
	})
}

/** Every string literal that is a `web` icon name at a call site. */
function usedWebNames(): Map<string, string> {
	const used = new Map<string, string>()
	for (const file of sourceFiles(SRC)) {
		const text = readFileSync(file, 'utf8')
		// web={{ name: 'X', ... }}  web: { name: 'X' }  web: 'X'  webName="X"
		const blocks = text.matchAll(
			/\bweb(?:=\{\{|:\s)\s*\{?\s*([^}]*?)(?:\}|,\s*size|$)/gm
		)
		for (const block of blocks) {
			for (const lit of block[1].matchAll(/(?<!===\s)'([^']+)'/g)) {
				if (/^[A-Za-z][A-Za-z0-9-]*$/.test(lit[1]) && lit[1] !== 'name')
					used.set(lit[1], file)
			}
		}
		for (const m of text.matchAll(/webName\s*=\s*["']([^"']+)["']/g))
			used.set(m[1], file)
	}
	return used
}

describe('tabler icon mapping', () => {
	it('finds the call sites it is meant to check', () => {
		const names = usedWebNames()
		expect(names.size).toBeGreaterThan(40)
		expect(names.has('Check')).toBe(true)
		expect(names.has('ChevronUp')).toBe(true)
	})

	it('maps every web icon name used in src', () => {
		const missing = [...usedWebNames()].filter(
			([name]) => !Object.hasOwn(TABLER_ICONS, name)
		)
		expect(missing).toEqual([])
	})

	it('maps every managed quick-link icon', () => {
		for (const name of Object.keys(quickLinkIconMap))
			expect(Object.hasOwn(TABLER_ICONS, name)).toBe(true)
	})

	it('maps the community names', () => {
		expect(tablerIconFor('instagram')).toBe(stub('IconBrandInstagram'))
		expect(tablerIconFor('github')).toBe(stub('IconBrandGithub'))
		expect(tablerIconFor('map-marker')).toBe(stub('IconMapPin'))
	})

	it('falls back to a neutral icon for an unknown name', () => {
		expect(tablerIconFor('NotARealIcon' as never)).toBe(TABLER_FALLBACK_ICON)
		expect(TABLER_FALLBACK_ICON).toBe(stub('IconCircleDashed'))
		expect(tablerIconFor('toString' as WebIconName)).toBe(TABLER_FALLBACK_ICON)
	})

	it('uses the filled twin only when asked and available', () => {
		expect(tablerIconFor('Star', 'filled')).not.toBe(tablerIconFor('Star'))
		expect(tablerIconFor('Check', 'filled')).toBe(tablerIconFor('Check'))
	})

	it('only imports icons that exist in @tabler/icons-react-native 3.52', () => {
		const text = readFileSync(join(SRC, 'utils', 'tabler-icons.ts'), 'utf8')
		const names = [...text.matchAll(/^\t(Icon[A-Za-z0-9]+),$/gm)].map(
			(m) => m[1]
		)
		expect(names.length).toBeGreaterThan(80)
		const dir = join(
			SRC,
			'..',
			'node_modules',
			'@tabler',
			'icons-react-native',
			'dist',
			'esm',
			'icons'
		)
		expect(names.filter((n) => !existsSync(join(dir, `${n}.mjs`)))).toEqual([])
	})

	it('no src file imports lucide-react-native', () => {
		const offenders = sourceFiles(SRC).filter((file) =>
			readFileSync(file, 'utf8').includes('lucide-react-native')
		)
		expect(offenders).toEqual([])
	})
})
