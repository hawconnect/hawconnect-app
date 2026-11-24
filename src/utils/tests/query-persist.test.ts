import { describe, expect, it } from 'bun:test'
import { QueryClient } from '@tanstack/react-query'
import { clearMarketplaceQueries, shouldPersistQuery } from '../query-persist'

const seeded = async () => {
	const client = new QueryClient()
	for (const key of [
		['marketplace', 'user-1', 'posts', null],
		['marketplace', 'user-1', 'mine'],
		['food', 'today'],
		['calendar']
	])
		await client.prefetchQuery({ queryKey: key, queryFn: () => key.join('/') })
	return client
}

describe('query persistence', () => {
	it('never persists marketplace queries but keeps the default for others', async () => {
		const client = await seeded()
		const persisted = client
			.getQueryCache()
			.getAll()
			.filter(shouldPersistQuery)
			.map((q) => q.queryKey[0])
		expect(persisted.sort()).toEqual(['calendar', 'food'])
	})
	it('keeps the default rule (no failed or pending queries) for other keys', async () => {
		const client = new QueryClient()
		await client
			.prefetchQuery({
				queryKey: ['food'],
				queryFn: () => Promise.reject(new Error('x')),
				retry: false
			})
			.catch(() => {})
		const [query] = client.getQueryCache().getAll()
		expect(shouldPersistQuery(query)).toBe(false)
	})
	it('removes every marketplace query on sign-out and keeps the rest', async () => {
		const client = await seeded()
		clearMarketplaceQueries(client)
		expect(
			client
				.getQueryCache()
				.getAll()
				.map((q) => q.queryKey[0])
				.sort()
		).toEqual(['calendar', 'food'])
	})
})
