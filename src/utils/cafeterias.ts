/**
 * Helpers for the "Cafés & mensas" pages: grouping by campus, the hours shown
 * on a card, and the map and directions links.
 */

import {
	type OpeningLine,
	type OpenState,
	openState,
	todayLines
} from './cafeteria-hours'
import { findHawCampus } from './haw-campus-map'

/** The backend's allow-list ids, which are also the food restaurant ids. */
export const CAFETERIA_IDS = [
	'BerlinerTorMensa',
	'BerlinerTorCafe',
	'BlueberryCafe',
	'AlexanderstrasseCafe',
	'BergedorfMensa',
	'FinkenauMensa',
	'FinkenauCafe'
] as const

export function isCafeteriaId(id: string | null | undefined): boolean {
	return (CAFETERIA_IDS as readonly string[]).includes(id ?? '')
}

const CAMPUS_ORDER = ['Berliner Tor', 'Bergedorf', 'Finkenau']

/** Places grouped by campus, in campus order, keeping each group's order. */
export function groupByCampus<T extends { campus: string }>(
	places: T[]
): { campus: string; places: T[] }[] {
	const rank = (campus: string) => {
		const index = CAMPUS_ORDER.indexOf(campus)
		return index === -1 ? CAMPUS_ORDER.length : index
	}
	const groups: { campus: string; places: T[] }[] = []
	for (const place of places) {
		const group = groups.find((entry) => entry.campus === place.campus)
		if (group) group.places.push(place)
		else groups.push({ campus: place.campus, places: [place] })
	}
	return groups.sort((a, b) => rank(a.campus) - rank(b.campus))
}

/**
 * What a list card shows for today: the open/closed hint and the lines.
 * When any line could not be parsed the state is unknown, so the published
 * lines are shown as they are, without a hint.
 */
export function cardHours(
	general: OpeningLine[],
	now: Date
): { state: OpenState; lines: { days: string; time: string }[] } {
	const state = openState(general, now)
	if (state === 'unknown') {
		return {
			state,
			lines: general.map(({ days, time }) => ({ days, time }))
		}
	}
	return { state, lines: todayLines(general, now) }
}

/**
 * The map `room` for a place: its own map entry (`foodRestaurantLocations`)
 * when there is one, else its campus. Undefined when neither is on the map.
 */
export function cafeteriaMapRoom(
	id: string,
	campus: string,
	locations: Record<string, string>
): string | undefined {
	return locations[id] ?? findHawCampus(campus)?.label
}

/**
 * The map link for a place, with the room (its map entry or campus label)
 * always set. Undefined when there is nothing to show on the map.
 */
export function cafeteriaMapHref(
	id: string,
	campus: string,
	locations: Record<string, string>
): { pathname: '/(tabs)/map'; params: { room: string } } | undefined {
	const room = cafeteriaMapRoom(id, campus, locations)
	if (room == null || room === '') return undefined
	return { pathname: '/(tabs)/map', params: { room } }
}

/**
 * The restaurant selection with `id` in it, so "Today's menu" shows that
 * place. Returns the same list when it is already selected.
 */
export function selectionWithRestaurant(
	selected: string[],
	id: string
): string[] {
	return selected.includes(id) ? selected : [...selected, id]
}

/** Walking directions to an address in Apple Maps (iOS) or Google Maps. */
export function directionsUrl(address: string[], ios: boolean): string {
	const destination = encodeURIComponent(address.join(', '))
	return ios
		? `https://maps.apple.com/?daddr=${destination}&dirflg=w`
		: `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=walking`
}
