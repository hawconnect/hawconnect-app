import type React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, Text, View } from 'react-native'
import AccountControls from '@/components/Account/account-controls'
import { contentColumn } from '@/components/Layout/content-column'
import { appVersionLabel } from '@/utils/app-version'
import SettingsMenu from './settings-menu'

export default function Settings(): React.JSX.Element {
	const { t } = useTranslation('settings')
	return (
		<ScrollView
			testID="settings-screen"
			showsVerticalScrollIndicator={false}
			contentInsetAdjustmentBehavior="automatic"
			contentContainerClassName="pb-[60px]"
		>
			<View className="px-3" style={contentColumn(760)}>
				<AccountControls>
					<View className="my-4 mt-3">
						<SettingsMenu />
					</View>
					<Text
						testID="settings-version"
						className="text-label-tertiary text-xs text-center"
					>
						{t('about.header.version', { version: appVersionLabel() })}
					</Text>
				</AccountControls>
			</View>
		</ScrollView>
	)
}
