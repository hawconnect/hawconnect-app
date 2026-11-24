import type { MarketPost, MarketPostInput } from '@/api/marketplace-api'
import { marketErrorKey } from '@/utils/marketplace'
import { isHttpsUrl } from '@/utils/marketplace-apply'
import {
	canReserve,
	type FieldSpec,
	fieldsFor,
	MARKET,
	priceRuleFor,
	requiresAvailableFrom,
	requiresLocation
} from '@/utils/marketplace-fields'

export const TITLE_MIN = 3
export const TITLE_MAX = 80
export const DESCRIPTION_MIN = 10
export const DESCRIPTION_MAX = 2000
export const PRICE_MAX = 100000
export const LOCATION_MAX = 60
export const MESSAGE_MIN = 10
export const MESSAGE_MAX = 1000
export const REPORT_NOTE_MAX = 500
export const PHOTO_MAX = 3
/** The upload route rejects files over 5 MB (it resizes only after upload). */
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024
const DAY = 86400000
/** A post can be renewed while active or up to 30 days after expiry. */
const RENEW_GRACE = 30 * DAY

export interface MarketDraft {
	type: string
	category: string
	title: string
	description: string
	/** Whole euros as typed; empty means "no price". */
	price: string
	priceFree: boolean
	priceUnit: string | null
	location: string
	/** 'YYYY-MM-DD' or null */
	availableFrom: string | null
	/** Category-specific values; numbers are held as typed strings. */
	details: Record<string, string | string[]>
}

export const emptyDraft = (): MarketDraft => ({
	type: 'offer',
	category: 'housing',
	title: '',
	description: '',
	price: '',
	priceFree: false,
	priceUnit: null,
	location: '',
	availableFrom: null,
	details: {}
})

/** Post details as draft values: numbers become strings, unset values vanish. */
const detailsFromPost = (details: MarketPost['details'] | null | undefined) => {
	const out: Record<string, string | string[]> = {}
	for (const [key, value] of Object.entries(details ?? {})) {
		if (value == null) continue
		out[key] = Array.isArray(value) ? value : String(value)
	}
	return out
}

export const draftFromPost = (post: MarketPost): MarketDraft => ({
	type: post.type,
	category: post.category,
	title: post.title,
	description: post.description,
	price: post.priceEur == null ? '' : String(post.priceEur),
	priceFree: post.priceFree,
	priceUnit: post.priceUnit,
	location: post.location ?? '',
	availableFrom: post.availableFrom,
	details: detailsFromPost(post.details)
})

/**
 * Reconciles a draft after the category or type changed: free or a unit the
 * category does not allow are cleared. Details are kept, so switching back
 * shows them again; hidden ones are neither validated nor sent.
 */
export function normalizeDraft(draft: MarketDraft): MarketDraft {
	const rule = priceRuleFor(draft.category, draft.type)
	return {
		...draft,
		priceFree: draft.priceFree && !!rule?.free,
		priceUnit:
			draft.priceUnit && rule?.units.includes(draft.priceUnit as never)
				? draft.priceUnit
				: null
	}
}

/** Photo ids to send: none when the category has no photos, else null keeps the current ones. */
export const photoIdsFor = (
	allowed: boolean,
	replacing: boolean,
	ids: string[]
): string[] | null => (!allowed ? [] : replacing ? ids : null)

/** 'title' | 'description' | 'price' | 'location' | 'availableFrom' | `details.<key>` */
export type DraftField = string

const DATE = /^\d{4}-\d{2}-\d{2}$/
const isDate = (value: string) => {
	if (!DATE.test(value)) return false
	const parsed = new Date(`${value}T00:00:00Z`)
	return (
		!Number.isNaN(parsed.getTime()) &&
		parsed.toISOString().slice(0, 10) === value
	)
}
/** Same shape as the backend's account email check. */
const isEmail = (value: string) => {
	const email = value.toLowerCase()
	const [local, domain, ...rest] = email.split('@')
	return (
		email.length <= MARKET.emailMax &&
		rest.length === 0 &&
		!!local &&
		!!domain &&
		local.length <= 64 &&
		/^[a-z0-9!#$%&'*+/=?^_`{|}~.-]+$/.test(local) &&
		!local.startsWith('.') &&
		!local.endsWith('.') &&
		!local.includes('..') &&
		/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain)
	)
}

/** Whether another type of the draft's category offers this option for the key. */
const offeredElsewhere = (
	draft: Pick<MarketDraft, 'category' | 'type'>,
	key: string,
	value: string
) =>
	['offer', 'request'].some(
		(type) =>
			type !== draft.type &&
			fieldsFor(draft.category, type).some(
				(s) => s.key === key && s.options?.includes(value)
			)
	)

/**
 * The draft's value for a field, trimmed; empty strings and lists count as
 * absent. A choice kept from the other type that this one does not offer is
 * absent too (not invalid, not sent).
 */
const detailOf = (
	draft: MarketDraft,
	spec: FieldSpec
): string | string[] | null => {
	const value = draft.details[spec.key]
	if (Array.isArray(value)) {
		const kept =
			spec.kind === 'multi'
				? value.filter(
						(o) =>
							spec.options?.includes(o) || !offeredElsewhere(draft, spec.key, o)
					)
				: value
		return kept.length ? kept : null
	}
	const text = (value ?? '').trim()
	if (text === '') return null
	if (
		spec.kind === 'select' &&
		!spec.options?.includes(text) &&
		offeredElsewhere(draft, spec.key, text)
	)
		return null
	return text
}

/** Whether a field must be filled in now: registry-required, or the chosen apply route. */
export const isRequiredNow = (
	draft: Pick<MarketDraft, 'details'>,
	spec: FieldSpec
): boolean =>
	spec.required ||
	(spec.key === 'applyUrl' && draft.details.applyMethod === 'url') ||
	(spec.key === 'applyEmail' && draft.details.applyMethod === 'email')

/** Fields of the draft's category and type; only the chosen apply route counts. */
export function activeFields(
	draft: Pick<MarketDraft, 'category' | 'type' | 'details'>
): FieldSpec[] {
	const method = draft.details.applyMethod
	return fieldsFor(draft.category, draft.type).filter(
		(spec) =>
			!(
				(spec.key === 'applyUrl' && method !== 'url') ||
				(spec.key === 'applyEmail' && method !== 'email')
			)
	)
}

function detailValid(spec: FieldSpec, value: string | string[]): boolean {
	if (spec.kind === 'multi')
		return (
			Array.isArray(value) &&
			value.every((o) => spec.options?.includes(o)) &&
			new Set(value).size === value.length
		)
	if (typeof value !== 'string') return false
	switch (spec.kind) {
		case 'number': {
			if (!/^\d+$/.test(value)) return false
			const n = Number(value)
			return n >= (spec.min ?? 0) && n <= (spec.max ?? 0)
		}
		case 'text':
			return value.length <= MARKET.shortTextMax
		case 'longText':
			return value.length <= MARKET.longTextMax
		case 'select':
			return !!spec.options?.includes(value)
		case 'date':
			return isDate(value)
		case 'url':
			return isHttpsUrl(value)
		case 'email':
			return isEmail(value)
	}
}

/** Returns the first invalid field, or null when the draft can be sent. */
export function invalidDraftField(draft: MarketDraft): DraftField | null {
	const title = draft.title.trim().length
	if (title < TITLE_MIN || title > TITLE_MAX) return 'title'
	const description = draft.description.trim().length
	if (description < DESCRIPTION_MIN || description > DESCRIPTION_MAX)
		return 'description'
	const rule = priceRuleFor(draft.category, draft.type)
	const price = draft.price.trim()
	if (draft.priceFree) {
		if (rule && !rule.free) return 'price'
	} else if (price !== '') {
		if (!/^\d+$/.test(price) || Number(price) > PRICE_MAX) return 'price'
	} else if (rule?.required) return 'price'
	const location = draft.location.trim()
	if (location.length > LOCATION_MAX) return 'location'
	if (!location && requiresLocation(draft.category)) return 'location'
	if (!draft.availableFrom && requiresAvailableFrom(draft.category))
		return 'availableFrom'
	if (draft.availableFrom && !isDate(draft.availableFrom))
		return 'availableFrom'
	for (const spec of activeFields(draft)) {
		const value = detailOf(draft, spec)
		if (value === null) {
			// The chosen apply route (activeFields kept only that one) is required.
			if (isRequiredNow(draft, spec)) return `details.${spec.key}`
		} else if (!detailValid(spec, value)) return `details.${spec.key}`
	}
	return null
}

/** The unit to send: the category's only unit, or the chosen one. */
function unitFor(draft: MarketDraft): string | null {
	const rule = priceRuleFor(draft.category, draft.type)
	if (!rule) return null
	if (draft.priceUnit && rule.units.includes(draft.priceUnit as never))
		return draft.priceUnit
	return rule.units.includes('once') ? 'once' : (rule.units[0] ?? null)
}

export function draftToInput(draft: MarketDraft): MarketPostInput {
	const price = draft.price.trim()
	const details: Record<string, string | number | string[]> = {}
	for (const spec of activeFields(draft)) {
		const value = detailOf(draft, spec)
		if (value === null) continue
		details[spec.key] = spec.kind === 'number' ? Number(value) : value
	}
	return {
		type: draft.type,
		category: draft.category,
		title: draft.title.trim(),
		description: draft.description.trim(),
		priceFree: draft.priceFree,
		priceEur: draft.priceFree || price === '' ? null : Number(price),
		priceUnit: !draft.priceFree && price !== '' ? unitFor(draft) : null,
		location: draft.location.trim() || null,
		availableFrom: draft.availableFrom,
		details
	}
}

export function canRenew(
	post: Pick<MarketPost, 'status' | 'expiresAt'>,
	now = Date.now()
): boolean {
	if (post.status === 'active' || post.status === 'reserved') return true
	if (post.status !== 'expired') return false
	const expires = Date.parse(post.expiresAt)
	return Number.isFinite(expires) && now - expires <= RENEW_GRACE
}

/** True while the owner may still edit the post (active or reserved). */
export const canEdit = (post: Pick<MarketPost, 'status'>) =>
	post.status === 'active' || post.status === 'reserved'

export type StatusAction = 'reserve' | 'activate' | 'close' | 'reopen'

/** Status buttons the owner gets; none once a listing is past its expiry. */
export function statusActions(
	post: Pick<MarketPost, 'category' | 'status' | 'expiresAt'>,
	now = Date.now()
): StatusAction[] {
	const expires = Date.parse(post.expiresAt)
	const live = Number.isFinite(expires) && expires > now
	if (!live) return []
	switch (post.status) {
		case 'active':
			return canReserve(post.category) ? ['reserve', 'close'] : ['close']
		case 'reserved':
			return ['activate', 'close']
		case 'closed':
			return ['reopen']
		default:
			return []
	}
}

export const messageLengthValid = (message: string) => {
	const length = message.trim().length
	return length >= MESSAGE_MIN && length <= MESSAGE_MAX
}

export const errorCodeOf = (error: unknown): string | null =>
	error != null &&
	typeof error === 'object' &&
	'code' in error &&
	typeof error.code === 'string'
		? error.code
		: null

const errorStatus = (error: unknown): number =>
	error != null &&
	typeof error === 'object' &&
	'status' in error &&
	typeof error.status === 'number'
		? error.status
		: 0

/** i18n key (ns marketplace) for a failed marketplace request. */
export function marketErrorMessageKey(error: unknown): string {
	const code = errorCodeOf(error)
	return code ? marketErrorKey(code) : 'marketplace.errors.generic'
}

/**
 * i18n key for a failed photo upload: HTTP 413/415 win over the error code
 * (a proxy may answer with no body), and a TypeError from reading the picked
 * URI is the generic error.
 */
export function uploadErrorKey(error: unknown): string {
	if (error instanceof TypeError) return 'marketplace.errors.generic'
	const status = errorStatus(error)
	if (status === 413) return 'marketplace.errors.photoTooLarge'
	if (status === 415) return 'marketplace.errors.invalidPhoto'
	return marketErrorMessageKey(error)
}

/** A missing post (null) or a `PostUnavailable` error both mean "gone". */
export const isPostGone = (error: unknown) =>
	errorCodeOf(error) === 'PostUnavailable'

/** MIME type for a picked image; falls back to the file extension. */
export function pickedMime(
	mimeType: string | null | undefined,
	uri: string
): string {
	if (mimeType) return mimeType
	const ext = uri.split('?')[0].split('.').pop()?.toLowerCase()
	if (ext === 'png') return 'image/png'
	if (ext === 'webp') return 'image/webp'
	return 'image/jpeg'
}

/** True only when the size is known and over the limit; unknown sizes upload. */
export const photoTooLarge = (fileSize: number | null | undefined) =>
	typeof fileSize === 'number' && fileSize > PHOTO_MAX_BYTES

/** The field an `InvalidMarketPost:<field>` server error names, else null. */
export function serverInvalidField(error: unknown): DraftField | null {
	const code = errorCodeOf(error)
	const match = code && /^InvalidMarketPost:([A-Za-z.]+)$/.exec(code)
	return match ? match[1] : null
}

export type ExpiryKind = 'expires' | 'expired'

/** Which expiry line a listing shows: a future date, or "expired" once past. */
export function expiryKind(
	post: Pick<MarketPost, 'status' | 'expiresAt'>,
	now = Date.now()
): ExpiryKind | null {
	if (post.status === 'active') return 'expires'
	if (post.status === 'expired') return 'expired'
	if (post.status !== 'reserved' && post.status !== 'closed') return null
	const expires = Date.parse(post.expiresAt)
	return Number.isFinite(expires) && expires > now ? 'expires' : 'expired'
}

/** A closed listing past its expiry cannot be reopened or renewed. */
export const isLapsed = (
	post: Pick<MarketPost, 'status' | 'expiresAt'>,
	now = Date.now()
) => post.status === 'closed' && expiryKind(post, now) === 'expired'
