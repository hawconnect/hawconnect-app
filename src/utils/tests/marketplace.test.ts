import { describe, expect, it } from 'bun:test'
import type { TFunction } from 'i18next'
import deMarketplace from '../../localization/de/marketplace.json'
import enMarketplace from '../../localization/en/marketplace.json'
import {
	formatPrice,
	groupByStatus,
	marketErrorKey,
	marketplaceGateView,
	postsVariables,
	typeFilterKeys
} from '../marketplace'

// Tiny resolver over the real JSON (other suites mock i18next globally).
const make = async (lng: 'en' | 'de') => {
	const res = (lng === 'de' ? deMarketplace : enMarketplace) as Record<
		string,
		unknown
	>
	return ((key: string, opts?: Record<string, string>) => {
		const text = key
			.split('.')
			.reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], res)
		return String(text).replace(/{{(\w+)}}/g, (_, n) => opts?.[n] ?? '')
	}) as unknown as TFunction
}

describe('formatPrice', () => {
	it('free in both languages', async () => {
		const post = { priceFree: true, priceEur: null, priceUnit: null }
		expect(formatPrice(post, await make('en'))).toBe('Free')
		expect(formatPrice(post, await make('de'))).toBe('Kostenlos')
	})
	it('per month', async () => {
		expect(
			formatPrice(
				{ priceFree: false, priceEur: 520, priceUnit: 'perMonth' },
				await make('en')
			)
		).toBe('520 € / month')
	})
	it('once, per hour and decimals', async () => {
		const t = await make('en')
		expect(
			formatPrice({ priceFree: false, priceEur: 12.5, priceUnit: null }, t)
		).toBe('12.50 €')
		expect(
			formatPrice({ priceFree: false, priceEur: 8, priceUnit: 'perHour' }, t)
		).toBe('8 € / hour')
		expect(
			formatPrice(
				{ priceFree: false, priceEur: 12.5, priceUnit: 'once' },
				await make('de'),
				'de'
			)
		).toBe('12,50 €')
	})
	it('null without price', async () => {
		expect(
			formatPrice(
				{ priceFree: false, priceEur: null, priceUnit: null },
				await make('en')
			)
		).toBeNull()
	})
})

describe('marketErrorKey', () => {
	it('maps known codes', () => {
		expect(marketErrorKey('ActivePostLimit')).toBe(
			'marketplace.errors.activePostLimit'
		)
		expect(marketErrorKey('MarketplaceUnavailable')).toBe(
			'marketplace.errors.marketplaceUnavailable'
		)
		expect(marketErrorKey('PhotoTooLarge')).toBe(
			'marketplace.errors.photoTooLarge'
		)
	})
	it('maps invalid fields', () => {
		expect(marketErrorKey('InvalidMarketPost:title')).toBe(
			'marketplace.errors.invalidField'
		)
	})
	it('falls back to generic', () => {
		for (const c of ['Nope', 'AccountSyncUnavailable', '', 'constructor'])
			expect(marketErrorKey(c)).toBe('marketplace.errors.generic')
	})
})

describe('marketplaceGateView', () => {
	it('waits while the account is still loading instead of asking to sign in', () => {
		expect(marketplaceGateView('loading', false)).toBe('loading')
	})
	it('shows content only for an authenticated account with a user', () => {
		expect(marketplaceGateView('authenticated', true)).toBe('content')
		expect(marketplaceGateView('authenticated', false)).toBe('signIn')
		expect(marketplaceGateView('guest', false)).toBe('signIn')
		expect(marketplaceGateView('locked', false)).toBe('signIn')
	})
})

describe('typeFilterKeys', () => {
	const lookup = (res: unknown, key: string) =>
		key
			.split('.')
			.reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], res)
	const expected: Record<string, [string, string]> = {
		jobs: ['Job offers', 'Job seekers'],
		housing: ['Offers', 'Looking for']
	}
	it('follows the chosen category in English', () => {
		for (const [category, [offer, request]] of Object.entries(expected)) {
			const keys = typeFilterKeys(category)
			expect(lookup(enMarketplace, keys.offer)).toBe(offer)
			expect(lookup(enMarketplace, keys.request)).toBe(request)
		}
	})
	it('has German labels for every category', () => {
		const de: Record<string, [string, string]> = {
			jobs: ['Jobangebote', 'Jobsuchende'],
			housing: ['Angebote', 'Gesuche']
		}
		for (const [category, [offer, request]] of Object.entries(de)) {
			const keys = typeFilterKeys(category)
			expect(lookup(deMarketplace, keys.offer)).toBe(offer)
			expect(lookup(deMarketplace, keys.request)).toBe(request)
		}
	})
	it('keeps Offers / Requests for all categories or unknown ones', () => {
		for (const c of [null, undefined, 'other', 'buySell']) {
			const keys = typeFilterKeys(c)
			expect(lookup(enMarketplace, keys.offer)).toBe('Offers')
			expect(lookup(enMarketplace, keys.request)).toBe('Requests')
		}
	})
})

describe('postsVariables', () => {
	it('sends only type and category, never campus', () => {
		const vars = postsVariables(
			{ type: 'offer', category: 'jobs', campus: 'x' } as never,
			'c1'
		)
		expect(vars).toEqual({
			filter: { type: 'offer', category: 'jobs' },
			cursor: 'c1'
		})
		expect(Object.keys(vars.filter ?? {})).not.toContain('campus')
	})
	it('sends a null filter when nothing is chosen', () => {
		expect(postsVariables({}, null)).toEqual({ filter: null, cursor: null })
		expect(postsVariables(undefined)).toEqual({ filter: null, cursor: null })
	})
})

describe('groupByStatus', () => {
	it('orders Active, Reserved, Closed, Expired, Hidden and drops empty groups', () => {
		const posts = [
			{ id: '1', status: 'expired' },
			{ id: '2', status: 'active' },
			{ id: '3', status: 'hiddenByBlock' },
			{ id: '4', status: 'closed' },
			{ id: '5', status: 'active' },
			{ id: '6', status: 'removedByModerator' }
		]
		const groups = groupByStatus(posts)
		expect(groups.map((g) => g.group)).toEqual([
			'active',
			'closed',
			'expired',
			'hidden'
		])
		expect(groups[0].data.map((p) => p.id)).toEqual(['2', '5'])
		expect(groups[3].data.map((p) => p.id)).toEqual(['3', '6'])
	})
	it('ignores deleted listings', () => {
		expect(groupByStatus([{ id: '1', status: 'removedByOwner' }])).toEqual([])
	})
})
