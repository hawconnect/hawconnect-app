import { isPostGone, marketErrorMessageKey } from './marketplace-form'

/** The newest `limit` posts, newest first. Does not mutate the input. */
export function latestPosts<T extends { createdAt: string }>(
	posts: readonly T[],
	limit: number
): T[] {
	return [...posts]
		.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
		.slice(0, limit)
}

/**
 * i18n key for a failed message report. The backend answers `PostUnavailable`
 * for a malformed token, an expired token (older than the report window) and
 * a token that belongs to another recipient, so all three read as "expired".
 */
export function reportErrorKey(error: unknown): string {
	return isPostGone(error)
		? 'marketplace.report.linkExpired'
		: marketErrorMessageKey(error)
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
	['day', 86_400_000],
	['hour', 3_600_000],
	['minute', 60_000]
]

/**
 * "2 days ago" / "vor 2 Tagen"; anything under a minute reads "now". Hermes on
 * iOS has no Intl.RelativeTimeFormat, so there it falls back to "14 Nov".
 */
export function relativeAge(iso: string, now: Date, language: string): string {
	if (typeof Intl.RelativeTimeFormat !== 'function')
		return new Date(iso).toLocaleDateString(language, {
			day: 'numeric',
			month: 'short'
		})
	const diff = Date.parse(iso) - now.getTime()
	const format = new Intl.RelativeTimeFormat(language, { numeric: 'auto' })
	for (const [unit, ms] of UNITS)
		if (Math.abs(diff) >= ms) return format.format(Math.round(diff / ms), unit)
	return format.format(0, 'minute')
}

export interface ChipPost {
	type: string
	category: string
	priceEur: number | null
	priceFree: boolean
	details: Record<string, string | number | string[] | null | undefined>
}
/** `field` is a registry key or 'price'; `value` an option key or a number. */
export interface CardChip {
	field: string
	value: string
}

const CHIP_FIELDS: Record<string, string[]> = {
	jobs: ['jobType', 'workMode', 'languages', 'price'],
	housing: ['housingType', 'sizeSqm', 'furnished']
}

/** At most four short facts for a listing card, in priority order. */
export function cardChips(post: ChipPost): CardChip[] {
	const chips: CardChip[] = []
	for (const field of CHIP_FIELDS[post.category] ?? []) {
		if (field === 'price') {
			if (post.priceEur != null && !post.priceFree)
				chips.push({ field, value: '' })
			continue
		}
		const raw = post.details[field]
		const value = Array.isArray(raw) ? raw[0] : raw
		if (value == null || value === '') continue
		chips.push({ field, value: String(value) })
	}
	return chips.slice(0, 4)
}
