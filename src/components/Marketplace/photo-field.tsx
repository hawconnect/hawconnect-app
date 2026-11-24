import * as ImagePicker from 'expo-image-picker'
import type React from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { useCSSVariable } from 'uniwind'
import { marketplaceAPI } from '@/api/marketplace-api'
import PlatformIcon from '@/components/Universal/icon'
import { Image } from '@/components/Universal/styled'
import { useAccountStore } from '@/hooks/useAccountStore'
import {
	PHOTO_MAX,
	photoTooLarge,
	pickedMime,
	uploadErrorKey
} from '@/utils/marketplace-form'
import { toColor } from '@/utils/uniwind-utils'
import { errorText } from './market-labels'

export interface PickedPhoto {
	key: string
	uri: string
	id?: string
	uploading: boolean
	/** Shown on the slot; such a photo is never uploaded. */
	error?: string
}

/** Picked photos, each uploaded as soon as it is picked. */
export function usePhotoUploads() {
	const { t } = useTranslation('marketplace')
	const owner = useAccountStore((s) => s.user?.id)
	const [photos, setPhotos] = useState<PickedPhoto[]>([])
	const [error, setError] = useState('')
	const update = (key: string, patch: Partial<PickedPhoto> | null) =>
		setPhotos((list) =>
			patch == null
				? list.filter((p) => p.key !== key)
				: list.map((p) => (p.key === key ? { ...p, ...patch } : p))
		)
	const upload = async (photo: PickedPhoto, mime: string) => {
		try {
			if (!owner) throw new Error('SignInRequired')
			const id = await marketplaceAPI.uploadPhoto(owner, photo.uri, mime)
			update(photo.key, { id, uploading: false })
		} catch (e) {
			update(photo.key, null)
			setError(errorText(t, uploadErrorKey(e)))
		}
	}
	const pick = async () => {
		setError('')
		const remaining = PHOTO_MAX - photos.length
		if (remaining <= 0) return
		let result: ImagePicker.ImagePickerResult
		try {
			result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ['images'],
				allowsMultipleSelection: remaining > 1,
				selectionLimit: remaining,
				quality: 0.7,
				exif: false
			})
		} catch {
			setError(t('marketplace.form.photoPermission'))
			return
		}
		if (result.canceled) return
		const picked = result.assets.slice(0, remaining).map((asset, i) => {
			// Known size over the server's 5 MB limit: don't upload, flag the slot.
			const tooLarge = photoTooLarge(asset.fileSize)
			const photo: PickedPhoto = {
				key: `${Date.now()}-${i}-${asset.uri.slice(-12)}`,
				uri: asset.uri,
				uploading: !tooLarge,
				error: tooLarge ? t('marketplace.errors.photoTooLarge') : undefined
			}
			return {
				photo,
				mime: pickedMime(asset.mimeType, asset.fileName ?? asset.uri)
			}
		})
		setPhotos((list) => [...list, ...picked.map((p) => p.photo)])
		for (const { photo, mime } of picked)
			if (!photo.error) void upload(photo, mime)
	}
	return {
		photos,
		error,
		uploading: photos.some((p) => p.uploading),
		ids: photos.flatMap((p) => (p.id ? [p.id] : [])),
		pick,
		remove: (key: string) => update(key, null),
		reset: () => {
			setPhotos([])
			setError('')
		}
	}
}

interface PhotoFieldProps {
	photos: PickedPhoto[]
	/** Edit mode before replacing: the post's current photos (read only). */
	existing?: string[]
	disabled: boolean
	onAdd: () => void
	onRemove: (key: string) => void
}

export function PhotoField({
	photos,
	existing,
	disabled,
	onAdd,
	onRemove
}: PhotoFieldProps): React.JSX.Element {
	const { t } = useTranslation('marketplace')
	const label = String(toColor(useCSSVariable('--color-label')) ?? '#666')
	const primary = String(
		toColor(useCSSVariable('--color-primary')) ?? '#40296c'
	)
	const thumb =
		'size-[84px] rounded-sm overflow-hidden bg-card-contrast items-center justify-center'
	return (
		<View className="flex-row flex-wrap gap-3">
			{existing?.map((url) => (
				<View key={url} className={thumb}>
					<Image
						source={{ uri: url }}
						contentFit="cover"
						accessibilityIgnoresInvertColors
						className="w-full h-full"
					/>
				</View>
			))}
			{photos.map((photo, index) => (
				<View key={photo.key} className={thumb}>
					<Image
						source={{ uri: photo.uri }}
						contentFit="cover"
						accessibilityIgnoresInvertColors
						className="w-full h-full"
					/>
					{photo.error != null && (
						<View
							accessibilityRole="alert"
							className="absolute inset-0 items-center justify-center bg-black/60 p-1"
						>
							<Text
								numberOfLines={4}
								className="text-white text-[10px] text-center"
							>
								{photo.error}
							</Text>
						</View>
					)}
					{photo.uploading ? (
						<View
							accessibilityLabel={t('marketplace.form.uploading')}
							accessibilityLiveRegion="polite"
							className="absolute inset-0 items-center justify-center bg-black/45 gap-1"
						>
							<ActivityIndicator color="#ffffff" />
							<Text className="text-white text-[10px]">
								{t('marketplace.form.uploading')}
							</Text>
						</View>
					) : (
						<Pressable
							testID={`marketplace-photo-remove-${index}`}
							accessibilityRole="button"
							accessibilityLabel={t('marketplace.form.removePhoto', {
								index: index + 1
							})}
							onPress={() => onRemove(photo.key)}
							hitSlop={8}
							className="absolute top-1 right-1 rounded-full bg-black/55 p-1 active:opacity-60"
						>
							<PlatformIcon
								ios={{ name: 'xmark', size: 11, weight: 'bold' }}
								android={{ name: 'close', size: 14 }}
								web={{ name: 'X', size: 14 }}
								style={{ color: '#ffffff' }}
							/>
						</Pressable>
					)}
				</View>
			))}
			{existing == null && photos.length < PHOTO_MAX && (
				<Pressable
					testID="marketplace-photo-add"
					accessibilityRole="button"
					accessibilityLabel={t('marketplace.form.addPhoto')}
					disabled={disabled}
					onPress={onAdd}
					className={`${thumb} border-hairline border-border active:opacity-60`}
					style={disabled ? { opacity: 0.4 } : undefined}
				>
					<PlatformIcon
						ios={{ name: 'photo.badge.plus', size: 22 }}
						android={{ name: 'add_photo_alternate', size: 26 }}
						web={{ name: 'ImagePlus', size: 24 }}
						style={{ color: disabled ? label : primary }}
					/>
				</Pressable>
			)}
		</View>
	)
}
