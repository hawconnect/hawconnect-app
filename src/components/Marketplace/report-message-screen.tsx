import { useLocalSearchParams } from 'expo-router'
import type React from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, Text } from 'react-native'
import { reportErrorKey } from '@/utils/marketplace-card'
import { errorCodeOf } from '@/utils/marketplace-form'
import { errorText } from './market-labels'
import { InlineMessage } from './market-ui'
import { ReportForm } from './report-sheet'
import { MarketplaceGate } from './sign-in-gate'

/** Codes after which retrying the same link cannot work. */
const FINAL = new Set(['PostUnavailable', 'AlreadyReported'])

function ReportMessage(): React.JSX.Element {
	const { t } = useTranslation('marketplace')
	// The token lives only in the route param and the API call.
	const { token } = useLocalSearchParams<{ token: string }>()
	const [outcome, setOutcome] = useState<
		{ kind: 'done' } | { kind: 'final'; key: string } | null
	>(null)
	let body: React.JSX.Element
	if (outcome?.kind === 'done')
		body = (
			<InlineMessage
				tone="success"
				text={t('marketplace.report.messageSuccess')}
			/>
		)
	else if (outcome?.kind === 'final')
		body = <InlineMessage text={errorText(t, outcome.key)} />
	else if (!token)
		body = <InlineMessage text={t('marketplace.report.linkExpired')} />
	else
		body = (
			<ReportForm
				target={{ token }}
				intro={t('marketplace.report.messageIntro')}
				onError={(error) => {
					const key = reportErrorKey(error)
					if (FINAL.has(errorCodeOf(error) ?? ''))
						setOutcome({ kind: 'final', key })
					return key
				}}
				onReported={() => setOutcome({ kind: 'done' })}
			/>
		)
	return (
		<ScrollView
			testID="marketplace-report-message"
			className="flex-1 bg-background"
			contentInsetAdjustmentBehavior="automatic"
			contentContainerClassName="px-page pt-4 pb-10 gap-4 w-full max-w-[600px] self-center"
		>
			<Text accessibilityRole="header" className="text-text text-xl font-bold">
				{t('marketplace.report.messageTitle')}
			</Text>
			{body}
		</ScrollView>
	)
}

export default function ReportMessageScreen(): React.JSX.Element {
	const { token } = useLocalSearchParams<{ token: string }>()
	return (
		<MarketplaceGate
			returnPath={token ? `/marketplace/report/${token}` : undefined}
		>
			<ReportMessage />
		</MarketplaceGate>
	)
}
