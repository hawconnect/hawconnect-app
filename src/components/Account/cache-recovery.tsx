import { useTranslation } from 'react-i18next'
import { Text, View } from 'react-native'

export default function AccountCacheRecovery(): React.JSX.Element {
	const { t } = useTranslation('account')
	return (
		<View>
			<Text className="text-label">{t('recoveryUnavailable')}</Text>
		</View>
	)
}
