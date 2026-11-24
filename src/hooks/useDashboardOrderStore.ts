import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { zustandStorage } from '@/utils/storage'

interface State {
	shown: string[] | undefined
	/** Cards already added once to a customised layout (see introduceNewCards). */
	introduced: string[]
	setShown: (shown: string[]) => void
	setIntroduced: (introduced: string[]) => void
}
export const useDashboardOrderStore = create<State>()(
	persist(
		(set) => ({
			shown: undefined,
			introduced: [],
			setShown: (shown) => set({ shown }),
			setIntroduced: (introduced) => set({ introduced })
		}),
		{
			name: 'dashboard-order-storage',
			storage: createJSONStorage(() => zustandStorage)
		}
	)
)
