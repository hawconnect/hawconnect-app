import { router, useFocusEffect } from 'expo-router'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, Linking, Pressable, Text, View } from 'react-native'
import ErrorView from '@/components/Error/error-view'
import LoadingIndicator from '@/components/Universal/loading-indicator'
import { useHawClubs } from '@/hooks/useHawClubs'
import { useTransparentHeaderPadding } from '@/hooks/useTransparentHeader'
import { safeClubUrl } from '@/utils/club-rich-text'

/** First letter for the club's badge (skips leading symbols and digits). */
const initial = (title: string) =>
	(title.match(/\p{L}/u)?.[0] ?? title.trim()[0] ?? '?').toUpperCase()

export default function ClubsScreen(): React.JSX.Element {
	const { t } = useTranslation('common')
	const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useHawClubs()
	useFocusEffect(
		useCallback(() => {
			if (Date.now() - dataUpdatedAt > 60_000) void refetch()
		}, [dataUpdatedAt, refetch])
	)
	const paddingTop = useTransparentHeaderPadding() + 12
	if (isLoading)
		return (
			<View className="flex-1 items-center justify-center">
				<LoadingIndicator />
			</View>
		)
	if (!data?.available)
		return (
			<ErrorView
				title={t('pages.clubs.unavailable')}
				onRefresh={() => void refetch()}
				refreshing={isFetching}
			/>
		)
	return (
		<View testID="clubs-screen" className="flex-1" style={{ paddingTop }}>
			<FlatList
				data={data.clubs}
				keyExtractor={(item) => item.id}
				contentContainerClassName="px-page pb-bottom-safe gap-2 w-full max-w-[700px] self-center"
				refreshing={isFetching}
				onRefresh={() => void refetch()}
				ListHeaderComponent={
					<View className="py-2 gap-1">
						<Text className="text-label text-sm">
							{t('pages.clubs.subtitle')}
						</Text>
						{data.stale && (
							<Text className="text-label text-xs">
								{t('pages.clubs.cached')}
							</Text>
						)}
					</View>
				}
				ListEmptyComponent={
					<View className="items-center gap-1 py-12 px-6">
						<Text className="text-text text-base font-semibold text-center">
							{t('pages.clubs.empty')}
						</Text>
						<Text className="text-label text-sm text-center">
							{t('pages.clubs.emptyHint')}
						</Text>
					</View>
				}
				renderItem={({ item }) => (
					<Pressable
						testID="club-row"
						accessibilityRole="button"
						accessibilityLabel={item.title}
						accessibilityHint={t('pages.clubs.open')}
						onPress={() =>
							router.push({ pathname: '/clubs/[id]', params: { id: item.id } })
						}
						className="rounded-mg bg-card border-hairline border-border shadow-card px-3.5 py-3.5 gap-2 active:opacity-90"
					>
						<View className="flex-row items-center gap-3">
							<View className="size-10 rounded-full bg-primary-background items-center justify-center">
								<Text className="text-primary text-base font-bold">
									{initial(item.title)}
								</Text>
							</View>
							<Text
								className="flex-1 text-text text-base font-semibold"
								numberOfLines={2}
							>
								{item.title}
							</Text>
							<Text
								importantForAccessibility="no"
								accessibilityElementsHidden
								className="text-label text-xl leading-6"
							>
								›
							</Text>
						</View>
						{!!item.description && (
							<Text numberOfLines={3} className="text-label text-sm">
								{item.description}
							</Text>
						)}
						{item.links.length > 0 && (
							<View className="flex-row flex-wrap gap-2 pt-0.5">
								{item.links.map((link) => (
									<Pressable
										key={link.url}
										accessibilityRole="link"
										accessibilityLabel={link.title}
										onPress={(event) => {
											event.stopPropagation()
											const url = safeClubUrl(link.url)
											if (url) void Linking.openURL(url).catch(() => {})
										}}
										className="rounded-full bg-primary-background px-3 py-1.5"
									>
										<Text className="text-primary text-sm font-medium">
											{link.title} ↗
										</Text>
									</Pressable>
								))}
							</View>
						)}
					</Pressable>
				)}
			/>
		</View>
	)
}
