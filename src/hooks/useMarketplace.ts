import {
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient
} from '@tanstack/react-query'
import {
	type MarketFilter,
	type MarketPostInput,
	type MarketReportInput,
	marketplaceAPI
} from '@/api/marketplace-api'
import { MARKET_RULES_VERSION } from '@/utils/marketplace'
import { useAccountStore } from './useAccountStore'

// Photo URLs are signed for ~1 hour: keep cached data well below that.
const staleTime = 120000
const gcTime = 1800000
const root = 'marketplace'

const useOwner = () => useAccountStore((s) => s.user?.id)
const need = (owner: string | undefined) => {
	if (!owner) throw new Error('SignInRequired')
	return owner
}

export function useMarketPosts(filter?: MarketFilter) {
	const owner = useOwner()
	return useInfiniteQuery({
		// Browsing is public: guests share one cache entry, each account has its own.
		queryKey: [root, owner ?? 'guest', 'posts', filter ?? null],
		queryFn: ({ pageParam }) =>
			marketplaceAPI.posts(owner ?? null, filter, pageParam),
		initialPageParam: null as string | null,
		getNextPageParam: (page) => page.nextCursor,
		staleTime,
		gcTime,
		retry: 1
	})
}

export function useMarketPost(id: string | undefined) {
	const owner = useOwner()
	return useQuery({
		queryKey: [root, owner ?? 'guest', 'post', id],
		queryFn: () => marketplaceAPI.post(owner ?? null, id as string),
		enabled: !!id,
		staleTime,
		gcTime,
		retry: 1
	})
}

export function useMyMarketPosts() {
	const owner = useOwner()
	return useQuery({
		queryKey: [root, owner, 'mine'],
		queryFn: () => marketplaceAPI.myPosts(need(owner)),
		enabled: !!owner,
		staleTime,
		gcTime,
		retry: 1
	})
}

/** Query result for "has accepted the rules" plus an `accept` mutation. */
export function useMarketRules() {
	const owner = useOwner()
	const client = useQueryClient()
	const query = useQuery({
		queryKey: [root, owner, 'rules'],
		queryFn: () => marketplaceAPI.rulesAccepted(need(owner)),
		enabled: !!owner,
		staleTime: 300000,
		gcTime,
		retry: 1
	})
	const accept = useMutation({
		mutationFn: () =>
			marketplaceAPI.acceptRules(need(owner), MARKET_RULES_VERSION),
		onSuccess: () => client.invalidateQueries({ queryKey: [root, owner] })
	})
	return { ...query, accept }
}

function useInvalidating() {
	const owner = useOwner()
	const client = useQueryClient()
	return {
		owner,
		done: () => client.invalidateQueries({ queryKey: [root, owner] })
	}
}

/** Creates a post, or updates it when `id` is given. */
export function useSaveMarketPost() {
	const { owner, done } = useInvalidating()
	return useMutation({
		mutationFn: (v: {
			id?: string
			input: MarketPostInput
			photoIds?: string[] | null
		}) =>
			v.id
				? marketplaceAPI.update(need(owner), v.id, v.input, v.photoIds)
				: marketplaceAPI.create(need(owner), v.input, v.photoIds),
		onSuccess: done
	})
}

export function useRenewMarketPost() {
	const { owner, done } = useInvalidating()
	return useMutation({
		mutationFn: (id: string) => marketplaceAPI.renew(need(owner), id),
		onSuccess: done
	})
}

/** Sets the owner status: `active`, `reserved` or `closed`. */
export function useSetMarketPostStatus() {
	const { owner, done } = useInvalidating()
	return useMutation({
		mutationFn: (v: { id: string; status: string }) =>
			marketplaceAPI.setStatus(need(owner), v.id, v.status),
		onSuccess: done
	})
}

export function useDeleteMarketPost() {
	const { owner, done } = useInvalidating()
	return useMutation({
		mutationFn: (id: string) => marketplaceAPI.remove(need(owner), id),
		onSuccess: done
	})
}

export function useContactPoster() {
	const owner = useOwner()
	return useMutation({
		mutationFn: (v: { id: string; message: string }) =>
			marketplaceAPI.contactPoster(need(owner), v.id, v.message)
	})
}

/** Reports a post (`id`) or, with `token`, a message from a contact email. */
export function useReportPost() {
	const owner = useOwner()
	return useMutation({
		mutationFn: (
			v: { input: MarketReportInput } & (
				| { id: string; token?: undefined }
				| { token: string; id?: undefined }
			)
		) =>
			v.token
				? marketplaceAPI.reportMessage(need(owner), v.token, v.input)
				: marketplaceAPI.reportPost(need(owner), v.id as string, v.input)
	})
}
