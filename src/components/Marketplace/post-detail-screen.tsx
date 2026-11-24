import { useLocalSearchParams, useRouter } from 'expo-router'
import type React from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, Text, View } from 'react-native'
import type { MarketPost } from '@/api/marketplace-api'
import ErrorView from '@/components/Error/error-view'
import FormList from '@/components/Universal/form-list'
import LoadingIndicator from '@/components/Universal/loading-indicator'
import { useAccountStore } from '@/hooks/useAccountStore'
import { useExpiredImageRefresh } from '@/hooks/useExpiredImageRefresh'
import { useMarketPost } from '@/hooks/useMarketplace'
import type { FormListSections, SectionGroup } from '@/types/components'
import { applyAddress, applyLink } from '@/utils/marketplace-apply'
import {
	expiryKind,
	isLapsed,
	isPostGone,
	marketErrorMessageKey
} from '@/utils/marketplace-form'
import {
	contactLinks,
	deadlineState,
	detailIcon,
	listingSubtitle
} from '@/utils/marketplace-job'
import { saveReturnPath } from '@/utils/return-path'
import { appStorage } from '@/utils/storage'
import { ContactSheet } from './contact-sheet'
import { detailItems, openLink } from './listing-details'
import {
	availableFromLabel,
	categoryLabel,
	errorText,
	fieldLabel,
	formatMarketDate,
	posterLabel,
	priceDetailLabel,
	priceText,
	statusLabel,
	typeLabel
} from './market-labels'
import { InlineMessage, MarketBadge } from './market-ui'
import { OwnerActions } from './owner-actions'
import { PhotoGallery } from './photo-gallery'
import { ReportSheet } from './report-sheet'

type Sheet = 'contact' | 'report' | null

function PostBody({
	post,
	onImageError
}: {
	post: MarketPost
	onImageError: () => void
}): React.JSX.Element {
	const { t, i18n } = useTranslation('marketplace')
	const router = useRouter()
	// Guests may read a post; contacting and reporting need an account.
	const signedIn = useAccountStore(
		(s) => s.status === 'authenticated' && s.user != null
	)
	const [sheet, setSheet] = useState<Sheet>(null)
	const open = (next: Exclude<Sheet, null>) => {
		setMessage(null)
		if (signedIn) setSheet(next)
		else {
			// Come back to this post after signing in.
			saveReturnPath(appStorage, `/marketplace/${post.id}`)
			router.navigate('/login')
		}
	}
	const [message, setMessage] = useState<{
		text: string
		tone: 'error' | 'success'
	} | null>(null)
	const date = (value: string) => formatMarketDate(value, i18n.language)
	const price = priceText(post, t, i18n.language)
	const now = Date.now()
	const fields: SectionGroup[] = []
	if (price != null)
		fields.push({
			title: priceDetailLabel(t, post.category, post.type),
			icon: detailIcon('price'),
			value: price
		})
	if (post.availableFrom)
		fields.push({
			title: availableFromLabel(t, post.category, post.type),
			icon: detailIcon('availableFrom'),
			value: date(post.availableFrom)
		})
	const allFields = [
		...fields,
		...detailItems(post, t, i18n.language, new Date(now))
	]
	const sections: FormListSections[] = [
		...(allFields.length
			? [{ header: t('marketplace.detail.details'), items: allFields }]
			: []),
		{ item: post.description }
	]
	const isJobOffer = post.category === 'jobs' && post.type === 'offer'
	const apply = isJobOffer ? applyLink(post.details) : null
	const closed =
		deadlineState(
			typeof post.details.applyDeadline === 'string'
				? post.details.applyDeadline
				: null,
			new Date(now)
		)?.kind === 'closed'
	const subtitle = listingSubtitle(post)
	const contact = isJobOffer ? contactLinks(post.details) : null
	const onLinkFailed = () =>
		setMessage({
			text: errorText(t, 'marketplace.errors.generic'),
			tone: 'error'
		})
	const email = contact?.email
	const website = contact?.website
	const contactSections: FormListSections[] = contact
		? [
				{
					header: t('marketplace.detail.contactHeader'),
					items: [
						...(contact.name || contact.role
							? [
									{
										testID: 'marketplace-contact-person',
										title: fieldLabel(t, 'contactName'),
										value: [contact.name, contact.role]
											.filter(Boolean)
											.join(' · '),
										icon: detailIcon('contactName'),
										hideChevron: true,
										selectable: true,
										copyable: contact.name ?? contact.role ?? ''
									}
								]
							: []),
						...(email
							? [
									{
										testID: 'marketplace-contact-email',
										title: fieldLabel(t, 'contactEmail'),
										value: email.text,
										icon: detailIcon('contactEmail'),
										hideChevron: true,
										selectable: true,
										copyable: email.text,
										onPress: () => openLink(email.href, onLinkFailed)
									}
								]
							: []),
						...(website
							? [
									{
										testID: 'marketplace-contact-website',
										title: website.text,
										icon: detailIcon('companyWebsite'),
										hideChevron: true,
										accessibilityHint: website.href,
										onPress: () => openLink(website.href, onLinkFailed)
									}
								]
							: [])
					]
				}
			]
		: []
	// The address appears only here, so a failed Apply Now never dead-ends.
	const address = isJobOffer ? applyAddress(post.details) : null
	const applyFailed = () =>
		setMessage({
			text: t('marketplace.detail.applyFailed', { address: address ?? '' }),
			tone: 'error'
		})
	// The employer's contact is public by design; the owner sees it too.
	const applySections: FormListSections[] =
		isJobOffer && !post.isOwn && apply && !closed
			? [
					{
						items: [
							{
								testID: 'marketplace-apply',
								title: t('marketplace.detail.apply'),
								icon: { ios: 'paperplane', android: 'send', web: 'Send' },
								onPress: () => openLink(apply, applyFailed)
							}
						]
					}
				]
			: []
	// Old listings without a usable apply route fall back to the normal Contact.
	const showContact = !isJobOffer || !apply
	const contactItem = {
		testID: 'marketplace-contact',
		title: t(
			signedIn
				? 'marketplace.detail.contact'
				: 'marketplace.detail.contactSignIn'
		),
		icon: { ios: 'envelope', android: 'mail', web: 'Mail' },
		onPress: () => open('contact')
	} as const
	const expiry = expiryKind(post, now)
	const actionItems = [
		...(showContact ? [contactItem] : []),
		...(signedIn
			? [
					{
						testID: 'marketplace-report',
						title: t('marketplace.detail.report'),
						icon: { ios: 'flag', android: 'flag', web: 'Flag' },
						onPress: () => open('report')
					} as const
				]
			: [])
	]
	const actions: FormListSections[] =
		post.isOwn || actionItems.length === 0 ? [] : [{ items: actionItems }]
	return (
		<ScrollView
			testID="marketplace-post-detail"
			className="flex-1 bg-background"
			contentInsetAdjustmentBehavior="automatic"
			contentContainerClassName="px-page pt-4 pb-10 gap-5 w-full max-w-[700px] self-center"
		>
			{post.photoUrls.length > 0 && (
				<PhotoGallery urls={post.photoUrls} onImageError={onImageError} />
			)}
			<View className="gap-2">
				<View className="flex-row flex-wrap gap-1.5">
					<MarketBadge
						text={typeLabel(t, post.type)}
						tone={post.type === 'request' ? 'default' : 'primary'}
					/>
					<MarketBadge text={categoryLabel(t, post.category)} />
					{post.status !== 'active' && (
						<MarketBadge
							text={statusLabel(t, post.category, post.type, post.status)}
							tone="warning"
						/>
					)}
				</View>
				<Text
					accessibilityRole="header"
					selectable
					className="text-text text-2xl font-bold"
				>
					{post.title}
				</Text>
				{subtitle && (
					<Text
						testID="marketplace-subtitle"
						selectable
						className="text-text text-base"
					>
						{subtitle}
					</Text>
				)}
				<Text className="text-label text-sm">
					{[
						posterLabel(t, post),
						t('marketplace.detail.posted', { date: date(post.createdAt) }),
						post.isOwn &&
							expiry &&
							t(`marketplace.detail.${expiry}`, { date: date(post.expiresAt) })
					]
						.filter(Boolean)
						.join(' · ')}
				</Text>
			</View>
			<FormList sections={sections} />
			{contactSections.length > 0 && <FormList sections={contactSections} />}
			{applySections.length > 0 && <FormList sections={applySections} />}
			{post.isOwn && isLapsed(post, now) && (
				<Text testID="marketplace-lapsed" className="text-label text-sm">
					{t('marketplace.detail.lapsed')}
				</Text>
			)}
			{message && <InlineMessage text={message.text} tone={message.tone} />}
			{actions.length > 0 && <FormList sections={actions} />}
			{post.isOwn && (
				<OwnerActions
					post={post}
					onMessage={(text, tone) => setMessage({ text, tone })}
				/>
			)}
			{!post.isOwn && signedIn && (
				<>
					<ContactSheet
						postId={post.id}
						visible={sheet === 'contact'}
						onClose={() => setSheet(null)}
						onSent={() => {
							setSheet(null)
							setMessage({
								text: t('marketplace.contact.success'),
								tone: 'success'
							})
						}}
					/>
					<ReportSheet
						postId={post.id}
						visible={sheet === 'report'}
						onClose={() => setSheet(null)}
						onReported={() => {
							setSheet(null)
							setMessage({
								text: t('marketplace.report.success'),
								tone: 'success'
							})
						}}
					/>
				</>
			)}
		</ScrollView>
	)
}

function PostDetail(): React.JSX.Element {
	const { t } = useTranslation('marketplace')
	const { id } = useLocalSearchParams<{ id: string }>()
	const query = useMarketPost(id)
	const onImageError = useExpiredImageRefresh(query.refetch)
	if (query.isLoading)
		return (
			<View className="flex-1 items-center justify-center bg-background">
				<LoadingIndicator />
			</View>
		)
	if (query.data === null || (query.isError && isPostGone(query.error)))
		return (
			<ErrorView
				title={t('marketplace.detail.unavailable')}
				icon={{ ios: 'tag.slash', android: 'block', web: 'Ban' }}
			/>
		)
	if (query.isError || !query.data)
		return (
			<ErrorView
				title={errorText(t, marketErrorMessageKey(query.error))}
				onRefresh={() => void query.refetch()}
				refreshing={query.isFetching}
			/>
		)
	return <PostBody post={query.data} onImageError={onImageError} />
}

export default function PostDetailScreen(): React.JSX.Element {
	return <PostDetail />
}
