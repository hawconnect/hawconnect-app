import type { Feature, GeoJsonProperties } from 'geojson'

export type MapCoordinate = [number, number]

export enum SEARCH_TYPES {
	BUILDING = 0,
	ROOM = 1,
	LECTURE = 2
}
export interface RoomData {
	title: string
	subtitle: string
	properties: GeoJsonProperties | undefined
	/** Buildings only: how many rooms the building has. */
	occupancies: BuildingOccupancy | null
	type: SEARCH_TYPES
}

export interface BuildingOccupancy {
	total: number
}
export interface ClickedMapElement {
	type: SEARCH_TYPES
	data: string
	center?: MapCoordinate
	manual?: boolean
}

export type MapSelectionOrigin = 'MapClick' | 'InAppLink' | 'Search'

export interface SelectMapElementOptions {
	room: string
	type: SEARCH_TYPES
	center?: MapCoordinate
	origin: MapSelectionOrigin
	manual: boolean
	floor?: string
}

export type SelectMapElement = (options: SelectMapElementOptions) => void

export interface SearchResult {
	title: string
	subtitle: string
	isExactMatch?: boolean
	item: Feature
}
