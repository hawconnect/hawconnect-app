import type React from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, Text, View } from 'react-native'
import { Image } from '@/components/Universal/styled'

/** Swipeable photo strip with a "1 of 3" counter. */
export function PhotoGallery({
	urls,
	onImageError
}: {
	urls: string[]
	/** An image failed to load (its signed URL may have expired). */
	onImageError?: () => void
}): React.JSX.Element {
	const { t } = useTranslation('marketplace')
	const [width, setWidth] = useState(0)
	const [index, setIndex] = useState(0)
	return (
		<View
			className="w-full aspect-[4/3] ios:rounded-ios android:rounded-md web:rounded-md overflow-hidden bg-card-contrast"
			onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
		>
			<ScrollView
				horizontal
				pagingEnabled
				showsHorizontalScrollIndicator={false}
				onMomentumScrollEnd={(event) => {
					if (width > 0)
						setIndex(Math.round(event.nativeEvent.contentOffset.x / width))
				}}
				onScroll={(event) => {
					if (width > 0)
						setIndex(Math.round(event.nativeEvent.contentOffset.x / width))
				}}
				scrollEventThrottle={100}
			>
				{urls.map((url, i) => (
					<Image
						key={url}
						source={{ uri: url }}
						contentFit="cover"
						onError={onImageError}
						accessibilityIgnoresInvertColors
						accessibilityLabel={t('marketplace.detail.photo', {
							index: i + 1,
							count: urls.length
						})}
						style={{ width, height: '100%' }}
					/>
				))}
			</ScrollView>
			{urls.length > 1 && (
				<View className="absolute bottom-2 right-2 rounded-full bg-black/55 px-2 py-0.5">
					<Text className="text-white text-xs">
						{t('marketplace.detail.photo', {
							index: index + 1,
							count: urls.length
						})}
					</Text>
				</View>
			)}
		</View>
	)
}
