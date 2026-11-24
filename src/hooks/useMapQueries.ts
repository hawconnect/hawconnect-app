import type { FeatureCollection } from 'geojson'
import { useMemo } from 'react'
import { hawMapLabelFeatures } from '@/utils/haw-campus-map'
import { useMapOverlayQuery } from './useMapOverlayQuery'

/** HAW public campus data: rooms and building labels, no university login. */
export function useMapQueries() {
	const { data, error } = useMapOverlayQuery()
	const allRooms = useMemo<FeatureCollection>(
		() => data ?? { type: 'FeatureCollection', features: [] },
		[data]
	)
	return {
		mapOverlay: data,
		overlayError: error,
		allRooms,
		buildingGeoJSON: hawMapLabelFeatures(allRooms)
	}
}
