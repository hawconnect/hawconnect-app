import type { TFunction } from 'i18next'
import type {
	MarketCategory,
	MarketPost,
	MarketReportReason
} from '@/api/marketplace-api'
import type { ThemeMenuOption } from '@/components/Settings/theme-menu.types'
import {
	formatPrice,
	type MarketPricing,
	type StatusGroup,
	typeFilterKeys
} from '@/utils/marketplace'
import { fieldsFor, MARKET } from '@/utils/marketplace-fields'
import type { StatusAction } from '@/utils/marketplace-form'

export const CATEGORIES: MarketCategory[] = ['housing', 'jobs']
export const REASONS: MarketReportReason[] = [
	'scam',
	'illegal',
	'offensive',
	'discrimination',
	'spam',
	'other'
]
export const STATUSES = [
	'active',
	'reserved',
	'closed',
	'expired',
	'removedByOwner',
	'removedByModerator',
	'hiddenPendingReview',
	'hiddenByBlock'
] as const

type MarketT = TFunction<'marketplace'>
/** t for keys built at runtime from registry values. */
const raw = (t: MarketT) => t as unknown as TFunction

const known = <T extends string>(list: readonly T[], value: string | null) =>
	value != null && (list as readonly string[]).includes(value)
		? (value as T)
		: null

export const categoryLabel = (t: MarketT, category: string) => {
	const value = known(CATEGORIES, category)
	return value ? t(`marketplace.category.${value}`) : category
}
export const typeLabel = (t: MarketT, type: string) =>
	type === 'request'
		? t('marketplace.type.request')
		: t('marketplace.type.offer')
/** Closed reads "Rented" or "Position filled" for offers that have one. */
export const statusLabel = (
	t: MarketT,
	category: string,
	type: string,
	status: string
) => {
	if (status === 'closed' && type === 'offer') {
		const special = (
			{
				housing: 'closedHousingOffer',
				jobs: 'closedJobsOffer'
			} as Record<string, string>
		)[category]
		if (special) return raw(t)(`marketplace.status.${special}`)
	}
	const value = known(STATUSES, status)
	return value ? t(`marketplace.status.${value}`) : status
}
/** Close reads "Mark as rented/filled" for offers that have such a state. */
export const statusActionLabel = (
	t: MarketT,
	post: { category: string; type: string },
	action: StatusAction
) => {
	if (action === 'close' && post.type === 'offer') {
		const special = (
			{
				housing: 'closeHousing',
				jobs: 'closeJobs'
			} as Record<string, string>
		)[post.category]
		if (special) return raw(t)(`marketplace.detail.status.${special}`)
	}
	return raw(t)(`marketplace.detail.status.${action}`)
}
export const groupLabel = (t: MarketT, group: StatusGroup) =>
	raw(t)(`marketplace.mine.groups.${group}`)
/** Offer / request segment labels of the type filter. */
export const typeFilterLabels = (t: MarketT, category?: string | null) => {
	const keys = typeFilterKeys(category)
	return { offer: raw(t)(keys.offer), request: raw(t)(keys.request) }
}
/** Anonymity: never a name; only the owner sees "Your post", everyone else nothing. */
export const posterLabel = (t: MarketT, post: Pick<MarketPost, 'isOwn'>) =>
	post.isOwn ? t('marketplace.poster.own') : null

/** formatPrice with the marketplace-scoped t; always pass the app language. */
export const priceText = (post: MarketPricing, t: MarketT, language: string) =>
	formatPrice(post, t as unknown as TFunction, language)

/** Translates a key from `marketErrorKey`/`uploadErrorKey` (runtime string). */
export const errorText = (t: MarketT, key: string) =>
	t(key as 'marketplace.errors.generic')

export const fieldLabel = (t: MarketT, key: string) =>
	raw(t)(`marketplace.form.field.${key}`)
export const fieldPlaceholder = (t: MarketT, key: string) =>
	raw(t)(`marketplace.form.placeholder.${key}`)
/** An unknown option (e.g. from an older listing) shows its value, never a raw translation key. */
export const optionLabel = (t: MarketT, key: string, option: string) =>
	raw(t)(`marketplace.form.option.${key}.${option}`, { defaultValue: option })
/** Title and one-line subtitle of the "What would you like to do?" choice. */
export const typeChoice = (t: MarketT, category: string, type: string) => {
	const base = `marketplace.typeChoice.${category}.${type}`
	return {
		title: raw(t)(`${base}.title`),
		subtitle: raw(t)(`${base}.subtitle`)
	}
}
const forCategory = (t: MarketT, group: string, category: string) =>
	raw(t)(`marketplace.form.${group}.${category}`)
export const priceLabel = (t: MarketT, category: string, type: string) =>
	raw(t)(`marketplace.form.priceLabel.${category}.${type}`)
/** Price row title in the detail view: the form label without the unit hint. */
export const priceDetailLabel = (t: MarketT, category: string, type: string) =>
	raw(t)(`marketplace.detail.priceLabel.${category}.${type}`)
/** Radio label of a salary unit. */
export const priceUnitLabel = (t: MarketT, unit: string) =>
	raw(t)(`marketplace.form.priceUnitOption.${unit}`)
export const locationLabel = (t: MarketT, category: string) =>
	forCategory(t, 'locationLabel', category)
export const locationHint = (t: MarketT, category: string) =>
	forCategory(t, 'locationHint', category)
export const locationPlaceholder = (t: MarketT, category: string) =>
	forCategory(t, 'locationPlaceholder', category)
export const datePlaceholder = (t: MarketT, category: string) =>
	forCategory(t, 'datePlaceholder', category)
/** "Start date" for job offers, "Available from" for job requests, move-in for housing. */
export const availableFromLabel = (
	t: MarketT,
	category: string,
	type: string
) =>
	category === 'jobs'
		? raw(t)(`marketplace.form.availableFrom.jobs.${type}`)
		: forCategory(t, 'availableFrom', category)

const PLAIN_MESSAGES = [
	'title',
	'description',
	'price',
	'location',
	'availableFrom'
] as const
const DETAIL_MESSAGES = ['employer', 'applyUrl', 'applyEmail'] as const
/**
 * Sentence for an `invalidDraftField` result. Details name their field; url,
 * email and number fields explain the format.
 */
export const invalidFieldText = (
	t: MarketT,
	field: string,
	category = '',
	type = ''
) => {
	const plain = known(PLAIN_MESSAGES, field)
	if (plain) return t(`marketplace.form.invalid.${plain}`)
	if (!field.startsWith('details.')) return t('marketplace.errors.invalidField')
	const key = field.slice('details.'.length)
	const own = known(DETAIL_MESSAGES, key)
	if (own) return t(`marketplace.form.invalid.${own}`)
	const spec = fieldsFor(category, type).find((s) => s.key === key)
	const name = fieldLabel(t, key)
	switch (spec?.kind) {
		case 'url':
		case 'email':
			return t(`marketplace.form.invalid.${spec.kind}`)
		case 'number':
			return raw(t)('marketplace.form.invalid.number', {
				min: spec.min,
				max: spec.max
			})
		case 'select':
		case 'multi':
			return raw(t)('marketplace.form.invalid.choose', { field: name })
		case 'date':
			return raw(t)('marketplace.form.invalid.date', { field: name })
		case 'text':
			return raw(t)(
				spec.required
					? 'marketplace.form.invalid.text'
					: 'marketplace.form.invalid.tooLong',
				{
					field: name,
					max: MARKET.shortTextMax
				}
			)
		case 'longText':
			return raw(t)(
				spec.required
					? 'marketplace.form.invalid.text'
					: 'marketplace.form.invalid.tooLong',
				{
					field: name,
					max: MARKET.longTextMax
				}
			)
		default:
			return t('marketplace.errors.invalidField')
	}
}

export const categoryOptions = (
	t: MarketT,
	all?: string
): ThemeMenuOption[] => [
	...(all ? [{ key: 'all', title: all }] : []),
	...CATEGORIES.map((key) => ({ key, title: categoryLabel(t, key) }))
]

/** 'YYYY-MM-DD' as a local date, or an ISO timestamp. */
export function formatMarketDate(value: string, language: string): string {
	const day = /^\d{4}-\d{2}-\d{2}$/.test(value)
	const [y, m, d] = value.split('-').map(Number)
	const date = day ? new Date(y, m - 1, d) : new Date(value)
	return new Intl.DateTimeFormat(language, {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	}).format(date)
}
