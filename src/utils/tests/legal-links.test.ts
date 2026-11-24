import { describe, expect, it } from 'bun:test'
import { LEGAL_PAGES, legalUrl } from '../legal-links'

describe('legal links', () => {
	it('points every page at hawconnect.de in the app language', () => {
		expect(legalUrl('privacy', 'de')).toBe(
			'https://hawconnect.de/de/legal/privacy'
		)
		expect(legalUrl('imprint', 'en')).toBe(
			'https://hawconnect.de/en/legal/imprint'
		)
		expect(legalUrl('terms', 'de-DE')).toBe(
			'https://hawconnect.de/de/legal/terms'
		)
	})

	it('falls back to English for other or missing languages', () => {
		expect(legalUrl('privacy', 'fr')).toBe(
			'https://hawconnect.de/en/legal/privacy'
		)
		expect(legalUrl('terms')).toBe('https://hawconnect.de/en/legal/terms')
	})

	it('covers privacy, imprint and terms', () => {
		expect([...LEGAL_PAGES]).toEqual(['privacy', 'imprint', 'terms'])
	})
})
