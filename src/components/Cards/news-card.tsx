import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
	AccessibilityInfo,
	FlatList,
	Linking,
	type NativeScrollEvent,
	type NativeSyntheticEvent,
	Platform,
	Pressable,
	Text,
	View
} from 'react-native'
import { useReducedMotion } from 'react-native-reanimated'
import { useCSSVariable } from 'uniwind'
import PlatformIcon from '@/components/Universal/icon'
import { Image } from '@/components/Universal/styled'
import { useHawNews } from '@/hooks/useHawNews'
import { toColor } from '@/utils/uniwind-utils'
import BaseCard from './base-card'

const MAX_ITEMS = 6
const AUTO_ADVANCE_MS = 5000
/** After the user swipes or taps, wait this long before auto-advancing again. */
const RESUME_AFTER_MS = 8000

type NewsItem = NonNullable<
	ReturnType<typeof useHawNews>['data']
>['items'][number]

function NewsSlide({
	item,
	width,
	dateLabel
}: {
	item: NewsItem
	width: number
	dateLabel: string
}): React.JSX.Element {
	const labelColor = toColor(useCSSVariable('--color-label'))
	const meta = [dateLabel, item.categories[0]].filter(Boolean).join(' · ')
	return (
		<Pressable
			testID={`news-slide-${item.id}`}
			accessibilityRole="link"
			accessibilityLabel={`${item.title}, ${meta}`}
			onPress={() => void Linking.openURL(item.url)}
			className="active:opacity-80"
			style={{ width }}
		>
			<View className="rounded-md overflow-hidden bg-card-contrast aspect-video">
				{item.imageUrl ? (
					<Image
						source={{ uri: item.imageUrl }}
						contentFit="cover"
						transition={150}
						accessibilityIgnoresInvertColors
						className="w-full h-full"
					/>
				) : (
					<View className="flex-1 items-center justify-center">
						<PlatformIcon
							ios={{ name: 'newspaper', size: 28 }}
							android={{ name: 'newspaper', size: 30 }}
							web={{ name: 'Newspaper', size: 28 }}
							style={{ color: labelColor }}
						/>
					</View>
				)}
				{item.imageCredit != null && (
					<Text
						numberOfLines={1}
						className="absolute bottom-1.5 right-1.5 max-w-[80%] text-[10px] text-white bg-black/45 px-1.5 py-0.5 rounded-xs"
					>
						© {item.imageCredit}
					</Text>
				)}
			</View>
			<Text className="text-label text-xs mt-2.5">{meta}</Text>
			<Text
				numberOfLines={2}
				className="text-text text-base font-semibold mt-0.5"
			>
				{item.title}
			</Text>
			{item.teaser != null && (
				<Text numberOfLines={2} className="text-label text-sm mt-0.5">
					{item.teaser}
				</Text>
			)}
		</Pressable>
	)
}

export default function NewsCard(): React.JSX.Element {
	const { t, i18n } = useTranslation('common')
	const { data, isLoading } = useHawNews()
	const [width, setWidth] = useState(0)
	const [index, setIndex] = useState(0)
	const list = useRef<FlatList<NewsItem>>(null)
	const items = (data?.items ?? []).slice(0, MAX_ITEMS)
	const indexRef = useRef(0)
	const pausedUntil = useRef(0)
	const hovering = useRef(false)
	const reduceMotion = useReducedMotion()
	const [screenReader, setScreenReader] = useState(false)
	const goTo = (i: number) => {
		list.current?.scrollToOffset({ offset: i * width, animated: true })
		indexRef.current = i
		setIndex(i)
	}
	const pause = () => {
		pausedUntil.current = Date.now() + RESUME_AFTER_MS
	}

	useEffect(() => {
		// react-native-web always reports a screen reader, so only ask natively.
		if (Platform.OS === 'web') return
		void AccessibilityInfo.isScreenReaderEnabled().then(setScreenReader)
		const sub = AccessibilityInfo.addEventListener(
			'screenReaderChanged',
			setScreenReader
		)
		return () => sub.remove()
	}, [])

	// Auto-advance, looping; off for Reduce Motion and screen-reader users.
	useEffect(() => {
		if (reduceMotion || screenReader || items.length < 2 || !width) return
		const timer = setInterval(() => {
			if (hovering.current || Date.now() < pausedUntil.current) return
			const next = (indexRef.current + 1) % items.length
			list.current?.scrollToOffset({ offset: next * width, animated: true })
			indexRef.current = next
			setIndex(next)
		}, AUTO_ADVANCE_MS)
		return () => clearInterval(timer)
	}, [reduceMotion, screenReader, items.length, width])
	const format = new Intl.DateTimeFormat(i18n.language, {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	})
	const dateLabel = (iso: string) => {
		const [y, m, d] = iso.split('-').map(Number)
		return format.format(new Date(y, m - 1, d))
	}
	const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
		if (!width) return
		const next = Math.round(event.nativeEvent.contentOffset.x / width)
		const clamped = Math.max(0, Math.min(next, items.length - 1))
		if (clamped !== indexRef.current) {
			indexRef.current = clamped
			setIndex(clamped)
		}
	}

	return (
		<BaseCard title="news" onPressRoute="/news" hasInteractiveContent>
			{items.length > 0 ? (
				<View
					className="mt-2.5"
					onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
					onTouchStart={pause}
					onPointerEnter={() => {
						hovering.current = true
					}}
					onPointerLeave={() => {
						hovering.current = false
					}}
				>
					{width > 0 && (
						<FlatList
							ref={list}
							testID="news-carousel"
							data={items}
							keyExtractor={(item) => item.id}
							horizontal
							getItemLayout={(_, i) => ({
								length: width,
								offset: width * i,
								index: i
							})}
							pagingEnabled
							showsHorizontalScrollIndicator={false}
							onScroll={onScroll}
							onScrollBeginDrag={pause}
							scrollEventThrottle={16}
							renderItem={({ item }) => (
								<NewsSlide
									item={item}
									width={width}
									dateLabel={dateLabel(item.date)}
								/>
							)}
						/>
					)}
					{items.length > 1 && (
						<View
							className="flex-row justify-center gap-1.5 mt-3"
							accessibilityRole="adjustable"
							accessibilityLabel={t('pages.news.position', {
								current: index + 1,
								total: items.length
							})}
						>
							{items.map((item, i) => (
								<Pressable
									key={item.id}
									hitSlop={6}
									accessibilityElementsHidden
									importantForAccessibility="no"
									onPress={() => {
										pause()
										goTo(i)
									}}
									className={`h-1.5 rounded-full ${i === index ? 'w-4 bg-primary' : 'w-1.5 bg-label-tertiary'}`}
								/>
							))}
						</View>
					)}
				</View>
			) : (
				<Text className="text-label text-sm">
					{t(
						isLoading
							? 'pages.news.loading'
							: data?.available
								? 'pages.news.noNews.title'
								: 'pages.news.unavailable'
					)}
				</Text>
			)}
		</BaseCard>
	)
}
