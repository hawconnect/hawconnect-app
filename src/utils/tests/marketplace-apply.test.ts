import { describe, expect, it } from 'bun:test'
import { applyAddress, applyLink, safeHttpsUrl } from '../marketplace-apply'

describe('applyLink', () => {
	it('returns the https URL', () => {
		expect(
			applyLink({ applyMethod: 'url', applyUrl: 'https://jobs.example.com/a' })
		).toBe('https://jobs.example.com/a')
	})
	it('builds mailto and encodes the address', () => {
		expect(
			applyLink({ applyMethod: 'email', applyEmail: 'hr+jobs@example.com' })
		).toBe('mailto:hr%2Bjobs@example.com')
	})
	it('refuses javascript:, http: and credentials', () => {
		for (const applyUrl of [
			'javascript:alert(1)',
			'http://example.com',
			'https://user:pw@example.com',
			'not a url'
		])
			expect(applyLink({ applyMethod: 'url', applyUrl })).toBeNull()
	})
	it('uses only the chosen method and rejects bad emails', () => {
		expect(
			applyLink({
				applyMethod: 'email',
				applyUrl: 'https://example.com',
				applyEmail: null
			})
		).toBeNull()
		expect(applyLink({ applyMethod: 'email', applyEmail: 'nope' })).toBeNull()
		expect(applyLink({ applyMethod: 'url', applyEmail: 'a@b.de' })).toBeNull()
		expect(applyLink({})).toBeNull()
	})
})

describe('safeHttpsUrl', () => {
	it('rejects whitespace, empty hosts and credentials as Hermes would not', () => {
		for (const value of [
			'https://my site.de',
			'https://',
			'https:///path',
			'https://x.de/a b',
			'https://u:p@x.de',
			'http://x.de',
			42
		])
			expect(safeHttpsUrl(value)).toBeNull()
		expect(safeHttpsUrl('https://x.de/jobs?a=1#b')).toBe(
			'https://x.de/jobs?a=1#b'
		)
		expect(safeHttpsUrl('https://x.de')).toBe('https://x.de')
	})
})

describe('applyAddress', () => {
	it('returns the plain email or https link of the chosen method', () => {
		expect(
			applyAddress({ applyMethod: 'email', applyEmail: 'hr@example.com' })
		).toBe('hr@example.com')
		expect(
			applyAddress({ applyMethod: 'url', applyUrl: 'https://x.de/jobs' })
		).toBe('https://x.de/jobs')
	})
	it('returns null for unusable or missing values', () => {
		expect(
			applyAddress({ applyMethod: 'email', applyEmail: 'nope' })
		).toBeNull()
		expect(
			applyAddress({ applyMethod: 'url', applyUrl: 'http://x.de' })
		).toBeNull()
		expect(applyAddress({})).toBeNull()
	})
})
