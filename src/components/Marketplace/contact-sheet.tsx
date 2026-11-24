import type React from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Text, TextInput, View } from 'react-native'
import { useCSSVariable } from 'uniwind'
import type { AccountAPIError } from '@/api/account-api'
import Button from '@/components/Universal/button'
import { useContactPoster } from '@/hooks/useMarketplace'
import {
	MESSAGE_MAX,
	MESSAGE_MIN,
	marketErrorMessageKey,
	messageLengthValid
} from '@/utils/marketplace-form'
import { toColor } from '@/utils/uniwind-utils'
import { errorText } from './market-labels'
import { InlineMessage, MarketSheet } from './market-ui'

interface ContactSheetProps {
	postId: string
	visible: boolean
	onClose: () => void
	onSent: () => void
}

export function ContactSheet({
	postId,
	visible,
	onClose,
	onSent
}: ContactSheetProps): React.JSX.Element {
	const { t } = useTranslation('marketplace')
	const contact = useContactPoster()
	const [message, setMessage] = useState('')
	const [error, setError] = useState('')
	const placeholder = String(
		toColor(useCSSVariable('--color-label-tertiary')) ?? '#8e8e93'
	)
	const length = message.trim().length
	const close = () => {
		setError('')
		onClose()
	}
	const send = () => {
		if (!messageLengthValid(message)) {
			setError(t('marketplace.contact.tooShort', { min: MESSAGE_MIN }))
			return
		}
		setError('')
		contact.mutate(
			{ id: postId, message: message.trim() },
			{
				onSuccess: () => {
					setMessage('')
					onSent()
				},
				onError: (e) =>
					setError(
						(e as AccountAPIError).code === 'MailUnavailable'
							? t('marketplace.contact.mailUnavailable')
							: errorText(t, marketErrorMessageKey(e))
					)
			}
		)
	}
	return (
		<MarketSheet
			testID="marketplace-contact-sheet"
			visible={visible}
			title={t('marketplace.contact.title')}
			onClose={close}
		>
			<View className="gap-4">
				<Text className="text-label text-sm">
					{t('marketplace.contact.intro')}{' '}
					{t('marketplace.contact.addressShared')}
				</Text>
				<View className="bg-card ios:rounded-ios android:rounded-md web:rounded-md border-hairline border-input-border shadow-card px-4 py-3">
					<TextInput
						testID="marketplace-contact-message"
						accessibilityLabel={t('marketplace.contact.placeholder')}
						placeholder={t('marketplace.contact.placeholder')}
						placeholderTextColor={placeholder}
						value={message}
						onChangeText={setMessage}
						maxLength={MESSAGE_MAX}
						multiline
						textAlignVertical="top"
						className="text-text text-base min-h-[140px]"
					/>
				</View>
				<Text className="text-label-secondary text-xs text-right">
					{t('marketplace.contact.counter', {
						count: length,
						max: MESSAGE_MAX
					})}
				</Text>
				{error !== '' && <InlineMessage text={error} />}
				<Button
					testID="marketplace-contact-send"
					onPress={send}
					loading={contact.isPending}
					disabled={contact.isPending || length < MESSAGE_MIN}
				>
					{t('marketplace.contact.send')}
				</Button>
			</View>
		</MarketSheet>
	)
}
