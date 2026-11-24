import { create } from 'zustand'
import type { FriendlyTimetableEntry } from '@/types/utils'

interface RouteParamsStore {
	selectedLecture: FriendlyTimetableEntry | undefined
	setSelectedLecture: (selectedLecture: FriendlyTimetableEntry) => void
}

const useRouteParamsStore = create<RouteParamsStore>((set) => ({
	selectedLecture: undefined,
	setSelectedLecture: (selectedLecture: FriendlyTimetableEntry) => {
		set({ selectedLecture })
	}
}))

export default useRouteParamsStore
