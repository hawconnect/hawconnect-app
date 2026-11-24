import { useLocalSearchParams, useRouter } from 'expo-router'
import type React from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	Text,
	View
} from 'react-native'
import type { AccountAPIError } from '@/api/account-api'
import type { MarketPost } from '@/api/marketplace-api'
import ErrorView from '@/components/Error/error-view'
import FormList from '@/components/Universal/form-list'
import PlatformIcon from '@/components/Universal/icon'
import LoadingIndicator from '@/components/Universal/loading-indicator'
import {
	useMarketPost,
	useMarketRules,
	useSaveMarketPost
} from '@/hooks/useMarketplace'
import type { FormListSections } from '@/types/components'
import { photosAllowed } from '@/utils/marketplace-fields'
import {
	type DraftField,
	draftFromPost,
	draftToInput,
	emptyDraft,
	invalidDraftField,
	type MarketDraft,
	marketErrorMessageKey,
	normalizeDraft,
	photoIdsFor,
	serverInvalidField
} from '@/utils/marketplace-form'
import { FieldShell, useFormColors } from './form-controls'
import { errorText, invalidFieldText } from './market-labels'
import { InlineMessage } from './market-ui'
import { PhotoField, usePhotoUploads } from './photo-field'
import { PostFormFields } from './post-form-fields'
import { RulesSheet } from './rules-sheet'
import { MarketplaceGate } from './sign-in-gate'

function PostForm({ post }: { post?: MarketPost }): React.JSX.Element {
	const { t } = useTranslation('marketplace')
	const router = useRouter()
	const save = useSaveMarketPost()
	const rules = useMarketRules()
	const uploads = usePhotoUploads()
	const [draft, setDraft] = useState<MarketDraft>(() =>
		post ? draftFromPost(post) : emptyDraft()
	)
	const [invalid, setInvalid] = useState<DraftField | null>(null)
	const [replacing, setReplacing] = useState(!post)
	const [error, setError] = useState('')
	const [rulesOpen, setRulesOpen] = useState(false)
	const { border, text } = useFormColors()
	const needsRules = !post && rules.data === false
	const busy = save.isPending
	const withPhotos = photosAllowed(draft.category, draft.type)
	const set = (patch: Partial<MarketDraft>) => {
		setDraft((d) => {
			const next = { ...d, ...patch }
			return 'category' in patch || 'type' in patch
				? normalizeDraft(next)
				: next
		})
		setInvalid(null)
	}
	const leave = () => {
		if (router.canGoBack()) router.back()
		else router.replace('/marketplace')
	}
	const submit = () => {
		setError('')
		const field = invalidDraftField(draft)
		if (field) {
			setInvalid(field)
			setError(invalidFieldText(t, field, draft.category, draft.type))
			return
		}
		if (withPhotos && uploads.uploading) {
			setError(t('marketplace.form.waitForUploads'))
			return
		}
		save.mutate(
			{
				id: post?.id,
				input: draftToInput(draft),
				// Edit: null keeps the current photos; a list replaces them. Categories
				// without photos send [] so none stay (picked photos stay local).
				photoIds: photoIdsFor(withPhotos, replacing, uploads.ids)
			},
			{
				onSuccess: (saved) => {
					if (post) leave()
					else
						router.replace({
							pathname: '/marketplace/[id]',
							params: { id: saved.id }
						})
				},
				onError: (e) => {
					if ((e as AccountAPIError).code === 'RulesRequired')
						setRulesOpen(true)
					const field = serverInvalidField(e)
					if (field) {
						setInvalid(field)
						setError(invalidFieldText(t, field, draft.category, draft.type))
					} else setError(errorText(t, marketErrorMessageKey(e)))
				}
			}
		)
	}
	if (!post && rules.isLoading)
		return (
			<View className="flex-1 items-center justify-center bg-background">
				<LoadingIndicator />
			</View>
		)
	const photoBlock = withPhotos ? (
		<FieldShell
			label={t('marketplace.form.photos')}
			hint={
				replacing
					? t('marketplace.form.photosFooter')
					: t('marketplace.form.replaceFooter')
			}
		>
			<PhotoField
				photos={uploads.photos}
				existing={replacing ? undefined : post?.photoUrls}
				disabled={busy}
				onAdd={() => void uploads.pick()}
				onRemove={uploads.remove}
			/>
			{!replacing && (
				<Pressable
					testID="marketplace-photo-replace"
					accessibilityRole="button"
					disabled={busy}
					onPress={() => {
						uploads.reset()
						setReplacing(true)
					}}
					className="flex-row items-center justify-center gap-2 active:opacity-60"
					style={{
						height: 48,
						borderRadius: 999,
						borderWidth: 1,
						borderColor: border
					}}
				>
					<PlatformIcon
						ios={{ name: 'photo.on.rectangle', size: 17 }}
						android={{ name: 'photo_library', size: 20 }}
						web={{ name: 'Images', size: 18 }}
						style={{ color: text }}
					/>
					<Text className="text-text text-base">
						{t('marketplace.form.replacePhotos')}
					</Text>
				</Pressable>
			)}
			{uploads.error !== '' && <InlineMessage text={uploads.error} />}
		</FieldShell>
	) : null
	const submitSection: FormListSections[] = [
		{
			items: [
				{
					testID: 'marketplace-form-submit',
					title: post
						? t('marketplace.form.save')
						: t('marketplace.form.publish'),
					icon: post
						? {
								ios: 'checkmark.circle',
								android: 'check_circle',
								web: 'CircleCheck'
							}
						: { ios: 'paperplane', android: 'send', web: 'Send' },
					hideChevron: true,
					disabled: busy || (withPhotos && uploads.uploading),
					customComponent: busy ? () => <ActivityIndicator /> : undefined,
					onPress: submit
				}
			]
		}
	]
	return (
		<ScrollView
			testID="marketplace-post-form"
			className="flex-1 bg-background"
			contentInsetAdjustmentBehavior="automatic"
			keyboardShouldPersistTaps="handled"
			showsVerticalScrollIndicator={false}
			contentContainerClassName="px-page pt-4 pb-10 gap-6 w-full max-w-[600px] self-center"
		>
			<PostFormFields
				draft={draft}
				set={set}
				invalid={invalid}
				disabled={busy}
				photos={photoBlock}
			/>
			{error !== '' && <InlineMessage text={error} />}
			<FormList sections={submitSection} />
			<RulesSheet
				visible={needsRules || rulesOpen}
				onAccepted={() => {
					setRulesOpen(false)
					setError('')
				}}
				onCancel={() => {
					setRulesOpen(false)
					if (needsRules) leave()
				}}
			/>
		</ScrollView>
	)
}

function EditPostForm({ id }: { id: string }): React.JSX.Element {
	const { t } = useTranslation('marketplace')
	const query = useMarketPost(id)
	if (query.isLoading)
		return (
			<View className="flex-1 items-center justify-center bg-background">
				<LoadingIndicator />
			</View>
		)
	if (!query.data?.isOwn || query.data.status !== 'active')
		return (
			<ErrorView
				title={
					query.isError && query.data === undefined
						? errorText(t, marketErrorMessageKey(query.error))
						: t('marketplace.detail.unavailable')
				}
			/>
		)
	return <PostForm post={query.data} />
}

export function NewPostScreen(): React.JSX.Element {
	const { t } = useTranslation('marketplace')
	return (
		<MarketplaceGate note={t('marketplace.gate.noteCreate')}>
			<PostForm />
		</MarketplaceGate>
	)
}

export function EditPostScreen(): React.JSX.Element {
	const { id } = useLocalSearchParams<{ id: string }>()
	return (
		<MarketplaceGate>
			<EditPostForm id={id} />
		</MarketplaceGate>
	)
}
