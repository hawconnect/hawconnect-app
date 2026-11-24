import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { CalendarSnapshot } from '@/types/imported-calendar'
import { replaceCalendar } from '@/utils/imported-calendar-utils'
import { zustandStorage } from '@/utils/storage'

export interface ImportedCalendarStore {
	calendars: CalendarSnapshot[]
	upsert: (calendar: CalendarSnapshot) => void
	remove: (id: string) => void
}

export function createImportedCalendarStore(
	storage = zustandStorage,
	name = 'hawconnect-imported-calendars-v1'
) {
	return create<ImportedCalendarStore>()(
		persist(
			(set) => ({
				calendars: [],
				upsert: (next) =>
					set((state) => ({
						calendars: replaceCalendar(state.calendars, next)
					})),
				remove: (id) =>
					set((state) => ({
						calendars: state.calendars.filter((c) => c.id !== id)
					}))
			}),
			{ name, storage: createJSONStorage(() => storage) }
		)
	)
}

export const useImportedCalendarStore = createImportedCalendarStore()
