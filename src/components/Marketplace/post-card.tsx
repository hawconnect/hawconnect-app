import type React from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, Text, View } from 'react-native'
import { useCSSVariable } from 'uniwind'
import type { MarketPost } from '@/api/marketplace-api'
import PlatformIcon from '@/components/Universal/icon'
import { Image } from '@/components/Universal/styled'
import { cardChips } from '@/utils/marketplace-card'
import { expiryKind, isLapsed } from '@/utils/marketplace-form'
import { listingSubtitle } from '@/utils/marketplace-job'
import { toColor } from '@/utils/uniwind-utils'
import {
	categoryLabel,
	fieldLabel,
	formatMarketDate,
	optionLabel,
	posterLabel,
	priceText,
	statusLabel,
	typeLabel
} from './market-labels'
import { MarketBadge } from './market-ui'

interface PostCardProps {
	post: MarketPost
	onPress: () => void
	/** My posts: show status and expiry instead of the poster label. */
	showStatus?: boolean
	/** The thumbnail failed to load (its signed URL may have expired). */
	onImageError?: () => void
}

export function PostCard({
	post,
	onPress,
	showStatus = false,
	onImageError
}: PostCardProps): React.JSX.Element {
	const { t, i18n } = useTranslation('marketplace')
	const labelColor = toColor(useCSSVariable('--color-label'))
	const price = priceText(post, t, i18n.language)
	const chipList = cardChips(post)
	const subtitle = listingSubtitle(post)
	const chips = chipList.map((chip) => {
		if (chip.field === 'price') return price ?? ''
		if (chip.field === 'sizeSqm')
			return t('marketplace.unit.sizeSqm', { value: chip.value })
		if (chip.field === 'furnished')
			return `${fieldLabel(t, 'furnished')}: ${optionLabel(t, 'furnished', chip.value)}`
		return optionLabel(t, chip.field, chip.value)
	})
	const hasPriceChip = chipList.some((c) => c.field === 'price')
	const date = (value: string) => formatMarketDate(value, i18n.language)
	const expiry = expiryKind(post)
	const meta = showStatus
		? [
				statusLabel(t, post.category, post.type, post.status),
				expiry &&
					t(`marketplace.detail.${expiry}`, { date: date(post.expiresAt) })
			]
		: [posterLabel(t, post), date(post.createdAt)]
	return (
		<Pressable
			testID="marketplace-post-row"
			accessibilityRole="button"
			accessibilityLabel={[typeLabel(t, post.type), post.title, price]
				.filter(Boolean)
				.join(', ')}
			onPress={onPress}
			className="flex-row gap-3 bg-card ios:rounded-ios android:rounded-md web:rounded-md border-hairline border-border shadow-card p-3 active:opacity-80"
		>
			<View className="w-[84px] aspect-square rounded-sm overflow-hidden bg-card-contrast items-center justify-center">
				{post.photoUrls[0] ? (
					<Image
						source={{ uri: post.photoUrls[0] }}
						contentFit="cover"
						onError={onImageError}
						accessibilityIgnoresInvertColors
						className="w-full h-full"
					/>
				) : (
					<PlatformIcon
						ios={{ name: 'tag', size: 22 }}
						android={{ name: 'sell', size: 24 }}
						web={{ name: 'Tag', size: 22 }}
						style={{ color: labelColor }}
					/>
				)}
			</View>
			<View className="flex-1 gap-1">
				<View className="flex-row flex-wrap gap-1.5">
					<MarketBadge
						text={typeLabel(t, post.type)}
						tone={post.type === 'request' ? 'default' : 'primary'}
					/>
					<MarketBadge text={categoryLabel(t, post.category)} />
					{!showStatus && post.status !== 'active' && (
						<MarketBadge
							text={statusLabel(t, post.category, post.type, post.status)}
							tone="warning"
						/>
					)}
				</View>
				<Text numberOfLines={2} className="text-text text-base font-semibold">
					{post.title}
				</Text>
				{subtitle && (
					<Text numberOfLines={1} className="text-label text-sm">
						{subtitle}
					</Text>
				)}
				{price != null && !hasPriceChip && (
					<Text className="text-text text-sm font-medium">{price}</Text>
				)}
				{chips.length > 0 && (
					<View className="flex-row flex-wrap gap-1.5">
						{chips.filter(Boolean).map((text) => (
							<MarketBadge key={text} text={text} />
						))}
					</View>
				)}
				<Text numberOfLines={1} className="text-label text-xs">
					{meta.filter(Boolean).join(' · ')}
				</Text>
				{showStatus && isLapsed(post) && (
					<Text className="text-label text-xs">
						{t('marketplace.detail.lapsed')}
					</Text>
				)}
			</View>
		</Pressable>
	)
}
