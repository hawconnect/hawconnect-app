import type { TFunction } from 'i18next'
import type { AccountStatus } from './account-access'

export const MARKET_RULES_VERSION = 1

export interface MarketPricing {
	priceEur: number | null
	priceFree: boolean
	priceUnit: string | null
}

const errorCodes = [
	'SignInRequired',
	'RulesRequired',
	'Blocked',
	'ActivePostLimit',
	'MarketPostExpired',
	'InvalidMarketStatus',
	'PostUnavailable',
	'RenewWindowClosed',
	'AlreadyReported',
	'ContactLimit',
	'OwnPost',
	'MailUnavailable',
	'InvalidMarketMessage',
	'InvalidMarketReport',
	'MarketplaceUnavailable',
	'PhotoLimit',
	'PhotoTooLarge',
	'InvalidPhoto',
	'PhotoUnavailable'
] as const

const known = new Set<string>(errorCodes)
const camel = (code: string) => code.charAt(0).toLowerCase() + code.slice(1)

/** Maps a backend or upload error code to a `marketplace.errors.*` i18n key. */
export function marketErrorKey(code: string): string {
	if (/^InvalidMarketPost:[A-Za-z.]+$/.test(code))
		return 'marketplace.errors.invalidField'
	return known.has(code)
		? `marketplace.errors.${camel(code)}`
		: 'marketplace.errors.generic'
}

const unitKeys = {
	once: 'marketplace.price.once',
	perMonth: 'marketplace.price.perMonth',
	perHour: 'marketplace.price.perHour'
} as const

/** Human readable price, or null when the post has no price. */
export function formatPrice(
	post: MarketPricing,
	t: TFunction,
	language = 'en'
): string | null {
	if (post.priceFree) return t('marketplace.price.free', { ns: 'marketplace' })
	if (post.priceEur == null) return null
	const price = new Intl.NumberFormat(language, {
		minimumFractionDigits: Number.isInteger(post.priceEur) ? 0 : 2,
		maximumFractionDigits: 2
	}).format(post.priceEur)
	const key =
		unitKeys[(post.priceUnit ?? 'once') as keyof typeof unitKeys] ??
		unitKeys.once
	return t(key, { ns: 'marketplace', price })
}

/** What the marketplace gate shows: wait while the session is still being restored. */
export function marketplaceGateView(
	status: AccountStatus,
	hasUser: boolean
): 'loading' | 'content' | 'signIn' {
	if (status === 'loading') return 'loading'
	return status === 'authenticated' && hasUser ? 'content' : 'signIn'
}

/** i18n keys of the offer / request segments; they follow the chosen category. */
export function typeFilterKeys(category?: string | null) {
	const scoped = (
		{
			jobs: 'jobs',
			housing: 'housing'
		} as Record<string, string>
	)[category ?? '']
	return scoped
		? {
				offer: `marketplace.filter.types.${scoped}.offer`,
				request: `marketplace.filter.types.${scoped}.request`
			}
		: {
				offer: 'marketplace.filter.offers',
				request: 'marketplace.filter.requests'
			}
}

/** GraphQL variables for the public list: only type and category are filters. */
export function postsVariables(
	filter?: { type?: string | null; category?: string | null } | null,
	cursor?: string | null
) {
	const type = filter?.type ?? null
	const category = filter?.category ?? null
	return {
		filter: type || category ? { type, category } : null,
		cursor: cursor ?? null
	}
}

export type StatusGroup =
	| 'active'
	| 'reserved'
	| 'closed'
	| 'expired'
	| 'hidden'
const GROUP_OF: Record<string, StatusGroup> = {
	active: 'active',
	reserved: 'reserved',
	closed: 'closed',
	expired: 'expired',
	hiddenPendingReview: 'hidden',
	hiddenByBlock: 'hidden',
	removedByModerator: 'hidden'
}
const GROUP_ORDER: StatusGroup[] = [
	'active',
	'reserved',
	'closed',
	'expired',
	'hidden'
]

/** My Listings sections in a fixed order; empty groups and deleted posts are dropped. */
export function groupByStatus<T extends { status: string }>(posts: T[]) {
	return GROUP_ORDER.map((group) => ({
		group,
		data: posts.filter((p) => GROUP_OF[p.status] === group)
	})).filter((g) => g.data.length > 0)
}
