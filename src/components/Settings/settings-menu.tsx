import { trackEvent } from '@aptabase/react-native'
import { useRouter } from 'expo-router'
import type React from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Linking, Platform, Share } from 'react-native'
import { useUniwind } from 'uniwind'
import ThemeMenu from '@/components/Settings/theme-menu'
import type { ThemeMenuOption } from '@/components/Settings/theme-menu.types'
import FormList from '@/components/Universal/form-list'
import type { LucideIcon } from '@/components/Universal/icon'
import { projectLinks } from '@/data/project-links'
import {
	type ThemeColor,
	usePreferencesStore
} from '@/hooks/usePreferencesStore'
import {
	accentColorFor,
	normalizeThemeColor,
	themeColors
} from '@/styles/theme-colors'
import type { FormListSections } from '@/types/components'
import type { MaterialIcon } from '@/types/material-icons'
import { interfaceFonts, normalizeInterfaceFont } from '@/utils/interface-font'
import { copyToClipboard } from '@/utils/ui-utils'

export default function SettingsMenu(): React.JSX.Element {
	const router = useRouter()
	const { t, i18n } = useTranslation(['settings'])
	const setLanguage = usePreferencesStore((state) => state.setLanguage)
	const theme = usePreferencesStore((state) => state.theme)
	const setTheme = usePreferencesStore((state) => state.setTheme)
	const themeColor = usePreferencesStore((state) => state.themeColor)
	const setThemeColor = usePreferencesStore((state) => state.setThemeColor)
	const interfaceFont = usePreferencesStore((state) => state.interfaceFont)
	const setInterfaceFont = usePreferencesStore(
		(state) => state.setInterfaceFont
	)
	const isDark = useUniwind().theme === 'dark'

	const appearanceOptions: ThemeMenuOption[] = [
		{
			key: 'auto',
			title: t('theme.themes.default'),
			icon: {
				ios: { name: 'desktopcomputer', size: 17 },
				android: { name: 'desktop_windows', size: 20 },
				web: { name: 'Monitor', size: 18 }
			}
		},
		{
			key: 'light',
			title: t('theme.themes.light'),
			icon: {
				ios: { name: 'sun.max', size: 17 },
				android: { name: 'light_mode', size: 20 },
				web: { name: 'Sun', size: 18 }
			}
		},
		{
			key: 'dark',
			title: t('theme.themes.dark'),
			icon: {
				ios: { name: 'moon', size: 17 },
				android: { name: 'dark_mode', size: 20 },
				web: { name: 'Moon', size: 18 }
			}
		}
	]
	const fontOptions = interfaceFonts.map((font) => ({
		key: font,
		title: t(`theme.fonts.${font}`)
	}))
	const accentOptions = themeColors.map((color) => ({
		key: color,
		title:
			color === 'mono'
				? t(isDark ? 'theme.accent.white' : 'theme.accent.black')
				: t(`theme.accent.${color}`),
		color: accentColorFor(color, isDark)
	}))

	const languageAlert = (): void => {
		const newLocale = i18n.language === 'en' ? 'de' : 'en'
		if (Platform.OS === 'web') {
			if (!window.confirm(t('menu.formlist.language.message'))) {
				/* empty */
			} else {
				setLanguage(newLocale)
				void i18n.changeLanguage(newLocale)
			}
		} else {
			Alert.alert(
				t('menu.formlist.language.title'),
				t('menu.formlist.language.message'),
				[
					{
						text: t('profile.logout.alert.cancel'),
						style: 'default'
					},
					{
						text: t('menu.formlist.language.confirm'),
						style: 'destructive',
						onPress: () => {
							setLanguage(newLocale)
							void i18n.changeLanguage(newLocale)
						}
					}
				]
			)
		}
	}

	const sections: FormListSections[] = [
		{
			header: t('menu.formlist.preferences.title'),
			items: [
				{
					testID: 'settings-dashboard-link',
					title: t('menu.formlist.preferences.dashboard'),
					icon: {
						ios: 'rectangle.stack',
						android: 'dashboard_customize',
						web: 'LayoutDashboard'
					},
					onPress: () => {
						router.navigate('/dashboard')
					}
				},
				{
					testID: 'settings-food-preferences-link',
					title: t('menu.formlist.preferences.food'),
					icon: {
						android: 'restaurant',
						ios: 'fork.knife',
						web: 'Utensils'
					},
					onPress: () => {
						router.navigate('/food-preferences')
					}
				},
				{
					title: t('menu.formlist.preferences.timetable'),
					icon: { ios: 'calendar', android: 'event', web: 'Calendar' },
					onPress: () => router.navigate('/timetable-settings')
				},
				{
					title: t('menu.formlist.preferences.language'),
					icon: {
						ios: 'character.bubble',
						android: 'language',
						web: 'Languages'
					},
					onPress: async () => {
						if (
							Platform.OS === 'ios' ||
							(Platform.OS === 'android' && Platform.Version >= 33)
						) {
							await Linking.openSettings()
						} else {
							languageAlert()
						}
					}
				}
			]
		},
		{
			header: t('menu.formlist.appearance.title'),
			items: [
				{
					title: t('menu.formlist.appearance.appearance'),
					icon: isDark
						? { ios: 'moon', android: 'dark_mode', web: 'Moon' }
						: { ios: 'sun.max', android: 'light_mode', web: 'Sun' },
					customComponent: () => (
						<ThemeMenu
							testID="settings-appearance-menu"
							accessibilityLabel={t('menu.formlist.appearance.appearance')}
							options={appearanceOptions}
							selected={theme ?? 'auto'}
							onSelect={setTheme}
						/>
					)
				},
				{
					title: t('menu.formlist.appearance.accent'),
					icon: { ios: 'paintpalette', android: 'palette', web: 'Palette' },
					customComponent: () => (
						<ThemeMenu
							testID="settings-accent-menu"
							accessibilityLabel={t('menu.formlist.appearance.accent')}
							options={accentOptions}
							selected={normalizeThemeColor(themeColor)}
							onSelect={(key) => setThemeColor(key as ThemeColor)}
						/>
					)
				},
				{
					title: t('menu.formlist.appearance.font'),
					icon: { ios: 'textformat', android: 'text_fields', web: 'Type' },
					customComponent: () => (
						<ThemeMenu
							testID="settings-font-menu"
							accessibilityLabel={t('menu.formlist.appearance.font')}
							options={fontOptions}
							selected={normalizeInterfaceFont(interfaceFont)}
							onSelect={(key) => setInterfaceFont(normalizeInterfaceFont(key))}
						/>
					)
				}
			]
		},
		{
			header: t('menu.formlist.legal.title'),
			items: [
				{
					testID: 'settings-about-link',
					title: t('menu.formlist.legal.about'),
					icon: {
						ios: 'info.circle',
						android: 'info',
						web: 'Info'
					},
					onPress: () => {
						router.navigate('/about')
					}
				},
				{
					testID: 'settings-feedback-link',
					title: t('menu.formlist.legal.feedback'),
					icon: { ios: 'envelope', android: 'mail', web: 'Mail' },
					onPress: () => {
						const address = projectLinks.feedbackEmail
						Linking.openURL(
							`mailto:${address}?subject=${encodeURIComponent(
								t('menu.formlist.legal.feedbackSubject')
							)}`
						).catch(() => {
							// No mail app: show the address so it can be written to by hand.
							const message = t('menu.formlist.legal.feedbackNoMail', {
								email: address
							})
							if (Platform.OS === 'web') window.alert(message)
							else Alert.alert(t('menu.formlist.legal.feedback'), message)
						})
					}
				},
				{
					testID: 'settings-share-link',
					title: t('menu.formlist.legal.share'),
					icon: {
						ios: 'square.and.arrow.up',
						android: 'share',
						web: 'Share'
					},
					onPress: () => {
						trackEvent('Share', { type: 'app' })

						const message =
							Platform.OS === 'ios'
								? t('menu.formlist.legal.shareMessage', {
										url: projectLinks.website
									})
								: t('menu.formlist.legal.shareMessageAndroid', {
										url: projectLinks.website
									})

						if (Platform.OS === 'web') {
							void copyToClipboard(message)
							return
						}

						void Share.share({
							url: projectLinks.website || undefined,
							message
						})
					}
				},
				...(Platform.OS === 'web' && projectLinks.download
					? [
							{
								title: t('menu.formlist.legal.download'),
								icon: {
									ios: 'square.and.arrow.up',
									android: 'share' as MaterialIcon,
									web: 'Download' as LucideIcon
								},
								onPress: () => {
									void Linking.openURL(projectLinks.download)
								}
							}
						]
					: [])
			]
		}
	]

	return <FormList sections={sections} />
}
