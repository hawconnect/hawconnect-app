import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform, Text, View } from 'react-native'
import { accountAPI } from '@/api/account-api'
import { loginSite } from '@/api/login-site'
import { queryClient } from '@/components/provider'
import Button from '@/components/Universal/button'
import FormList from '@/components/Universal/form-list'
import { useAccountStore } from '@/hooks/useAccountStore'
import {
	clearCurrentAccountCache,
	syncAccountNow,
	useCloudCalendarCopies
} from '@/hooks/useAccountSync'
import {
	useAccountLifecycleStore,
	useAccountSyncStore
} from '@/hooks/useAccountSyncStore'
import { leaveAccount } from '@/utils/account-leave'
import { signOutTarget } from '@/utils/login-site'
import { clearMarketplaceQueries } from '@/utils/query-persist'
import { accountProfileStorage } from '@/utils/storage'
import SignInEntry from './sign-in-entry'

/**
 * Account status on top, then `children` (the settings), then sign-out and
 * delete last: destructive actions sit below everything else.
 */
export default function AccountControls({
	children
}: {
	children?: React.ReactNode
}): React.JSX.Element {
	const { t } = useTranslation('account')
	const status = useAccountStore((s) => s.status)
	const user = useAccountStore((s) => s.user)
	const pending = useAccountSyncStore((s) => s.pending.length)
	const conflicts = useAccountSyncStore((s) => s.conflicts.length)
	const syncError = useAccountSyncStore((s) => s.error)
	const syncing = useAccountLifecycleStore((s) => s.syncing)
	const [busy, setBusy] = useState(false)
	const [mode, setMode] = useState<'logout' | 'delete' | 'conflicts' | null>(
		null
	)
	const [error, setError] = useState('')
	async function run(action: () => Promise<void>) {
		setBusy(true)
		setError('')
		try {
			await action()
			setMode(null)
		} catch {
			setError(t('actionFailed'))
		} finally {
			setBusy(false)
		}
	}
	async function leave(action: 'logout' | 'delete', syncFirst = false) {
		const owner = useAccountStore.getState().user?.id
		const generation = accountProfileStorage.getGeneration()
		const unchanged = () =>
			!!owner &&
			useAccountStore.getState().user?.id === owner &&
			accountProfileStorage.getGeneration() === generation
		if (!unchanged()) throw new Error('AccountChanged')
		if (syncFirst) {
			await syncAccountNow()
			if (useAccountSyncStore.getState().pending.length)
				throw new Error('PendingChanges')
		}
		if (!unchanged()) throw new Error('AccountChanged')
		let endSessionUrl: string | undefined
		let cleared = false
		await leaveAccount(action, {
			endSession: async () => {
				if (action === 'logout')
					endSessionUrl = (await accountAPI.signOut()).endSessionUrl
				else await accountAPI.deleteAccount()
			},
			clearCredential: () => accountAPI.clearLocalCredential(),
			clearLocal: async () => {
				clearMarketplaceQueries(queryClient)
				await clearCurrentAccountCache(owner)
				cleared = true
			},
			signedOut: () => {
				if (useAccountStore.getState().user?.id === owner)
					useAccountStore.getState().signedOut()
			},
			unchanged
		})
		// Web: also end the login-site session. Deletion and "sign out all devices" already end it on the server.
		const target =
			action === 'logout' && cleared
				? signOutTarget(Platform.OS, endSessionUrl, loginSite.login)
				: null
		if (target) window.location.href = target
	}
	if (status !== 'authenticated')
		return (
			<>
				<SignInEntry />
				{children}
			</>
		)
	return (
		<View className="gap-3 mt-3">
			<FormList
				sections={[
					{
						items: [
							{
								testID: 'account-signed-in-email',
								title: t('signedInAs', { email: user?.email ?? '' }),
								icon: {
									ios: 'person.crop.circle',
									android: 'account_circle',
									web: 'User'
								},
								selectable: true
							}
						]
					}
				]}
			/>
			{conflicts > 0 && (
				<>
					<Text className="text-notification">
						{t('conflicts', { count: conflicts })}
					</Text>
					<Button
						variant="secondary"
						disabled={busy || syncing}
						onPress={() => setMode('conflicts')}
					>
						{t('resolveConflicts')}
					</Button>
				</>
			)}
			{!!syncError && (
				<Text className="text-notification" accessibilityRole="alert">
					{t('syncFailed')}
				</Text>
			)}
			{children}
			<FormList
				sections={[
					{
						header: t('accountSection'),
						items: [
							{
								testID: 'account-sign-out',
								title: t('signOut'),
								icon: {
									ios: 'rectangle.portrait.and.arrow.right',
									android: 'logout',
									web: 'LogOut'
								},
								disabled: busy || syncing,
								onPress: () =>
									pending ? setMode('logout') : void run(() => leave('logout'))
							},
							{
								testID: 'account-delete',
								title: t('deleteAccount'),
								icon: { ios: 'trash', android: 'delete', web: 'Trash' },
								disabled: busy || syncing,
								onPress: () => setMode('delete')
							}
						]
					}
				]}
			/>
			{mode === 'conflicts' && (
				<>
					<Text className="text-label">{t('cloudCopyWarning')}</Text>
					<Button
						disabled={busy || syncing}
						onPress={() => void run(useCloudCalendarCopies)}
					>
						{t('useCloudCopies')}
					</Button>
				</>
			)}
			{mode === 'logout' && (
				<>
					<Text className="text-label">{t('pendingWarning')}</Text>
					{pending > 0 && (
						<Button
							disabled={busy}
							onPress={() => void run(() => leave(mode, true))}
						>
							{t('syncAndSignOut')}
						</Button>
					)}
					<Button
						variant="secondary"
						disabled={busy}
						onPress={() => void run(() => leave(mode))}
					>
						{pending ? t('discardAndSignOut') : t('confirmSignOut')}
					</Button>
				</>
			)}
			{mode === 'delete' && (
				<>
					<Text className="text-notification">{t('deleteWarning')}</Text>
					<Button
						disabled={busy}
						onPress={() => void run(() => leave('delete'))}
					>
						{t('confirmDelete')}
					</Button>
				</>
			)}
			{!!mode && (
				<Button
					variant="secondary"
					disabled={busy}
					onPress={() => setMode(null)}
				>
					{t('cancel')}
				</Button>
			)}
			{!!error && (
				<Text className="text-notification" accessibilityRole="alert">
					{error}
				</Text>
			)}
		</View>
	)
}
