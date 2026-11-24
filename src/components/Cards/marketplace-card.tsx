import type React from 'react'
import { useTranslation } from 'react-i18next'
import { Text, View } from 'react-native'
import type { MarketPost } from '@/api/marketplace-api'
import {
	categoryLabel,
	priceText,
	typeLabel
} from '@/components/Marketplace/market-labels'
import { MarketBadge } from '@/components/Marketplace/market-ui'
import { useMarketPosts } from '@/hooks/useMarketplace'
import { latestPosts, relativeAge } from '@/utils/marketplace-card'
import BaseCard from './base-card'

const MAX_POSTS = 3

function PostRow({ post }: { post: MarketPost }): React.JSX.Element {
	const { t, i18n } = useTranslation('marketplace')
	const price = priceText(post, t, i18n.language)
	return (
		<View testID="marketplace-card-post" className="gap-0.5">
			<View className="flex-row flex-wrap gap-1.5">
				<MarketBadge
					text={typeLabel(t, post.type)}
					tone={post.type === 'request' ? 'default' : 'primary'}
				/>
				<MarketBadge text={categoryLabel(t, post.category)} />
			</View>
			<Text numberOfLines={1} className="text-text text-base font-semibold">
				{post.title}
			</Text>
			<Text numberOfLines={1} className="text-label text-xs">
				{[price, relativeAge(post.createdAt, new Date(), i18n.language)]
					.filter(Boolean)
					.join(' · ')}
			</Text>
		</View>
	)
}

/** Browsing is public, so guests see the newest posts too. */
function LatestPosts(): React.JSX.Element {
	const { t } = useTranslation('marketplace')
	const { data, isLoading, isError } = useMarketPosts({})
	const posts = latestPosts(
		data?.pages.flatMap((page) => page.posts) ?? [],
		MAX_POSTS
	)
	if (posts.length === 0)
		return (
			<Text className="text-label text-sm">
				{isError
					? t('marketplace.list.loadFailed')
					: isLoading
						? ''
						: t('marketplace.list.empty')}
			</Text>
		)
	return (
		<View className="gap-3 mt-1">
			{posts.map((post) => (
				<PostRow key={post.id} post={post} />
			))}
		</View>
	)
}

export default function MarketplaceCard(): React.JSX.Element {
	return (
		<BaseCard title="marketplace" onPressRoute="/marketplace">
			<LatestPosts />
		</BaseCard>
	)
}
