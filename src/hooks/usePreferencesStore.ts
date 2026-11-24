import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { defaultQuicklinks } from '@/data/constants'
import {
	migrateStoredThemeColor,
	normalizeThemeColor,
	type ThemeColor
} from '@/styles/theme-colors'
import {
	type InterfaceFont,
	normalizeInterfaceFont
} from '@/utils/interface-font'
import { normalizePreferenceKey } from '@/utils/legacy-preferences'
import { zustandStorage } from '@/utils/storage'

export type { ThemeColor }

interface PreferencesStore {
	theme: string
	themeColor: ThemeColor
	interfaceFont: InterfaceFont
	language: 'de' | 'en' | undefined
	recentQuicklinks: string[]
	autoShowNextDay: boolean
	autoShowNextDayTimeMinutes: number
	setTheme: (theme: string) => void
	setThemeColor: (color: ThemeColor) => void
	setInterfaceFont: (font: InterfaceFont) => void
	setLanguage: (language: 'en' | 'de') => void
	addRecentQuicklink: (quicklink: string) => void
	setAutoShowNextDay: (show: boolean) => void
	setAutoShowNextDayTimeMinutes: (minutes: number) => void
	reset: () => void
}

const initialState: Omit<
	PreferencesStore,
	| 'setTheme'
	| 'setThemeColor'
	| 'setInterfaceFont'
	| 'addRecentQuicklink'
	| 'reset'
	| 'setLanguage'
	| 'setAutoShowNextDay'
	| 'setAutoShowNextDayTimeMinutes'
> = {
	language: undefined,
	theme: 'auto',
	themeColor: 'default',
	interfaceFont: 'default',
	recentQuicklinks: defaultQuicklinks,
	autoShowNextDay: false,
	autoShowNextDayTimeMinutes: 18 * 60
}

export const usePreferencesStore = create<PreferencesStore>()(
	persist(
		(set) => ({
			...initialState,
			setTheme: (theme: string) => {
				set({ theme })
			},
			setThemeColor: (themeColor: ThemeColor) => {
				set({ themeColor })
			},
			setInterfaceFont: (interfaceFont: InterfaceFont) => {
				set({ interfaceFont })
			},
			setLanguage: (language: 'de' | 'en') => {
				set({ language })
			},
			addRecentQuicklink: (quicklink: string) => {
				set((state) => {
					const existingQuicklinks = state.recentQuicklinks ?? []
					const updatedQuicklinks = [quicklink, ...existingQuicklinks].map(
						normalizePreferenceKey
					)
					const uniqueQuicklinks = Array.from(new Set(updatedQuicklinks))
					const neededQuicklinks = 3 - uniqueQuicklinks.length
					const additionalQuicklinks =
						neededQuicklinks > 0
							? defaultQuicklinks
									.filter((link) => !uniqueQuicklinks.includes(link))
									.slice(0, neededQuicklinks)
							: []

					const finalQuicklinks = [
						...uniqueQuicklinks,
						...additionalQuicklinks
					].slice(0, 3)
					return { recentQuicklinks: finalQuicklinks }
				})
			},
			setAutoShowNextDay: (autoShowNextDay: boolean) => {
				set({ autoShowNextDay })
			},
			setAutoShowNextDayTimeMinutes: (autoShowNextDayTimeMinutes: number) => {
				set({ autoShowNextDayTimeMinutes })
			},
			reset: () => {
				set(initialState)
				zustandStorage.removeItem('app-storage')
			}
		}),
		{
			name: 'app-storage',
			storage: createJSONStorage(() => zustandStorage),
			version: 1,
			// Version 0 stored the old default accent as `blue`.
			migrate: (persisted, version) => {
				const state = (persisted ?? {}) as Partial<PreferencesStore>
				return {
					...state,
					themeColor: migrateStoredThemeColor(state.themeColor, version)
				} as PreferencesStore
			},
			// Older versions stored retired accents such as `purple`.
			merge: (persisted, current) => {
				const state = {
					...current,
					...(persisted as Partial<PreferencesStore>)
				}
				return {
					...state,
					themeColor: normalizeThemeColor(state.themeColor),
					interfaceFont: normalizeInterfaceFont(state.interfaceFont)
				}
			}
		}
	)
)
