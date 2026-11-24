import { describe, expect, it } from 'bun:test'
import type { MarketPost } from '@/api/marketplace-api'
import { type FieldSpec, fieldsFor } from '../marketplace-fields'
import {
	canEdit,
	canRenew,
	draftFromPost,
	draftToInput,
	emptyDraft,
	expiryKind,
	invalidDraftField,
	isLapsed,
	isRequiredNow,
	marketErrorMessageKey,
	messageLengthValid,
	normalizeDraft,
	PHOTO_MAX_BYTES,
	photoIdsFor,
	photoTooLarge,
	pickedMime,
	serverInvalidField,
	statusActions,
	uploadErrorKey
} from '../marketplace-form'

const valid = () => ({
	...emptyDraft(),
	title: 'Room in Barmbek',
	description: 'Sunny room, 14 m², close to Berliner Tor.',
	price: '450',
	location: 'Barmbek',
	availableFrom: '2026-12-01',
	details: { housingType: 'privateRoom', rentalDuration: 'long' }
})

const job = () => ({
	...emptyDraft(),
	type: 'offer',
	category: 'jobs',
	title: 'Working student',
	description: 'Help us build the thing, ten hours a week.',
	location: 'Hamburg',
	details: {
		employer: 'Acme',
		jobType: 'workingStudent',
		workMode: 'hybrid',
		languages: ['english'],
		applyMethod: 'email',
		applyEmail: 'jobs@acme.test'
	} as Record<string, string | string[]>
})

const post = (over: Partial<MarketPost> = {}): MarketPost => ({
	id: '1',
	type: 'offer',
	category: 'housing',
	title: 'Room',
	description: 'A nice room for rent.',
	priceEur: 450,
	priceFree: false,
	priceUnit: 'perMonth',
	location: 'Barmbek',
	availableFrom: '2026-12-01',
	details: {},
	status: 'active',
	createdAt: '',
	expiresAt: '',
	isOwn: true,
	photoUrls: [],
	...over
})

describe('invalidDraftField', () => {
	it('accepts a valid draft', () => {
		expect(invalidDraftField(valid())).toBeNull()
	})
	it('checks title and description lengths', () => {
		expect(invalidDraftField({ ...valid(), title: 'ab' })).toBe('title')
		expect(invalidDraftField({ ...valid(), title: 'x'.repeat(81) })).toBe(
			'title'
		)
		expect(invalidDraftField({ ...valid(), description: 'short' })).toBe(
			'description'
		)
	})
	it('allows whole euros up to 100,000 only', () => {
		expect(invalidDraftField({ ...valid(), price: '100000' })).toBeNull()
		expect(invalidDraftField({ ...valid(), price: '100001' })).toBe('price')
		expect(invalidDraftField({ ...valid(), price: '12.5' })).toBe('price')
		expect(invalidDraftField({ ...valid(), price: '-1' })).toBe('price')
	})
	it('invalidDraftField rejects companyWebsite without https', () => {
		const withDetail = (key: string, value: string) => ({
			...job(),
			details: { ...job().details, [key]: value }
		})
		expect(
			invalidDraftField(withDetail('companyWebsite', 'http://company.de'))
		).toBe('details.companyWebsite')
		expect(
			invalidDraftField(withDetail('companyWebsite', 'https://company.de'))
		).toBeNull()
		expect(invalidDraftField(withDetail('contactEmail', 'nope'))).toBe(
			'details.contactEmail'
		)
		expect(invalidDraftField(withDetail('contactName', 'x'.repeat(81)))).toBe(
			'details.contactName'
		)
	})
	it('reports a missing required detail', () => {
		expect(
			invalidDraftField({ ...valid(), details: { housingType: 'studio' } })
		).toBe('details.rentalDuration')
		expect(invalidDraftField({ ...job(), details: {} })).toBe(
			'details.employer'
		)
		expect(
			invalidDraftField({
				...job(),
				details: { ...job().details, languages: [] }
			})
		).toBe('details.languages')
	})
	it('requires a price for housing', () => {
		expect(invalidDraftField({ ...valid(), price: '' })).toBe('price')
		expect(invalidDraftField({ ...job(), price: '' })).toBeNull()
	})
	it('does not allow free where the category forbids it', () => {
		expect(invalidDraftField({ ...valid(), priceFree: true })).toBe('price')
		expect(invalidDraftField({ ...job(), priceFree: true })).toBe('price')
	})
	it('requires location for jobs and housing, and a date for housing', () => {
		expect(invalidDraftField({ ...valid(), location: ' ' })).toBe('location')
		expect(invalidDraftField({ ...job(), location: '' })).toBe('location')
		expect(invalidDraftField({ ...valid(), availableFrom: null })).toBe(
			'availableFrom'
		)
	})
	it('a malformed available-from date is invalid', () => {
		expect(invalidDraftField({ ...valid(), availableFrom: '2026-13-01' })).toBe(
			'availableFrom'
		)
		expect(invalidDraftField({ ...valid(), availableFrom: 'soon' })).toBe(
			'availableFrom'
		)
		expect(invalidDraftField({ ...job(), availableFrom: '2026-02-30' })).toBe(
			'availableFrom'
		)
		expect(
			invalidDraftField({ ...job(), availableFrom: '2026-12-01' })
		).toBeNull()
	})
	it('numbers outside range or not whole are invalid', () => {
		const withDetails = (extra: Record<string, string>) => ({
			...valid(),
			details: { ...valid().details, ...extra }
		})
		expect(invalidDraftField(withDetails({ rooms: '21' }))).toBe(
			'details.rooms'
		)
		expect(invalidDraftField(withDetails({ rooms: '0' }))).toBe('details.rooms')
		expect(invalidDraftField(withDetails({ rooms: '2.5' }))).toBe(
			'details.rooms'
		)
		expect(invalidDraftField(withDetails({ sizeSqm: '1001' }))).toBe(
			'details.sizeSqm'
		)
		expect(invalidDraftField(withDetails({ deposit: '0' }))).toBeNull()
		expect(invalidDraftField(withDetails({ rooms: '20' }))).toBeNull()
	})
	it('checks apply method, url and email', () => {
		const apply = (d: Record<string, string>) => ({
			...job(),
			details: { ...job().details, ...d }
		})
		expect(invalidDraftField(job())).toBeNull()
		expect(invalidDraftField(apply({ applyEmail: '' }))).toBe(
			'details.applyEmail'
		)
		expect(invalidDraftField(apply({ applyEmail: 'nope' }))).toBe(
			'details.applyEmail'
		)
		expect(
			invalidDraftField(
				apply({ applyMethod: 'url', applyEmail: '', applyUrl: 'http://a.test' })
			)
		).toBe('details.applyUrl')
		expect(
			invalidDraftField(
				apply({
					applyMethod: 'url',
					applyEmail: '',
					applyUrl: 'https://u:p@a.test'
				})
			)
		).toBe('details.applyUrl')
		expect(
			invalidDraftField(
				apply({
					applyMethod: 'url',
					applyEmail: '',
					applyUrl: 'https://a.test/jobs'
				})
			)
		).toBeNull()
	})
	it('rejects urls the Hermes URL polyfill would accept', () => {
		const url = (applyUrl: string) => ({
			...job(),
			details: { ...job().details, applyMethod: 'url', applyUrl }
		})
		for (const bad of [
			'https://my site.de',
			'https://',
			'https://x.de/a b',
			'https:///x'
		])
			expect(invalidDraftField(url(bad))).toBe('details.applyUrl')
		expect(invalidDraftField(url('https://x.de/jobs?a=1'))).toBeNull()
	})
	it('checks text limits and select options', () => {
		const d = (extra: Record<string, string>) => ({
			...job(),
			details: { ...job().details, ...extra }
		})
		expect(invalidDraftField(d({ employer: 'x'.repeat(81) }))).toBe(
			'details.employer'
		)
		expect(invalidDraftField(d({ requirements: 'x'.repeat(1001) }))).toBe(
			'details.requirements'
		)
		expect(invalidDraftField(d({ jobType: 'bogus' }))).toBe('details.jobType')
		expect(invalidDraftField(d({ applyDeadline: '2026-13-40' }))).toBe(
			'details.applyDeadline'
		)
	})
	it('ignores details of other categories', () => {
		expect(
			invalidDraftField({
				...valid(),
				details: { ...valid().details, employer: 'x'.repeat(500) }
			})
		).toBeNull()
	})
	it('limits location to 60 characters', () => {
		expect(invalidDraftField({ ...valid(), location: 'x'.repeat(61) })).toBe(
			'location'
		)
	})
})

describe('draftToInput', () => {
	it('drops fields of other categories', () => {
		const input = draftToInput({
			...valid(),
			category: 'jobs',
			details: { housingType: 'studio', employer: 'x' }
		})
		expect(input.details).toEqual({ employer: 'x' })
	})
	it('sends applyEmail only when applyMethod is email', () => {
		expect(
			draftToInput({
				...job(),
				details: { ...job().details, applyUrl: 'https://a.test' }
			}).details
		).toEqual({
			employer: 'Acme',
			jobType: 'workingStudent',
			workMode: 'hybrid',
			languages: ['english'],
			applyMethod: 'email',
			applyEmail: 'jobs@acme.test'
		})
		const url = draftToInput({
			...job(),
			details: {
				...job().details,
				applyMethod: 'url',
				applyUrl: 'https://a.test'
			}
		}).details
		expect(url.applyUrl).toBe('https://a.test')
		expect('applyEmail' in url).toBe(false)
	})
	it('converts numbers to integers and drops empty values', () => {
		const input = draftToInput({
			...valid(),
			details: {
				housingType: 'studio',
				rentalDuration: 'long',
				rooms: '2',
				deposit: '0',
				sizeSqm: '',
				facilities: [],
				furnished: ''
			}
		})
		expect(input.details).toEqual({
			housingType: 'studio',
			rentalDuration: 'long',
			rooms: 2,
			deposit: 0
		})
	})
	it('has no campus field', () => {
		expect('campus' in draftToInput(valid())).toBe(false)
	})
	it('fills the single price unit', () => {
		expect(draftToInput({ ...valid(), priceUnit: null }).priceUnit).toBe(
			'perMonth'
		)
		expect(
			draftToInput({ ...job(), price: '15', priceUnit: null }).priceUnit
		).toBe('perHour')
		expect(
			draftToInput({ ...job(), price: '15', priceUnit: 'perMonth' }).priceUnit
		).toBe('perMonth')
	})
	it('drops price and unit when free', () => {
		const input = draftToInput({
			...valid(),
			price: '300',
			priceFree: true,
			priceUnit: 'perMonth'
		})
		expect(input.priceEur).toBeNull()
		expect(input.priceUnit).toBeNull()
	})
	it('uses the unit the category allows', () => {
		expect(
			draftToInput({ ...valid(), price: '300', priceUnit: 'perMonth' })
				.priceUnit
		).toBe('perMonth')
		expect(
			draftToInput({
				...valid(),
				category: 'jobs',
				price: '30',
				priceUnit: 'once'
			}).priceUnit
		).toBe('perHour')
	})
	it('draftToInput keeps perMonth for jobs', () => {
		const input = draftToInput({
			...job(),
			price: '2400',
			priceUnit: 'perMonth'
		})
		expect(input.priceEur).toBe(2400)
		expect(input.priceUnit).toBe('perMonth')
	})
	it('sends the contact fields trimmed and omits empty ones', () => {
		const input = draftToInput({
			...job(),
			details: {
				...job().details,
				contactName: ' Anna Schmidt ',
				contactRole: ''
			}
		})
		expect(input.details.contactName).toBe('Anna Schmidt')
		expect(input.details).not.toHaveProperty('contactRole')
	})
	it('trims text and nulls empty location', () => {
		const input = draftToInput({ ...valid(), title: '  Room  ', location: ' ' })
		expect(input.title).toBe('Room')
		expect(input.location).toBeNull()
	})
})

describe('draftFromPost', () => {
	it('draftFromPost keeps perHour and empty contact fields for an old job', () => {
		const draft = draftFromPost(
			post({
				category: 'jobs',
				priceEur: 15,
				priceUnit: 'perHour',
				details: { employer: 'Acme', contactName: null, companyWebsite: null }
			})
		)
		expect(draft.priceUnit).toBe('perHour')
		expect(draft.details).toEqual({ employer: 'Acme' })
		expect(draftToInput(draft).priceUnit).toBe('perHour')
	})
	it('fills empty details for an old listing', () => {
		const draft = draftFromPost(post({ details: {} }))
		expect(draft.details).toEqual({})
		expect(draft.price).toBe('450')
	})
	it('copes with missing details and drops null values', () => {
		expect(
			draftFromPost(post({ details: undefined as never })).details
		).toEqual({})
		expect(
			draftFromPost(post({ details: { housingType: 'studio', rooms: null } }))
				.details
		).toEqual({ housingType: 'studio' })
	})
	it('maps numbers to strings and keeps lists', () => {
		const draft = draftFromPost(
			post({
				details: { rooms: 2, deposit: 0, facilities: ['kitchen'] }
			})
		)
		expect(draft.details).toEqual({
			rooms: '2',
			deposit: '0',
			facilities: ['kitchen']
		})
	})
})

describe('canRenew', () => {
	const now = Date.parse('2026-11-13T12:00:00Z')
	it('active posts can always be renewed', () => {
		expect(canRenew({ status: 'active', expiresAt: '' }, now)).toBe(true)
	})
	it('expired posts within 30 days', () => {
		expect(
			canRenew({ status: 'expired', expiresAt: '2026-10-20T12:00:00Z' }, now)
		).toBe(true)
		expect(
			canRenew({ status: 'expired', expiresAt: '2026-10-10T12:00:00Z' }, now)
		).toBe(false)
	})
	it('removed or hidden posts cannot be renewed', () => {
		for (const status of [
			'removedByOwner',
			'removedByModerator',
			'hiddenPendingReview'
		])
			expect(canRenew({ status, expiresAt: '2026-11-20T12:00:00Z' }, now)).toBe(
				false
			)
	})
})

describe('messageLengthValid', () => {
	it('uses 10 to 1,000 characters', () => {
		expect(messageLengthValid('x'.repeat(9))).toBe(false)
		expect(messageLengthValid('x'.repeat(10))).toBe(true)
		expect(messageLengthValid('x'.repeat(1000))).toBe(true)
		expect(messageLengthValid('x'.repeat(1001))).toBe(false)
	})
})

describe('error keys', () => {
	it('maps upload status before the code', () => {
		expect(uploadErrorKey({ code: 'AccountUnavailable', status: 413 })).toBe(
			'marketplace.errors.photoTooLarge'
		)
		expect(uploadErrorKey({ code: 'AccountUnavailable', status: 415 })).toBe(
			'marketplace.errors.invalidPhoto'
		)
		expect(uploadErrorKey({ code: 'PhotoLimit', status: 409 })).toBe(
			'marketplace.errors.photoLimit'
		)
	})
	it('treats a TypeError and unknown errors as generic', () => {
		expect(uploadErrorKey(new TypeError('Network request failed'))).toBe(
			'marketplace.errors.generic'
		)
		expect(marketErrorMessageKey(new Error('x'))).toBe(
			'marketplace.errors.generic'
		)
		expect(marketErrorMessageKey({ code: 'ContactLimit', status: 200 })).toBe(
			'marketplace.errors.contactLimit'
		)
	})
})

describe('pickedMime', () => {
	it('prefers the reported type, else the extension', () => {
		expect(pickedMime('image/webp', 'a.jpg')).toBe('image/webp')
		expect(pickedMime(null, 'file:///x/IMG.PNG')).toBe('image/png')
		expect(pickedMime(undefined, 'blob:abc')).toBe('image/jpeg')
	})
})

describe('photoTooLarge', () => {
	it('blocks known sizes over 5 MB only', () => {
		expect(photoTooLarge(PHOTO_MAX_BYTES + 1)).toBe(true)
		expect(photoTooLarge(8 * 1024 * 1024)).toBe(true)
		expect(photoTooLarge(PHOTO_MAX_BYTES)).toBe(false)
		expect(photoTooLarge(2 * 1024 * 1024)).toBe(false)
	})
	it('lets unknown sizes through to the server', () => {
		expect(photoTooLarge(undefined)).toBe(false)
		expect(photoTooLarge(null)).toBe(false)
	})
})

describe('normalizeDraft', () => {
	it('keeps hidden details so switching back shows them again', () => {
		const request = {
			...emptyDraft(),
			category: 'jobs',
			type: 'request',
			details: { workMode: 'flexible', jobType: 'minijob', skills: 'TS' }
		}
		const offer = normalizeDraft({ ...request, type: 'offer' })
		expect(offer.details).toEqual(request.details)
		const housing = normalizeDraft({ ...offer, category: 'housing' })
		expect(housing.details).toEqual(request.details)
		expect(
			normalizeDraft({ ...housing, category: 'jobs', type: 'request' }).details
		).toEqual(request.details)
	})
	it('never sends hidden details and treats a select the type does not offer as absent', () => {
		const offer = {
			...job(),
			details: { ...job().details, workMode: 'flexible', skills: 'TS' }
		}
		expect(draftToInput(offer).details).not.toHaveProperty('workMode')
		expect(draftToInput(offer).details).not.toHaveProperty('skills')
		// workMode is required on an offer: the kept value does not count.
		expect(invalidDraftField(offer)).toBe('details.workMode')
		const housing = {
			...valid(),
			details: { ...valid().details, ...offer.details }
		}
		expect(invalidDraftField(housing)).toBeNull()
		expect(draftToInput(housing).details).toEqual({
			housingType: 'privateRoom',
			rentalDuration: 'long'
		})
	})
	it('clears free and the unit where the category does not allow them', () => {
		const draft = {
			...emptyDraft(),
			category: 'housing',
			priceFree: true,
			priceUnit: 'once'
		}
		const out = normalizeDraft(draft)
		expect(out.priceFree).toBe(false)
		expect(out.priceUnit).toBeNull()
	})
})

describe('photoIdsFor', () => {
	it('sends an empty list when photos are not allowed, on create and edit', () => {
		expect(photoIdsFor(false, true, ['a'])).toEqual([])
		expect(photoIdsFor(false, false, [])).toEqual([])
	})
	it('keeps current photos on edit until replaced', () => {
		expect(photoIdsFor(true, false, [])).toBeNull()
		expect(photoIdsFor(true, true, ['a', 'b'])).toEqual(['a', 'b'])
	})
})

describe('isRequiredNow', () => {
	const apply = (applyMethod?: string) => ({
		details: (applyMethod ? { applyMethod } : {}) as Record<string, string>
	})
	const spec = (key: string) =>
		fieldsFor('jobs', 'offer').find((f) => f.key === key) as FieldSpec
	it('the chosen apply route is required, the other is not', () => {
		expect(isRequiredNow(apply('url'), spec('applyUrl'))).toBe(true)
		expect(isRequiredNow(apply('url'), spec('applyEmail'))).toBe(false)
		expect(isRequiredNow(apply('email'), spec('applyEmail'))).toBe(true)
		expect(isRequiredNow(apply('email'), spec('applyUrl'))).toBe(false)
		expect(isRequiredNow(apply(), spec('applyUrl'))).toBe(false)
	})
	it('registry-required fields stay required', () => {
		expect(isRequiredNow(apply(), spec('employer'))).toBe(true)
		expect(isRequiredNow(apply(), spec('weeklyHours'))).toBe(false)
	})
})

describe('statusActions', () => {
	const now = Date.parse('2026-11-13T12:00:00Z')
	const future = '2026-12-01T12:00:00Z'
	const past = '2026-11-01T12:00:00Z'
	const post = (category: string, status: string, expiresAt = future) => ({
		category,
		status,
		expiresAt
	})
	it('statusActions offers reserve and close for an active housing listing', () => {
		expect(statusActions(post('housing', 'active'), now)).toEqual([
			'reserve',
			'close'
		])
	})
	it('statusActions offers only close for an active job', () => {
		expect(statusActions(post('jobs', 'active'), now)).toEqual(['close'])
	})
	it('statusActions offers activate and close for a reserved listing', () => {
		expect(statusActions(post('housing', 'reserved'), now)).toEqual([
			'activate',
			'close'
		])
	})
	it('statusActions offers reopen for a closed unexpired listing', () => {
		expect(statusActions(post('housing', 'closed'), now)).toEqual(['reopen'])
		expect(statusActions(post('housing', 'closed', past), now)).toEqual([])
	})
	it('statusActions offers nothing for an expired or hidden listing', () => {
		for (const status of [
			'expired',
			'hiddenPendingReview',
			'hiddenByBlock',
			'removedByModerator',
			'removedByOwner'
		])
			expect(statusActions(post('housing', status), now)).toEqual([])
	})
	it('statusActions offers nothing for an active or reserved listing past its expiry', () => {
		expect(statusActions(post('housing', 'active', past), now)).toEqual([])
		expect(statusActions(post('housing', 'reserved', past), now)).toEqual([])
	})
})

describe('canEdit', () => {
	it('canEdit is true while active or reserved', () => {
		expect(canEdit({ status: 'active' })).toBe(true)
		expect(canEdit({ status: 'reserved' })).toBe(true)
		for (const status of ['closed', 'expired', 'hiddenByBlock'])
			expect(canEdit({ status })).toBe(false)
	})
})

describe('canRenew with reserved and closed', () => {
	const now = Date.parse('2026-11-13T12:00:00Z')
	it('reserved can be renewed, closed never', () => {
		expect(canRenew({ status: 'reserved', expiresAt: '' }, now)).toBe(true)
		expect(
			canRenew({ status: 'closed', expiresAt: '2026-12-20T12:00:00Z' }, now)
		).toBe(false)
	})
})

describe('serverInvalidField', () => {
	it('reads the field of an InvalidMarketPost code', () => {
		expect(serverInvalidField({ code: 'InvalidMarketPost:title' })).toBe(
			'title'
		)
		expect(
			serverInvalidField({ code: 'InvalidMarketPost:details.applyUrl' })
		).toBe('details.applyUrl')
		expect(serverInvalidField({ code: 'ContactLimit' })).toBeNull()
		expect(serverInvalidField(new Error('x'))).toBeNull()
	})
})

describe('expiryKind and isLapsed', () => {
	const now = Date.parse('2026-12-01T00:00:00Z')
	const post = (status: string, expiresAt: string) => ({ status, expiresAt })
	const future = '2026-12-20T00:00:00Z'
	const past = '2026-11-20T00:00:00Z'
	it('shows an expiry date for active, reserved and closed listings', () => {
		expect(expiryKind(post('active', future), now)).toBe('expires')
		expect(expiryKind(post('reserved', future), now)).toBe('expires')
		expect(expiryKind(post('closed', future), now)).toBe('expires')
		expect(expiryKind(post('reserved', past), now)).toBe('expired')
		expect(expiryKind(post('closed', past), now)).toBe('expired')
		expect(expiryKind(post('expired', past), now)).toBe('expired')
		expect(expiryKind(post('removedByOwner', future), now)).toBeNull()
	})
	it('flags a closed listing past its expiry', () => {
		expect(isLapsed(post('closed', past), now)).toBe(true)
		expect(isLapsed(post('closed', future), now)).toBe(false)
		expect(isLapsed(post('reserved', past), now)).toBe(false)
	})
})
