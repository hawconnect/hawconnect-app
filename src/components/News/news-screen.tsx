import { useTranslation } from 'react-i18next'
import { FlatList, Linking, Pressable, Text, View } from 'react-native'
import { useCSSVariable } from 'uniwind'
import ErrorView from '@/components/Error/error-view'
import PlatformIcon from '@/components/Universal/icon'
import LoadingIndicator from '@/components/Universal/loading-indicator'
import { Image } from '@/components/Universal/styled'
import { useHawNews } from '@/hooks/useHawNews'
import { useTransparentHeaderPadding } from '@/hooks/useTransparentHeader'
import { toColor } from '@/utils/uniwind-utils'

export default function NewsScreen(): React.JSX.Element {
	const { t, i18n } = useTranslation('common')
	const { data, isLoading, isError, isFetching, refetch } = useHawNews()
	const paddingTop = useTransparentHeaderPadding() + 12
	const labelColor = toColor(useCSSVariable('--color-label'))
	const format = new Intl.DateTimeFormat(i18n.language, {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	})
	const dateLabel = (iso: string) => {
		const [y, m, d] = iso.split('-').map(Number)
		return format.format(new Date(y, m - 1, d))
	}
	if (isLoading)
		return (
			<View className="flex-1 items-center justify-center">
				<LoadingIndicator />
			</View>
		)
	if (!data?.available)
		return (
			<ErrorView
				title={t('pages.news.unavailable')}
				onRefresh={() => void refetch()}
				refreshing={isFetching}
			/>
		)
	return (
		<View testID="news-screen" className="flex-1" style={{ paddingTop }}>
			<FlatList
				data={data.items}
				keyExtractor={(item) => item.id}
				contentContainerClassName="px-page pb-bottom-safe gap-3 w-full max-w-[700px] self-center"
				refreshing={isFetching}
				onRefresh={() => void refetch()}
				ListHeaderComponent={
					data.stale || isError ? (
						<Text className="text-label text-xs pb-1">
							{t('pages.news.cached')}
						</Text>
					) : undefined
				}
				ListEmptyComponent={
					<Text className="text-label py-4">
						{t('pages.news.noNews.title')}
					</Text>
				}
				renderItem={({ item }) => (
					<Pressable
						testID="news-row"
						accessibilityRole="link"
						accessibilityLabel={item.title}
						onPress={() => void Linking.openURL(item.url)}
						className="flex-row gap-3 bg-card ios:rounded-ios android:rounded-md web:rounded-md border-hairline border-border shadow-card p-3 active:opacity-80"
					>
						<View className="w-[104px] aspect-[4/3] rounded-sm overflow-hidden bg-card-contrast items-center justify-center">
							{item.imageUrl ? (
								<Image
									source={{ uri: item.imageUrl }}
									contentFit="cover"
									accessibilityIgnoresInvertColors
									className="w-full h-full"
								/>
							) : (
								<PlatformIcon
									ios={{ name: 'newspaper', size: 22 }}
									android={{ name: 'newspaper', size: 24 }}
									web={{ name: 'Newspaper', size: 22 }}
									style={{ color: labelColor }}
								/>
							)}
						</View>
						<View className="flex-1">
							<Text className="text-label text-xs">
								{[dateLabel(item.date), ...item.categories].join(' · ')}
							</Text>
							<Text
								numberOfLines={3}
								className="text-text text-base font-semibold mt-0.5"
							>
								{item.title}
							</Text>
							{item.teaser != null && (
								<Text numberOfLines={2} className="text-label text-sm mt-0.5">
									{item.teaser}
								</Text>
							)}
							{item.imageCredit != null && (
								<Text
									numberOfLines={1}
									className="text-label-secondary text-[10px] mt-1"
								>
									{t('pages.news.photo', { credit: item.imageCredit })}
								</Text>
							)}
						</View>
					</Pressable>
				)}
				ListFooterComponent={
					<Pressable
						testID="news-source"
						accessibilityRole="link"
						onPress={() => void Linking.openURL(data.sourceUrl)}
						className="py-4"
					>
						<Text className="text-primary text-sm">{t('pages.news.more')}</Text>
					</Pressable>
				}
			/>
		</View>
	)
}
