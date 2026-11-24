import { describe, expect, it, mock } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// The real icon package needs the native SVG runtime; stand in for it.
const tablerStub: Record<string, () => null> = Object.fromEntries(
	[
		...readFileSync(
			join(import.meta.dir, '..', 'tabler-icons.ts'),
			'utf8'
		).matchAll(/^\t(Icon[A-Za-z0-9]+),$/gm)
	].map((m) => [m[1], () => null])
)
mock.module('@tabler/icons-react-native', () => tablerStub)

const { OFFER_FALLBACK_ICON, offerIcon } = await import('../cafeteria-offers')
const { TABLER_ICONS } = await import('../tabler-icons')

const KEYS = [
	'breakfast',
	'hot-dishes',
	'warm-snacks',
	'happy-hour',
	'seats',
	'highchairs',
	'barrier-free',
	'pasta-bar',
	'salad-bar',
	'vegetable-bar',
	'pizza'
]

describe('offerIcon', () => {
	it('maps every known offer to its own Tabler icon', () => {
		for (const key of KEYS) {
			const icon = offerIcon(key)
			expect(icon).not.toBe(OFFER_FALLBACK_ICON)
			expect(Object.hasOwn(TABLER_ICONS, icon.web)).toBe(true)
		}
		expect(new Set(KEYS.map((key) => offerIcon(key).web)).size).toBe(
			KEYS.length
		)
	})

	it('falls back to a neutral icon for unknown offers', () => {
		expect(offerIcon('coffee-to-go')).toBe(OFFER_FALLBACK_ICON)
		expect(offerIcon('toString')).toBe(OFFER_FALLBACK_ICON)
		expect(Object.hasOwn(TABLER_ICONS, OFFER_FALLBACK_ICON.web)).toBe(true)
	})
})
