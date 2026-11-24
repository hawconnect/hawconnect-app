import { afterEach, describe, expect, it } from 'bun:test'
import { fieldsFor } from '../marketplace-fields'
import {
	contactLinks,
	deadlineState,
	detailIcon,
	listingSubtitle
} from '../marketplace-job'

describe('deadlineState', () => {
	it('says open with days left', () => {
		expect(
			deadlineState('2026-12-15', new Date('2026-11-16T10:00:00Z'))
		).toEqual({ kind: 'open', days: 29 })
	})
	it('says today on the deadline day in Berlin, also at 23:30', () => {
		expect(
			deadlineState('2026-12-15', new Date('2026-12-15T22:30:00Z'))
		).toEqual({ kind: 'today' })
	})
	it('says closed from the next day', () => {
		expect(
			deadlineState('2026-12-15', new Date('2026-12-15T23:30:00Z'))
		).toEqual({ kind: 'closed' })
	})
	it('returns null without a deadline', () => {
		expect(deadlineState(null, new Date())).toBeNull()
		expect(deadlineState(undefined, new Date())).toBeNull()
		expect(deadlineState('', new Date())).toBeNull()
		expect(deadlineState('soon', new Date())).toBeNull()
	})
	it('falls back to the device date when the time zone is unsupported', () => {
		const now = new Date(2026, 11, 15, 12, 0, 0)
		expect(deadlineState('2026-12-15', now, 'Not/AZone')).toEqual({
			kind: 'today'
		})
		expect(deadlineState('2026-12-16', now, 'Not/AZone')).toEqual({
			kind: 'open',
			days: 1
		})
	})
})

describe('contactLinks', () => {
	it('shows only filled fields', () => {
		expect(contactLinks({ contactName: 'Ada' })).toEqual({ name: 'Ada' })
		expect(contactLinks({ contactEmail: 'hr@example.com' })).toEqual({
			email: { text: 'hr@example.com', href: 'mailto:hr@example.com' }
		})
		expect(contactLinks({})).toBeNull()
		expect(contactLinks({ contactName: '  ', contactRole: '' })).toBeNull()
	})
	it('keeps a role without a name', () => {
		expect(contactLinks({ contactRole: 'HR' })).toEqual({ role: 'HR' })
	})
	it('drops a non-https website', () => {
		expect(contactLinks({ companyWebsite: 'http://example.com' })).toBeNull()
		expect(contactLinks({ companyWebsite: 'javascript:alert(1)' })).toBeNull()
		expect(contactLinks({ companyWebsite: 'https://example.com/' })).toEqual({
			website: { text: 'example.com', href: 'https://example.com/' }
		})
	})
	it('builds mailto keeping @domain', () => {
		expect(
			contactLinks({ contactName: 'Ada', contactEmail: 'a+b@example.com' })
		).toEqual({
			name: 'Ada',
			email: { text: 'a+b@example.com', href: 'mailto:a%2Bb@example.com' }
		})
		expect(contactLinks({ contactEmail: 'nope' })).toBeNull()
	})
})

describe('listingSubtitle', () => {
	it('joins employer and location', () => {
		const job = { category: 'jobs', type: 'offer' }
		expect(
			listingSubtitle({
				...job,
				location: 'Hamburg',
				details: { employer: 'Acme' }
			})
		).toBe('Acme · Hamburg')
		expect(
			listingSubtitle({ ...job, location: '', details: { employer: 'Acme' } })
		).toBe('Acme')
		expect(listingSubtitle({ ...job, location: 'Hamburg', details: {} })).toBe(
			'Hamburg'
		)
		expect(listingSubtitle({ ...job, location: '', details: {} })).toBeNull()
	})
	it('shows location only for housing', () => {
		expect(
			listingSubtitle({
				category: 'housing',
				type: 'offer',
				location: 'Bergedorf',
				details: { employer: 'ignored' }
			})
		).toBe('Bergedorf')
		expect(
			listingSubtitle({
				category: 'jobs',
				type: 'request',
				location: 'Hamburg',
				details: {}
			})
		).toBe('Hamburg')
	})
})

describe('detailIcon', () => {
	it('has an icon for every registry key', () => {
		const keys = new Set(['price', 'location', 'availableFrom'])
		for (const category of ['jobs', 'housing'])
			for (const type of ['offer', 'request'])
				for (const spec of fieldsFor(category, type)) keys.add(spec.key)
		for (const key of keys) {
			const icon = detailIcon(key)
			expect(icon.ios).toBeTruthy()
			expect(icon.android).toBeTruthy()
			expect(icon.web).toBeTruthy()
			expect(icon.web).not.toBe('Tag')
		}
	})
})

describe('deadlineState with an odd Intl runtime', () => {
	const real = Intl.DateTimeFormat
	afterEach(() => {
		Intl.DateTimeFormat = real
	})
	it('falls back to the device date when parts are missing', () => {
		Intl.DateTimeFormat = class {
			formatToParts() {
				return [{ type: 'literal', value: '16.11.2026' }]
			}
			format() {
				return '16.11.2026'
			}
		} as unknown as typeof Intl.DateTimeFormat
		const now = new Date(2026, 10, 16, 12)
		expect(deadlineState('2026-11-15', now)).toEqual({ kind: 'closed' })
		expect(deadlineState('2026-11-16', now)).toEqual({ kind: 'today' })
	})
	it('builds the day from parts whatever the locale format', () => {
		Intl.DateTimeFormat = class {
			formatToParts() {
				return [
					{ type: 'day', value: '16' },
					{ type: 'literal', value: '.' },
					{ type: 'month', value: '11' },
					{ type: 'year', value: '2026' }
				]
			}
		} as unknown as typeof Intl.DateTimeFormat
		expect(deadlineState('2026-11-16', new Date(2026, 10, 1))).toEqual({
			kind: 'today'
		})
	})
})
