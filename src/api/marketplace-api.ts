import { accountAPI } from '@/api/account-api'
import { postsVariables } from '@/utils/marketplace'
import { MARKET_FIELDS } from '@/utils/marketplace-fields'

// Types mirror hawconnect-backend/src/schema/*.gql (hand-written: codegen only
// emits types for documents in gql-documents.ts, and these authenticated
// operations deliberately live outside it).
export type MarketType = 'offer' | 'request'
export type MarketCategory = 'housing' | 'jobs'
export type MarketPriceUnit = 'once' | 'perMonth' | 'perHour'
export type MarketReportReason =
	| 'scam'
	| 'illegal'
	| 'offensive'
	| 'discrimination'
	| 'spam'
	| 'other'

/** Category-specific values; unset fields come back as null. */
export type MarketDetails = Record<
	string,
	string | number | string[] | null | undefined
>

export interface MarketPost {
	id: string
	type: string
	category: string
	title: string
	description: string
	priceEur: number | null
	priceFree: boolean
	priceUnit: string | null
	location: string | null
	/** 'YYYY-MM-DD' */
	availableFrom: string | null
	details: MarketDetails
	status: string
	createdAt: string
	expiresAt: string
	isOwn: boolean
	/** Signed URLs valid for about one hour. */
	photoUrls: string[]
}
export interface MarketPostPage {
	posts: MarketPost[]
	nextCursor: string | null
}
export interface MarketFilter {
	type?: string | null
	category?: string | null
}
export interface MarketPostInput {
	type: string
	category: string
	title: string
	description: string
	priceEur?: number | null
	priceFree: boolean
	priceUnit?: string | null
	location?: string | null
	availableFrom?: string | null
	/** Only keys of the category and type; numbers as integers. */
	details: Record<string, string | number | string[]>
}
export interface MarketReportInput {
	reason: string
	note?: string | null
}

// The details selection comes from the registry, so every field is fetched.
const DETAIL_KEYS = [
	...new Set(
		Object.values(MARKET_FIELDS).flatMap((types) =>
			Object.values(types).flatMap((fields) => fields.map((f) => f.key))
		)
	)
]
const POST_FIELDS = `id type category title description priceEur priceFree priceUnit location availableFrom details { ${DETAIL_KEYS.join(' ')} } status createdAt expiresAt isOwn photoUrls`

const queries = {
	posts: `query MarketPosts($filter: MarketFilter, $cursor: String) { marketPosts(filter: $filter, cursor: $cursor) { posts { ${POST_FIELDS} } nextCursor } }`,
	post: `query MarketPost($id: ID!) { marketPost(id: $id) { ${POST_FIELDS} } }`,
	mine: `query MyMarketPosts { myMarketPosts { ${POST_FIELDS} } }`,
	rules: 'query MarketRulesAccepted { marketRulesAccepted }',
	accept:
		'mutation AcceptMarketRules($version: Int!) { acceptMarketRules(version: $version) }',
	create: `mutation CreateMarketPost($input: MarketPostInput!, $photoIds: [ID!]) { createMarketPost(input: $input, photoIds: $photoIds) { ${POST_FIELDS} } }`,
	update: `mutation UpdateMarketPost($id: ID!, $input: MarketPostInput!, $photoIds: [ID!]) { updateMarketPost(id: $id, input: $input, photoIds: $photoIds) { ${POST_FIELDS} } }`,
	renew: `mutation RenewMarketPost($id: ID!) { renewMarketPost(id: $id) { ${POST_FIELDS} } }`,
	setStatus: `mutation SetMarketPostStatus($id: ID!, $status: String!) { setMarketPostStatus(id: $id, status: $status) { ${POST_FIELDS} } }`,
	remove: 'mutation DeleteMarketPost($id: ID!) { deleteMarketPost(id: $id) }',
	report:
		'mutation ReportMarketPost($id: ID!, $input: MarketReportInput!) { reportMarketPost(id: $id, input: $input) }',
	reportMessage:
		'mutation ReportMarketMessage($token: String!, $input: MarketReportInput!) { reportMarketMessage(token: $token, input: $input) }',
	contact:
		'mutation ContactMarketPoster($id: ID!, $message: String!) { contactMarketPoster(id: $id, message: $message) }'
}

/** Every call needs the signed-in account id (`ownerId`), like accountSync. */
export const marketplaceAPI = {
	/** Public: pass null to browse as a guest. */
	posts: async (
		ownerId: string | null,
		filter?: MarketFilter,
		cursor?: string | null
	) =>
		(
			await accountAPI.graphQL<{ marketPosts: MarketPostPage }>(
				queries.posts,
				postsVariables(filter, cursor),
				ownerId
			)
		).marketPosts,
	post: async (ownerId: string | null, id: string) =>
		(
			await accountAPI.graphQL<{ marketPost: MarketPost | null }>(
				queries.post,
				{ id },
				ownerId
			)
		).marketPost,
	myPosts: async (ownerId: string) =>
		(
			await accountAPI.graphQL<{ myMarketPosts: MarketPost[] }>(
				queries.mine,
				{},
				ownerId
			)
		).myMarketPosts,
	rulesAccepted: async (ownerId: string) =>
		(
			await accountAPI.graphQL<{ marketRulesAccepted: boolean }>(
				queries.rules,
				{},
				ownerId
			)
		).marketRulesAccepted,
	acceptRules: async (ownerId: string, version: number) =>
		(
			await accountAPI.graphQL<{ acceptMarketRules: boolean }>(
				queries.accept,
				{ version },
				ownerId
			)
		).acceptMarketRules,
	create: async (
		ownerId: string,
		input: MarketPostInput,
		photoIds?: string[] | null
	) =>
		(
			await accountAPI.graphQL<{ createMarketPost: MarketPost }>(
				queries.create,
				{ input, photoIds: photoIds ?? null },
				ownerId
			)
		).createMarketPost,
	update: async (
		ownerId: string,
		id: string,
		input: MarketPostInput,
		photoIds?: string[] | null
	) =>
		(
			await accountAPI.graphQL<{ updateMarketPost: MarketPost }>(
				queries.update,
				{ id, input, photoIds: photoIds ?? null },
				ownerId
			)
		).updateMarketPost,
	renew: async (ownerId: string, id: string) =>
		(
			await accountAPI.graphQL<{ renewMarketPost: MarketPost }>(
				queries.renew,
				{ id },
				ownerId
			)
		).renewMarketPost,
	setStatus: async (ownerId: string, id: string, status: string) =>
		(
			await accountAPI.graphQL<{ setMarketPostStatus: MarketPost }>(
				queries.setStatus,
				{ id, status },
				ownerId
			)
		).setMarketPostStatus,
	remove: async (ownerId: string, id: string) =>
		(
			await accountAPI.graphQL<{ deleteMarketPost: boolean }>(
				queries.remove,
				{ id },
				ownerId
			)
		).deleteMarketPost,
	reportPost: async (ownerId: string, id: string, input: MarketReportInput) =>
		(
			await accountAPI.graphQL<{ reportMarketPost: boolean }>(
				queries.report,
				{ id, input },
				ownerId
			)
		).reportMarketPost,
	/** `token` comes from the report link in a contact email. */
	reportMessage: async (
		ownerId: string,
		token: string,
		input: MarketReportInput
	) =>
		(
			await accountAPI.graphQL<{ reportMarketMessage: boolean }>(
				queries.reportMessage,
				{ token, input },
				ownerId
			)
		).reportMarketMessage,
	contactPoster: async (ownerId: string, id: string, message: string) =>
		(
			await accountAPI.graphQL<{ contactMarketPoster: boolean }>(
				queries.contact,
				{ id, message },
				ownerId
			)
		).contactMarketPoster,
	/** Uploads a picked image and resolves with the new photo id. */
	async uploadPhoto(
		ownerId: string,
		uri: string,
		mime: string
	): Promise<string> {
		// Local picker URI (file://, blob:, content://): plain fetch, not the service guard.
		const blob = await (await fetch(uri)).blob()
		const value = await accountAPI.upload<{ id: string }>(
			'/api/marketplace/photos',
			blob,
			mime,
			ownerId
		)
		return value.id
	}
}
