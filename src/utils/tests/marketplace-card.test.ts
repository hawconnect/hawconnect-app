import { describe, expect, it } from 'bun:test'
import {
	cardChips,
	latestPosts,
	relativeAge,
	reportErrorKey
} from '../marketplace-card'

const post = (id: string, createdAt: string) => ({ id, createdAt })

describe('latestPosts', () => {
	it('sorts by createdAt descending and keeps at most the limit', () => {
		const posts = [
			post('a', '2026-11-01T10:00:00Z'),
			post('d', '2026-11-04T10:00:00Z'),
			post('b', '2026-11-02T10:00:00Z'),
			post('c', '2026-11-03T10:00:00Z')
		]
		expect(latestPosts(posts, 3).map((p) => p.id)).toEqual(['d', 'c', 'b'])
	})
	it('does not mutate the input and handles short lists', () => {
		const posts = [
			post('a', '2026-11-01T10:00:00Z'),
			post('b', '2026-11-02T10:00:00Z')
		]
		expect(latestPosts(posts, 3).map((p) => p.id)).toEqual(['b', 'a'])
		expect(posts.map((p) => p.id)).toEqual(['a', 'b'])
		expect(latestPosts([], 3)).toEqual([])
	})
})

describe('reportErrorKey', () => {
	it('shows the expired-link copy for an invalid, expired or foreign token', () => {
		expect(reportErrorKey({ code: 'PostUnavailable' })).toBe(
			'marketplace.report.linkExpired'
		)
	})
	it('keeps the specific message for other codes', () => {
		expect(reportErrorKey({ code: 'AlreadyReported' })).toBe(
			'marketplace.errors.alreadyReported'
		)
		expect(reportErrorKey(new Error('x'))).toBe('marketplace.errors.generic')
	})
})

describe('relativeAge', () => {
	const now = new Date('2026-11-13T12:00:00Z')
	it('uses the largest fitting unit in the app language', () => {
		expect(relativeAge('2026-11-11T12:00:00Z', now, 'en')).toBe('2 days ago')
		expect(relativeAge('2026-11-13T09:00:00Z', now, 'en')).toBe('3 hours ago')
		expect(relativeAge('2026-11-11T12:00:00Z', now, 'de')).toBe('vorgestern')
		expect(relativeAge('2026-11-13T11:59:30Z', now, 'en')).toBe('this minute')
	})

	it('falls back to a short date where Intl.RelativeTimeFormat is missing (Hermes on iOS)', () => {
		const original = Intl.RelativeTimeFormat
		const setFormat = (value: unknown) =>
			Object.defineProperty(Intl, 'RelativeTimeFormat', {
				value,
				configurable: true,
				writable: true
			})
		setFormat(undefined)
		try {
			expect(relativeAge('2026-11-11T12:00:00Z', now, 'en')).toBe(
				new Date('2026-11-11T12:00:00Z').toLocaleDateString('en', {
					day: 'numeric',
					month: 'short'
				})
			)
		} finally {
			setFormat(original)
		}
	})
})

describe('cardChips', () => {
	const base = {
		type: 'offer',
		priceEur: null,
		priceFree: false
	}
	it('shows job type, work mode, language and wage for a job offer', () => {
		expect(
			cardChips({
				...base,
				category: 'jobs',
				priceEur: 14,
				details: {
					jobType: 'minijob',
					workMode: 'hybrid',
					languages: ['german', 'english'],
					employer: 'X'
				}
			})
		).toEqual([
			{ field: 'jobType', value: 'minijob' },
			{ field: 'workMode', value: 'hybrid' },
			{ field: 'languages', value: 'german' },
			{ field: 'price', value: '' }
		])
	})
	it('shows housing type, size and furnished', () => {
		expect(
			cardChips({
				...base,
				category: 'housing',
				details: { housingType: 'studio', sizeSqm: 24, furnished: 'yes' }
			})
		).toEqual([
			{ field: 'housingType', value: 'studio' },
			{ field: 'sizeSqm', value: '24' },
			{ field: 'furnished', value: 'yes' }
		])
	})
	it('skips empty details and never exceeds four', () => {
		expect(
			cardChips({
				...base,
				category: 'jobs',
				details: { jobType: 'minijob', workMode: null, languages: [] }
			})
		).toEqual([{ field: 'jobType', value: 'minijob' }])
		expect(
			cardChips({ ...base, category: 'zzz', details: { a: 'b' } })
		).toEqual([])
	})
})
