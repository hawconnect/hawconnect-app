import { useRouter } from 'expo-router'
import type React from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, ScrollView, View } from 'react-native'
import FormList from '@/components/Universal/form-list'
import { useTransparentHeaderPadding } from '@/hooks/useTransparentHeader'
import type { FormListSections } from '@/types/components'
import { type LegalPage, legalUrl } from '@/utils/legal-links'

export default function Legal(): React.JSX.Element {
	const router = useRouter()
	const { t, i18n } = useTranslation(['settings', 'account'])
	const headerPadding = useTransparentHeaderPadding()
	const sections: FormListSections[] = [
		{
			header: t('about.formlist.legal.title'),
			items: [
				...(
					[
						{ key: 'privacy', title: t('legal.formlist.legal.privacy') },
						{ key: 'imprint', title: t('legal.formlist.legal.imprint') },
						{ key: 'terms', title: t('legal.formlist.legal.terms') }
					] as { key: LegalPage; title: string }[]
				).map((item) => ({
					testID: `legal-${item.key}-link`,
					title: item.title,
					icon:
						item.key === 'privacy'
							? {
									ios: 'lock.shield' as const,
									android: 'shield_lock' as const,
									web: 'ShieldCheck' as const
								}
							: {
									ios: 'doc.text' as const,
									android: 'description' as const,
									web: 'FileText' as const
								},
					// Legal pages live on hawconnect.de and open in the browser.
					onPress: async () => {
						await Linking.openURL(legalUrl(item.key, i18n.language))
					}
				})),
				{
					testID: 'legal-licenses-link',
					title: t('navigation.licenses.title', { ns: 'navigation' }),
					icon: { ios: 'shield', android: 'shield', web: 'Shield' },
					onPress: () => router.navigate('/licenses')
				}
			]
		}
	]
	return (
		<ScrollView
			testID="legal-screen"
			contentContainerClassName="pb-bottom-safe w-full max-w-[700px] self-center"
			style={{ paddingTop: headerPadding }}
		>
			<View className="self-center mt-2.5 px-page w-full gap-3">
				<FormList sections={sections} />
			</View>
		</ScrollView>
	)
}
