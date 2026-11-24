import { useRouter } from 'expo-router'
import type React from 'react'
import { useTranslation } from 'react-i18next'
import { SectionList, Text, View } from 'react-native'
import ErrorView from '@/components/Error/error-view'
import LoadingIndicator from '@/components/Universal/loading-indicator'
import { useExpiredImageRefresh } from '@/hooks/useExpiredImageRefresh'
import { useMyMarketPosts } from '@/hooks/useMarketplace'
import { groupByStatus } from '@/utils/marketplace'
import { marketErrorMessageKey } from '@/utils/marketplace-form'
import { errorText, groupLabel } from './market-labels'
import { PostCard } from './post-card'
import { MarketplaceGate } from './sign-in-gate'

function MyPosts(): React.JSX.Element {
	const { t } = useTranslation('marketplace')
	const router = useRouter()
	const query = useMyMarketPosts()
	const onImageError = useExpiredImageRefresh(query.refetch)
	if (query.isLoading)
		return (
			<View className="flex-1 items-center justify-center bg-background">
				<LoadingIndicator />
			</View>
		)
	if (query.isError && !query.data)
		return (
			<ErrorView
				title={errorText(t, marketErrorMessageKey(query.error))}
				onRefresh={() => void query.refetch()}
				refreshing={query.isFetching}
			/>
		)
	// Posts the owner deleted are gone for them too.
	const sections = groupByStatus(query.data ?? [])
	return (
		<SectionList
			testID="marketplace-my-posts-screen"
			className="flex-1 bg-background"
			contentInsetAdjustmentBehavior="automatic"
			sections={sections}
			stickySectionHeadersEnabled={false}
			keyExtractor={(post) => post.id}
			contentContainerClassName="px-page pt-4 pb-10 gap-3 w-full max-w-[700px] self-center"
			refreshing={query.isRefetching}
			onRefresh={() => void query.refetch()}
			renderSectionHeader={({ section }) => (
				<Text
					testID={`marketplace-group-${section.group}`}
					accessibilityRole="header"
					className="text-label-secondary text-xs uppercase ios:mx-4 pt-2"
				>
					{groupLabel(t, section.group)}
				</Text>
			)}
			ListEmptyComponent={
				<Text className="text-label py-4 text-center">
					{t('marketplace.mine.empty')}
				</Text>
			}
			ListFooterComponent={
				<Text className="text-label-secondary text-xs ios:mx-4 pt-2">
					{t('marketplace.mine.footer')}
				</Text>
			}
			renderItem={({ item }) => (
				<PostCard
					post={item}
					showStatus
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

export default function MyPostsScreen(): React.JSX.Element {
	return (
		<MarketplaceGate>
			<MyPosts />
		</MarketplaceGate>
	)
}
