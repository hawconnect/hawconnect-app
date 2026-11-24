import {
	defaultShouldDehydrateQuery,
	type Query,
	type QueryClient
} from '@tanstack/react-query'

/** Marketplace data is personal to the signed-in student and must never be written to the device. */
const MARKETPLACE_ROOT = 'marketplace'

/** Persister filter: the default rule for every query except marketplace ones. */
export function shouldPersistQuery(query: Query): boolean {
	return (
		query.queryKey[0] !== MARKETPLACE_ROOT && defaultShouldDehydrateQuery(query)
	)
}

/** Drops all in-memory marketplace data, e.g. on sign-out or account deletion. */
export function clearMarketplaceQueries(client: QueryClient): void {
	client.removeQueries({ queryKey: [MARKETPLACE_ROOT] })
}
