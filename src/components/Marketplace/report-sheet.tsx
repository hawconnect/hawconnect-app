import type React from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TextInput, View } from 'react-native'
import { useCSSVariable } from 'uniwind'
import type { MarketReportReason } from '@/api/marketplace-api'
import Button from '@/components/Universal/button'
import FormList from '@/components/Universal/form-list'
import { useReportPost } from '@/hooks/useMarketplace'
import {
	marketErrorMessageKey,
	REPORT_NOTE_MAX
} from '@/utils/marketplace-form'
import { toColor } from '@/utils/uniwind-utils'
import { errorText, REASONS } from './market-labels'
import { InlineMessage, MarketSheet } from './market-ui'

export type ReportTarget = { id: string } | { token: string }

interface ReportFormProps {
	target: ReportTarget
	/** Replaces the default "this post" wording (used for message reports). */
	intro?: string
	/** Maps a failure to its translation key (default: the generic mapping). */
	onError?: (error: unknown) => string
	onReported: () => void
}

/** Reason list, optional note and Send; shared by the sheet and the message page. */
export function ReportForm({
	target,
	intro,
	onError,
	onReported
}: ReportFormProps): React.JSX.Element {
	const { t } = useTranslation('marketplace')
	const report = useReportPost()
	const [reason, setReason] = useState<MarketReportReason | null>(null)
	const [note, setNote] = useState('')
	const [error, setError] = useState('')
	const primary = toColor(useCSSVariable('--color-primary'))
	const placeholder = String(
		toColor(useCSSVariable('--color-label-tertiary')) ?? '#8e8e93'
	)
	const send = () => {
		if (!reason) return
		setError('')
		report.mutate(
			{ ...target, input: { reason, note: note.trim() || null } },
			{
				onSuccess: () => {
					setReason(null)
					setNote('')
					onReported()
				},
				onError: (e) =>
					setError(
						errorText(t, onError ? onError(e) : marketErrorMessageKey(e))
					)
			}
		)
	}
	return (
		<View className="gap-4">
			<FormList
				sections={[
					{
						header: intro ?? t('marketplace.report.intro'),
						items: REASONS.map((key) => ({
							testID: `marketplace-report-reason-${key}`,
							title: t(`marketplace.report.reasons.${key}`),
							accessibilityHint: t('marketplace.report.reason'),
							hideChevron: true,
							onPress: () => setReason(key),
							icon:
								reason === key
									? {
											ios: 'checkmark',
											android: 'check' as const,
											web: 'Check' as const,
											endIcon: true
										}
									: undefined,
							iconColor: primary,
							textColor: reason === key ? primary : undefined
						}))
					},
					{
						header: t('marketplace.report.note'),
						item: (
							<TextInput
								testID="marketplace-report-note"
								accessibilityLabel={t('marketplace.report.note')}
								placeholder={t('marketplace.report.notePlaceholder')}
								placeholderTextColor={placeholder}
								value={note}
								onChangeText={setNote}
								maxLength={REPORT_NOTE_MAX}
								multiline
								textAlignVertical="top"
								className="text-text text-base min-h-[80px] px-2.5 py-2 border-hairline border-input-border rounded-base"
							/>
						)
					}
				]}
			/>
			{error !== '' && <InlineMessage text={error} />}
			<Button
				testID="marketplace-report-send"
				onPress={send}
				loading={report.isPending}
				disabled={report.isPending || reason == null}
			>
				{t('marketplace.report.send')}
			</Button>
		</View>
	)
}

interface ReportSheetProps {
	postId: string
	visible: boolean
	onClose: () => void
	onReported: () => void
}

export function ReportSheet({
	postId,
	visible,
	onClose,
	onReported
}: ReportSheetProps): React.JSX.Element {
	const { t } = useTranslation('marketplace')
	return (
		<MarketSheet
			testID="marketplace-report-sheet"
			visible={visible}
			title={t('marketplace.report.title')}
			onClose={onClose}
		>
			<ReportForm target={{ id: postId }} onReported={onReported} />
		</MarketSheet>
	)
}
