import type { FeatureCollection } from 'geojson'
import { useMemo } from 'react'
import { sortFloors } from '@/utils/map-constants'
import { filterEtage } from '@/utils/map-screen-utils'

interface UseMapGeoJsonFiltersOptions {
	mapOverlay: FeatureCollection | undefined
	allRooms: FeatureCollection
	currentFloor: { floor: string; manual: boolean } | null
}

export function useMapGeoJsonFilters({
	mapOverlay,
	allRooms,
	currentFloor
}: UseMapGeoJsonFiltersOptions): {
	uniqueEtages: string[]
	filteredGeoJSON: FeatureCollection | undefined
} {
	const floor = currentFloor?.floor ?? 'EG'

	const uniqueEtages = useMemo(
		() =>
			sortFloors(
				Array.from(
					new Set(
						allRooms.features
							.map((room) => {
								const ebene = room.properties?.Ebene
								return typeof ebene === 'string' ? ebene : ''
							})
							.filter((etage) => etage !== '')
					)
				)
			),
		[allRooms]
	)

	const filteredGeoJSON = useMemo(() => {
		if (mapOverlay == null) {
			return undefined
		}
		return {
			...mapOverlay,
			features: allRooms.features.filter(
				(feature) =>
					feature.properties?.campusId ||
					filterEtage(floor, { type: 'FeatureCollection', features: [feature] })
						.length > 0
			)
		}
	}, [allRooms, floor, mapOverlay])

	return {
		uniqueEtages,
		filteredGeoJSON
	}
}
