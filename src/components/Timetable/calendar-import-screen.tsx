import SegmentedControl from '@expo/ui/community/segmented-control'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
	ActivityIndicator,
	Alert,
	Platform,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	View
} from 'react-native'
import { useCSSVariable, useUniwind } from 'uniwind'
import {
	fetchCalendarText,
	normalizeCalendarUrl
} from '@/api/calendar-import-api'
import FormList from '@/components/Universal/form-list'
import PlatformIcon, { type LucideIcon } from '@/components/Universal/icon'
import { getDefaultDashboardOrder, moveCardToTop } from '@/contexts/dashboard'
import { useFeatureFlags } from '@/contexts/feature-flags'
import { useUserKind } from '@/contexts/userKind'
import { useDashboardOrderStore } from '@/hooks/useDashboardOrderStore'
import { useImportedCalendarStore } from '@/hooks/useImportedCalendarStore'
import type { FormListSections } from '@/types/components'
import type {
	CalendarPreview,
	CalendarSnapshot,
	ImportedOccurrence
} from '@/types/imported-calendar'
import type { MaterialIcon } from '@/types/material-icons'
import { beginCalendarMutation } from '@/utils/account-mutation'
import { pickCalendarFile } from '@/utils/calendar-file-picker'
import {
	deleteCalendarLink,
	loadCalendarLink,
	saveCalendarLink
} from '@/utils/calendar-link-storage'
import { calendarUpdate } from '@/utils/calendar-update'
import { expandCalendar, parseCalendar } from '@/utils/ical-import'
import { accountProfileStorage } from '@/utils/storage'
import { toColor } from '@/utils/uniwind-utils'

export default function CalendarImportScreen(): React.JSX.Element {
	const { t, i18n } = useTranslation('timetable')
	const calendars = useImportedCalendarStore((s) => s.calendars)
	const upsertStore = useImportedCalendarStore((s) => s.upsert)
	const profile = accountProfileStorage.getProfile()
	const profileGeneration = accountProfileStorage.getGeneration()
	const { userKind } = useUserKind()
	const flags = useFeatureFlags()
	const upsert = (calendar: CalendarSnapshot) => {
		if (
			accountProfileStorage.getProfile() !== profile ||
			accountProfileStorage.getGeneration() !== profileGeneration
		)
			throw new Error('calendarStorageFailed')
		const first = useImportedCalendarStore.getState().calendars.length === 0
		upsertStore(calendar)
		// The first calendar puts its "Up Next" card at the top of the dashboard, once.
		if (first) {
			const order = useDashboardOrderStore.getState()
			order.setShown(
				moveCardToTop(
					order.shown ?? getDefaultDashboardOrder(userKind, flags).shown,
					'login'
				)
			)
		}
	}
	const remove = useImportedCalendarStore((s) => s.remove)
	const notificationColor = String(
		toColor(useCSSVariable('--color-notification')) ?? '#ff3b30'
	)
	const textColor = String(toColor(useCSSVariable('--color-text')) ?? '#000000')
	const placeholderColor = String(
		toColor(useCSSVariable('--color-label-tertiary')) ?? '#8e8e93'
	)
	const [url, setUrl] = useState('')
	const [source, setSource] = useState<'link' | 'file'>('link')
	const [file, setFile] = useState<{ name: string; text: string } | null>(null)
	const isDark = useUniwind().theme === 'dark'
	const [name, setName] = useState('')
	const [replacement, setReplacement] = useState<string | null>(null)
	const [draft, setDraft] = useState<{
		preview: CalendarPreview
		name: string
		url?: string
		events: ImportedOccurrence[]
	} | null>(null)
	const [busy, setBusy] = useState(false)
	const [error, setError] = useState('')
	const work = async (action: () => Promise<void>) => {
		const finishMutation = beginCalendarMutation()
		setBusy(true)
		setError('')
		try {
			await action()
		} catch (e) {
			const code = e instanceof Error ? e.message : ''
			setError(
				code === 'calendarTooLarge'
					? t('import.tooLarge')
					: code === 'calendarStorageFailed'
						? t('import.storageFailed')
						: t('import.failed')
			)
		} finally {
			finishMutation()
			setBusy(false)
		}
	}
	const chooseFile = () =>
		work(async () => {
			const picked = await pickCalendarFile()
			if (picked) {
				setFile(picked)
				setDraft(null)
			}
		})
	const loadFile = () =>
		work(async () => {
			if (!file) return
			prepareDraft(parseCalendar(file.text), file.name.replace(/\.ics$/i, ''))
		})
	const loadLink = () =>
		work(async () => {
			const normalized = normalizeCalendarUrl(url)
			prepareDraft(
				parseCalendar(await fetchCalendarText(normalized)),
				name || t('import.defaultName'),
				normalized
			)
		})
	const confirm = () =>
		work(async () => {
			if (!draft) return
			const id =
				replacement ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
			if (draft.url) await saveCalendarLink(id, draft.url)
			else if (replacement) await deleteCalendarLink(id)
			upsert({
				...draft.preview,
				id,
				name: name || draft.name,
				sourceType: draft.url ? 'link' : 'file',
				updatedAt: new Date().toISOString()
			})
			setDraft(null)
			setReplacement(null)
			setUrl('')
			setFile(null)
			setName('')
		})
	function prepareDraft(
		preview: CalendarPreview,
		draftName: string,
		link?: string
	) {
		const events = expandCalendar(
			{
				...preview,
				id: 'preview',
				name: draftName,
				sourceType: 'file',
				updatedAt: ''
			},
			new Date(Date.now() - 30 * 86400000),
			new Date(Date.now() + 180 * 86400000)
		).slice(0, 10)
		setDraft({ preview, name: draftName, url: link, events })
	}
	const previewEvents = draft?.events ?? []
	const dateTime = new Intl.DateTimeFormat(i18n.language, {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	})
	const eventDay = new Intl.DateTimeFormat(i18n.language, {
		weekday: 'short',
		day: 'numeric',
		month: 'short'
	})
	const eventTime = new Intl.DateTimeFormat(i18n.language, {
		hour: '2-digit',
		minute: '2-digit'
	})
	const formatDate = (value: string) => dateTime.format(new Date(value))
	const formatOccurrence = (e: ImportedOccurrence) => {
		if (e.allDay) {
			const [y, m, d] = e.start.slice(0, 10).split('-').map(Number)
			return t('import.allDayDate', {
				date: eventDay.format(new Date(y, m - 1, d))
			})
		}
		const start = new Date(e.start)
		const end = new Date(e.end)
		return `${eventDay.format(start)} · ${eventTime.format(start)}–${eventTime.format(end)}`
	}
	const replacingCalendar = calendars.find((c) => c.id === replacement)
	const cancelReplacement = () => {
		setReplacement(null)
		setName('')
		setDraft(null)
	}
	const refreshLink = (calendar: CalendarSnapshot) =>
		work(async () => {
			const link = await loadCalendarLink(calendar.id)
			if (!link) throw new Error('calendarStorageFailed')
			const preview = parseCalendar(await fetchCalendarText(link))
			expandCalendar(
				{ ...calendar, ...preview },
				new Date(Date.now() - 30 * 86400000),
				new Date(Date.now() + 180 * 86400000)
			)
			upsert(calendarUpdate(calendar, preview, new Date().toISOString()))
		})
	const confirmRemove = (calendar: CalendarSnapshot) => {
		const removeConfirmed = () =>
			void work(async () => {
				await deleteCalendarLink(calendar.id)
				remove(calendar.id)
				if (replacement === calendar.id) setReplacement(null)
			})
		if (Platform.OS === 'web') {
			if (window.confirm(t('import.removeConfirm', { name: calendar.name })))
				removeConfirmed()
			return
		}
		Alert.alert(t('import.remove'), calendar.name, [
			{ text: t('import.cancel'), style: 'cancel' },
			{
				text: t('import.remove'),
				style: 'destructive',
				onPress: removeConfirmed
			}
		])
	}

	const labelClassName = 'text-text text-base w-[72px]'
	const inputClassName =
		'text-text text-base flex-1 py-1.5 px-2.5 border-hairline border-input-border rounded-base'
	const helpText =
		source === 'link' ? t('import.helpLink') : t('import.helpFile')
	const addSections: FormListSections[] = [
		{
			header: replacingCalendar
				? t('import.replaceTitle', { name: replacingCalendar.name })
				: t('import.addTitle'),
			footer: helpText,
			item: (
				<View>
					<SegmentedControl
						testID="calendar-import-source"
						accessibilityLabel={t('import.source')}
						values={[t('import.sourceLink'), t('import.sourceFile')]}
						selectedIndex={source === 'link' ? 0 : 1}
						onChange={(event) => {
							setSource(
								event.nativeEvent.selectedSegmentIndex === 0 ? 'link' : 'file'
							)
							setDraft(null)
							setError('')
						}}
						enabled={!busy}
						appearance={isDark ? 'dark' : 'light'}
						style={{ marginBottom: 12 }}
					/>
					<View className="flex-row items-center">
						<Text className={labelClassName}>{t('import.nameLabel')}</Text>
						<TextInput
							testID="calendar-import-name"
							accessibilityLabel={t('import.name')}
							placeholder={t('import.namePlaceholder')}
							placeholderTextColor={placeholderColor}
							value={name}
							onChangeText={setName}
							returnKeyType="next"
							className={inputClassName}
						/>
					</View>
					<View className="h-hairline bg-border my-2 ml-[72px]" />
					{source === 'link' ? (
						<View className="flex-row items-center">
							<Text className={labelClassName}>{t('import.linkLabel')}</Text>
							<TextInput
								testID="calendar-import-link"
								accessibilityLabel={t('import.link')}
								placeholder="https:// · webcal://"
								placeholderTextColor={placeholderColor}
								value={url}
								onChangeText={(value) => {
									setUrl(value)
									setDraft(null)
								}}
								autoCapitalize="none"
								autoCorrect={false}
								keyboardType="url"
								returnKeyType="go"
								onSubmitEditing={() => {
									if (url && !busy) void loadLink()
								}}
								className={inputClassName}
							/>
						</View>
					) : (
						<Pressable
							testID="calendar-import-choose-file"
							accessibilityRole="button"
							accessibilityLabel={t('import.file')}
							accessibilityValue={{ text: file?.name }}
							disabled={busy}
							onPress={() => void chooseFile()}
							className="flex-row items-center active:opacity-60"
						>
							<Text className={labelClassName}>{t('import.fileLabel')}</Text>
							<Text
								numberOfLines={1}
								className="text-base flex-1 py-1.5 mr-2"
								style={{ color: file ? textColor : placeholderColor }}
							>
								{file?.name ?? t('import.fileChoose')}
							</Text>
							<PlatformIcon
								ios={{ name: 'doc.badge.plus', size: 17 }}
								android={{ name: 'upload_file', size: 20 }}
								web={{ name: 'FileUp', size: 18 }}
								style={{ color: placeholderColor }}
							/>
						</Pressable>
					)}
				</View>
			)
		},
		{
			items: [
				{
					testID: 'calendar-import-continue',
					title: t('import.continue'),
					icon: {
						ios: 'arrow.right.circle',
						android: 'arrow_forward',
						web: 'ArrowRight'
					},
					disabled: busy || (source === 'link' ? !url : !file),
					hideChevron: true,
					customComponent:
						busy && !draft ? () => <ActivityIndicator /> : undefined,
					onPress: () => void (source === 'link' ? loadLink() : loadFile())
				},
				...(replacingCalendar
					? [
							{
								title: t('import.cancelReplace'),
								icon: {
									ios: 'xmark',
									android: 'close' as MaterialIcon,
									web: 'X' as LucideIcon
								},
								disabled: busy,
								hideChevron: true,
								onPress: cancelReplacement
							}
						]
					: [])
			]
		}
	]
	const previewSections: FormListSections[] = draft
		? [
				{
					header: t('import.previewTitle', {
						count: draft.preview.eventCount
					}),
					footer: t('import.previewRange'),
					...(previewEvents.length
						? {
								items: previewEvents.map((e) => ({
									title: e.title || t('import.untitled'),
									value: [formatOccurrence(e), e.location]
										.filter(Boolean)
										.join(' · '),
									layout: 'column' as const
								}))
							}
						: { item: t('import.previewEmpty') })
				},
				{
					items: [
						{
							testID: 'calendar-import-confirm',
							title: replacingCalendar
								? t('import.confirmReplace')
								: t('import.confirm'),
							icon: {
								ios: 'checkmark.circle',
								android: 'check_circle',
								web: 'CircleCheck'
							},
							disabled: busy,
							hideChevron: true,
							customComponent: busy ? () => <ActivityIndicator /> : undefined,
							onPress: () => void confirm()
						},
						{
							title: t('import.cancel'),
							icon: { ios: 'xmark', android: 'close', web: 'X' },
							disabled: busy,
							hideChevron: true,
							onPress: () => setDraft(null)
						}
					]
				}
			]
		: []
	const calendarSections: FormListSections[] = calendars.length
		? calendars.map((calendar, index) => ({
				header: index === 0 ? t('import.yourCalendars') : undefined,
				footer:
					calendar.sourceType === 'file' ? t('import.fileRefresh') : undefined,
				items: [
					{
						title: calendar.name,
						value: t(
							calendar.sourceType === 'link'
								? 'import.kindLinkUpdated'
								: 'import.kindFileUpdated',
							{ date: formatDate(calendar.updatedAt) }
						),
						layout: 'column' as const,
						icon:
							calendar.sourceType === 'link'
								? { ios: 'link', android: 'link', web: 'Link' }
								: { ios: 'doc.text', android: 'description', web: 'FileText' }
					},
					...(calendar.sourceType === 'link'
						? [
								{
									title: t('import.refresh'),
									icon: {
										ios: 'arrow.clockwise',
										android: 'refresh' as MaterialIcon,
										web: 'RefreshCw' as LucideIcon
									},
									disabled: busy,
									hideChevron: true,
									onPress: () => void refreshLink(calendar)
								}
							]
						: []),
					{
						title: t('import.replace'),
						icon: {
							ios: 'arrow.triangle.2.circlepath',
							android: 'swap_horiz',
							web: 'Replace'
						},
						disabled: busy || replacement === calendar.id,
						hideChevron: true,
						onPress: () => {
							setReplacement(calendar.id)
							setName(calendar.name)
							setSource(calendar.sourceType === 'link' ? 'link' : 'file')
							setDraft(null)
						}
					},
					{
						title: t('import.remove'),
						icon: { ios: 'trash', android: 'delete', web: 'Trash' },
						iconColor: notificationColor,
						disabled: busy,
						hideChevron: true,
						onPress: () => confirmRemove(calendar)
					}
				]
			}))
		: [{ header: t('import.yourCalendars'), item: t('import.empty') }]

	return (
		<ScrollView
			testID="calendar-import-screen"
			className="flex-1 bg-background"
			contentInsetAdjustmentBehavior="automatic"
			keyboardShouldPersistTaps="handled"
			showsVerticalScrollIndicator={false}
			contentContainerClassName="px-page pt-4 pb-10 gap-6 w-full max-w-[600px] self-center"
		>
			<FormList sections={addSections} />
			{error !== '' && (
				<View
					accessibilityRole="alert"
					className="flex-row gap-3 bg-card ios:rounded-ios android:rounded-md web:rounded-md border-hairline border-border shadow-card px-4 py-3"
				>
					<PlatformIcon
						ios={{ name: 'exclamationmark.triangle', size: 17 }}
						android={{ name: 'error', size: 20 }}
						web={{ name: 'TriangleAlert', size: 18 }}
						style={{ color: notificationColor }}
					/>
					<Text className="text-text text-sm flex-1">{error}</Text>
				</View>
			)}
			{draft && <FormList sections={previewSections} />}
			<FormList sections={calendarSections} />
		</ScrollView>
	)
}
