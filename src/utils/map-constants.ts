import type { MapCoordinate } from '@/types/map'

export const MAP_CAMERA = {
	initialZoom: 10.2,
	focusZoom: 15.8,
	minZoom: 8,
	maxZoom: 19,
	focusPaddingGap: 12,
	resetDuration: 400,
	focusDuration: 500
} as const

/** Fallback map centre: Campus Berliner Tor (same point as in haw-campuses). */
export const HAW_HAMBURG_CENTER: MapCoordinate = [10.0215785, 53.5564215]

/** The overlay's location value, shown as sent. */
export function formatCampusLocation(standort: unknown): string | undefined {
	if (typeof standort !== 'string' || standort.length === 0) {
		return undefined
	}
	return standort
}
export const FLOOR_ORDER = ['4', '3', '2', '1.5', '1', 'EG', '-1'] as const
export const FLOOR_SUBSTITUTES: Record<string, string> = {
	0: 'EG',
	0.5: '1.5',
	1: '1',
	2: '2',
	3: '3',
	4: '4'
}

function getFloorLevel(floor: string): number {
	if (floor === 'EG') {
		return 0
	}
	const parsed = Number.parseFloat(floor.replace(',', '.'))
	return Number.isFinite(parsed) ? parsed : Number.NaN
}

/** +1 going to a higher floor, -1 going lower, 0 if the levels match or are unknown. */
export function getFloorSlideDirection(
	fromFloor: string,
	toFloor: string
): number {
	const from = getFloorLevel(fromFloor)
	const to = getFloorLevel(toFloor)
	if (!Number.isFinite(from) || !Number.isFinite(to) || from === to) {
		return 0
	}
	return to > from ? 1 : -1
}

export function sortFloors(floors: string[]): string[] {
	return [...floors].sort((a, b) => {
		const aIndex = FLOOR_ORDER.indexOf(a as (typeof FLOOR_ORDER)[number])
		const bIndex = FLOOR_ORDER.indexOf(b as (typeof FLOOR_ORDER)[number])
		const aSortIndex = aIndex === -1 ? FLOOR_ORDER.length : aIndex
		const bSortIndex = bIndex === -1 ? FLOOR_ORDER.length : bIndex

		return aSortIndex === bSortIndex
			? a.localeCompare(b)
			: aSortIndex - bSortIndex
	})
}

export function getBuildingCodes(values: unknown[]): string[] {
	return Array.from(
		new Set(
			values.filter(
				(value): value is string =>
					typeof value === 'string' && value.length > 0
			)
		)
	).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}
