import { createContext } from 'react'
import type { ClickedMapElement, SearchResult } from '@/types/map'

interface MapContextType {
	clickedElement: ClickedMapElement | null
	setClickedElement: (value: ClickedMapElement | null) => void
	currentFloor: { floor: string; manual: boolean } | null
	setCurrentFloor: (value: { floor: string; manual: boolean }) => void
	searchHistory: SearchResult[]
	updateSearchHistory: (value: SearchResult[]) => void
}

export const MapContext = createContext<MapContextType>({
	clickedElement: null,
	setClickedElement: () => {
		throw new Error('setClickedElement must be overridden')
	},

	currentFloor: null,
	setCurrentFloor: () => {
		throw new Error('setCurrentFloor must be overridden')
	},

	searchHistory: [],
	updateSearchHistory: () => {
		throw new Error('updateSearchHistory must be overridden')
	}
})
