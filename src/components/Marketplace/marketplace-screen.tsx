import { useRouter } from 'expo-router'
import type React from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, Pressable, Text, View } from 'react-native'
import type { MarketFilter } from '@/api/marketplace-api'
import LoadingIndicator from '@/components/Universal/loading-indicator'
import { useExpiredImageRefresh } from '@/hooks/useExpiredImageRefresh'
import { useMarketPosts } from '@/hooks/useMarketplace'
import { marketErrorMessageKey } from '@/utils/marketplace-form'
import { MarketFilters } from './market-filters'
import { errorText } from './market-labels'
import { InlineMessage } from './market-ui'
import { PostCard } from './post-card'

function MarketplaceList(): React.JSX.Element {
	const { t } = useTranslation('marketplace')
	const router = useRouter()
	const [filter, setFilter] = useState<MarketFilter>({})
	const query = useMarketPosts(filter)
	const onImageError = useExpiredImageRefresh(query.refetch)
	const posts = query.data?.pages.flatMap((page) => page.posts) ?? []
	const filtered = Boolean(filter.type || filter.category)
	const empty = query.isLoading ? (
		<View className="py-10 items-center">
			<LoadingIndicator />
		</View>
	) : query.isError ? (
		<View className="gap-2">
			<InlineMessage
				text={t('marketplace.list.loadFailedWithReason', {
					reason: errorText(t, marketErrorMessageKey(query.error))
				})}
			/>
			<Pressable
				testID="marketplace-retry"
				accessibilityRole="button"
				onPress={() => void query.refetch()}
				className="py-2 active:opacity-60"
			>
				<Text className="text-primary text-sm">
					{t('marketplace.list.retry')}
				</Text>
			</Pressable>
		</View>
	) : (
		<Text className="text-label py-4 text-center">
			{filtered
				? t('marketplace.list.emptyFiltered')
				: t('marketplace.list.empty')}
		</Text>
	)
	return (
		<FlatList
			testID="marketplace-screen"
			className="flex-1 bg-background"
			contentInsetAdjustmentBehavior="automatic"
			data={posts}
			keyExtractor={(post) => post.id}
			contentContainerClassName="px-page pt-4 pb-10 gap-3 w-full max-w-[700px] self-center"
			refreshing={query.isRefetching && !query.isFetchingNextPage}
			onRefresh={() => void query.refetch()}
			onEndReachedThreshold={0.4}
			onEndReached={() => {
				if (query.hasNextPage && !query.isFetchingNextPage)
					void query.fetchNextPage()
			}}
			ListHeaderComponent={
				<MarketFilters filter={filter} onChange={setFilter} />
			}
			ListEmptyComponent={empty}
			ListFooterComponent={
				<>
					{query.isFetchingNextPage && (
						<View className="py-4 items-center">
							<LoadingIndicator />
						</View>
					)}
					<Text
						testID="marketplace-not-official"
						className="text-label text-xs text-center pt-4"
					>
						{t('marketplace.notOfficial')}
					</Text>
				</>
			}
			renderItem={({ item }) => (
				<PostCard
					post={item}
					onImageError={onImageError}
					onPress={() =>
						router.navigate({
							pathname: '/marketplace/[id]',
							params: { id: item.id }
						})
					}
				/>
			)}
		/>
	)
}

/** Browsing is open to guests; posting and "My posts" ask for sign-in on their own screens. */
export default function MarketplaceScreen(): React.JSX.Element {
	return <MarketplaceList />
}
