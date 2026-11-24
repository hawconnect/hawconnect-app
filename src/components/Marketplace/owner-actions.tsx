import { useRouter } from 'expo-router'
import type React from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Alert, Platform } from 'react-native'
import { useCSSVariable } from 'uniwind'
import type { MarketPost } from '@/api/marketplace-api'
import FormList from '@/components/Universal/form-list'
import {
	useDeleteMarketPost,
	useRenewMarketPost,
	useSetMarketPostStatus
} from '@/hooks/useMarketplace'
import {
	canEdit,
	canRenew,
	marketErrorMessageKey,
	type StatusAction,
	statusActions
} from '@/utils/marketplace-form'
import { toColor } from '@/utils/uniwind-utils'
import { errorText, formatMarketDate, statusActionLabel } from './market-labels'

interface OwnerActionsProps {
	post: MarketPost
	onMessage: (text: string, tone: 'error' | 'success') => void
}

const STATUS_TARGET: Record<StatusAction, string> = {
	reserve: 'reserved',
	activate: 'active',
	close: 'closed',
	reopen: 'active'
}
const STATUS_ICON = {
	reserve: { ios: 'bookmark', android: 'bookmark', web: 'Bookmark' },
	activate: {
		ios: 'checkmark.circle',
		android: 'check_circle',
		web: 'CircleCheck'
	},
	close: { ios: 'xmark.circle', android: 'cancel', web: 'CircleX' },
	reopen: { ios: 'arrow.uturn.backward', android: 'undo', web: 'Undo2' }
} as const

/** Edit, status, Renew and Delete for the owner of a listing. */
export function OwnerActions({
	post,
	onMessage
}: OwnerActionsProps): React.JSX.Element {
	const { t, i18n } = useTranslation('marketplace')
	const router = useRouter()
	const renew = useRenewMarketPost()
	const remove = useDeleteMarketPost()
	const setStatus = useSetMarketPostStatus()
	const notification = String(
		toColor(useCSSVariable('--color-notification')) ?? '#ff3b30'
	)
	const busy = renew.isPending || remove.isPending || setStatus.isPending
	const fail = (e: unknown) =>
		onMessage(errorText(t, marketErrorMessageKey(e)), 'error')
	const deleteConfirmed = () =>
		remove.mutate(post.id, {
			// The post is hidden at once; go back to a list that refetches.
			onSuccess: () => {
				if (router.canGoBack()) router.back()
				else router.replace('/marketplace')
			},
			onError: fail
		})
	const confirm = (
		title: string,
		message: string,
		okText: string,
		onOk: () => void
	) => {
		if (Platform.OS === 'web') {
			if (window.confirm(`${title}\n${message}`)) onOk()
			return
		}
		Alert.alert(title, message, [
			{ text: t('marketplace.detail.cancel'), style: 'cancel' },
			{ text: okText, style: 'destructive', onPress: onOk }
		])
	}
	const confirmDelete = () =>
		confirm(
			t('marketplace.detail.deleteTitle'),
			t('marketplace.detail.deleteMessage'),
			t('marketplace.detail.delete'),
			deleteConfirmed
		)
	const changeStatus = (action: StatusAction) =>
		setStatus.mutate(
			{ id: post.id, status: STATUS_TARGET[action] },
			{ onError: fail }
		)
	const onStatus = (action: StatusAction) =>
		action === 'close'
			? confirm(
					t('marketplace.detail.closeTitle'),
					t('marketplace.detail.closeMessage'),
					statusActionLabel(t, post, action),
					() => changeStatus(action)
				)
			: changeStatus(action)
	const removed =
		post.status === 'removedByOwner' || post.status === 'removedByModerator'
	return (
		<FormList
			sections={[
				{
					header: t('marketplace.detail.manage'),
					footer: t('marketplace.detail.editFooter'),
					items: [
						...(canEdit(post)
							? [
									{
										testID: 'marketplace-edit',
										title: t('marketplace.detail.edit'),
										icon: {
											ios: 'pencil',
											android: 'edit' as const,
											web: 'Pencil' as const
										},
										disabled: busy,
										onPress: () =>
											router.navigate({
												pathname: '/marketplace/edit/[id]',
												params: { id: post.id }
											})
									}
								]
							: []),
						...statusActions(post).map((action) => ({
							testID: `marketplace-status-${action}`,
							title: statusActionLabel(t, post, action),
							icon: STATUS_ICON[action],
							disabled: busy,
							hideChevron: true,
							onPress: () => onStatus(action)
						})),
						...(canRenew(post)
							? [
									{
										testID: 'marketplace-renew',
										title: t('marketplace.detail.renew'),
										icon: {
											ios: 'arrow.clockwise',
											android: 'refresh' as const,
											web: 'RefreshCw' as const
										},
										disabled: busy,
										hideChevron: true,
										customComponent: renew.isPending
											? () => <ActivityIndicator />
											: undefined,
										onPress: () =>
											renew.mutate(post.id, {
												onSuccess: (renewed) =>
													onMessage(
														t('marketplace.detail.renewed', {
															date: formatMarketDate(
																renewed.expiresAt,
																i18n.language
															)
														}),
														'success'
													),
												onError: fail
											})
									}
								]
							: []),
						...(removed
							? []
							: [
									{
										testID: 'marketplace-delete',
										title: t('marketplace.detail.delete'),
										icon: {
											ios: 'trash',
											android: 'delete' as const,
											web: 'Trash' as const
										},
										iconColor: notification,
										textColor: notification,
										disabled: busy,
										hideChevron: true,
										customComponent: remove.isPending
											? () => <ActivityIndicator />
											: undefined,
										onPress: confirmDelete
									}
								])
					]
				}
			]}
		/>
	)
}
