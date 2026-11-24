import { t } from 'i18next'
import { Linking, Platform } from 'react-native'
import { HAW_LOCATIONS_URL } from '@/data/haw-campuses'
import i18n from '@/localization/i18n'
import type { FormListSections, SectionGroup } from '@/types/components'
import {
	type BuildingOccupancy,
	type RoomData,
	SEARCH_TYPES
} from '@/types/map'
import { findHawCampus } from '@/utils/haw-campus-map'
import { formatCampusLocation } from '@/utils/map-constants'
import { parseMapCoordinate } from '@/utils/map-screen-utils'

/** A facility line from the campus plan, or a unit with its offices listed under it. */
type PdfListingEntry = string | { title: string; items: string[] }

const listingItem = (entry: PdfListingEntry): SectionGroup =>
	typeof entry === 'string'
		? { title: entry }
		: { title: entry.title, value: entry.items.join('\n'), layout: 'column' }

/**
 * Formats the content of the room details section
 * @param {RoomData} roomData - Data for the room
 * @returns {FormListSections[]}
 * */
export const modalSection = (roomData: RoomData): FormListSections[] => {
	const roomTypeKey = i18n.language === 'de' ? 'Funktion_de' : 'Funktion_en'
	const campus = findHawCampus(String(roomData.properties?.campusLabel ?? ''))
	if (campus) {
		const [lon, lat] =
			parseMapCoordinate(roomData.properties?.center) ?? campus.coordinates
		const directions =
			Platform.OS === 'ios'
				? `https://maps.apple.com/?daddr=${lat},${lon}&dirflg=w`
				: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=walking`
		return [
			...(Array.isArray(roomData.properties?.pdfListing)
				? [
						{
							header: t(
								roomData.properties?.listingScope === 'campus'
									? 'pages.map.haw.campusListing'
									: 'pages.map.haw.buildingListing',
								{ ns: 'common' }
							),
							items: (roomData.properties.pdfListing as PdfListingEntry[]).map(
								listingItem
							)
						}
					]
				: []),
			{
				items: [
					{
						testID: 'map-campus-directions',
						title: t('pages.map.haw.directions', { ns: 'common' }),
						icon: {
							ios: 'arrow.triangle.turn.up.right.diamond',
							android: 'directions',
							web: 'Navigation'
						},
						onPress: async () => {
							await Linking.openURL(directions)
						}
					},
					{
						testID: 'map-campus-pdf',
						title: t('pages.map.haw.pdf', { ns: 'common' }),
						icon: { ios: 'map', android: 'map', web: 'Map' },
						onPress: async () => {
							await Linking.openURL(campus.mapPDF)
						}
					},
					{
						testID: 'map-campus-source',
						title: t('pages.map.haw.source', { ns: 'common' }),
						icon: { ios: 'globe', android: 'language', web: 'Globe' },
						onPress: async () => {
							await Linking.openURL(
								HAW_LOCATIONS_URL[i18n.language === 'de' ? 'de' : 'en']
							)
						}
					}
				]
			}
		]
	}

	if (roomData.type === SEARCH_TYPES.ROOM && roomData.properties != null) {
		return [
			{
				header: t('pages.map.details.room.details', {
					ns: 'common'
				}),
				items: [
					{
						title: t('pages.map.details.room.building', {
							ns: 'common'
						}),
						value:
							roomData.properties?.Gebaeude ??
							t('misc.unknown', { ns: 'common' })
					},
					{
						title: t('pages.map.details.room.floor', {
							ns: 'common'
						}),
						value:
							roomData.properties?.Ebene ?? t('misc.unknown', { ns: 'common' })
					},
					{
						title: t('pages.map.details.room.type', {
							ns: 'common'
						}),
						value:
							roomData.properties?.[roomTypeKey] ??
							t('misc.unknown', { ns: 'common' })
					},
					{
						title: t('labels.campus', { ns: 'common' }),
						value:
							formatCampusLocation(roomData.properties?.Standort) ??
							t('misc.unknown', { ns: 'common' })
					}
				]
			}
		]
	}
	if (
		roomData.type === SEARCH_TYPES.BUILDING &&
		roomData.properties != null &&
		roomData.occupancies != null
	) {
		const occupancies = roomData.occupancies as BuildingOccupancy
		const properties: RoomData['properties'] = roomData.properties
		return [
			{
				header: t('pages.map.details.room.details', { ns: 'common' }),
				items: [
					{
						title: t('pages.map.details.building.total', {
							ns: 'common'
						}),
						value:
							occupancies.total.toString() ??
							t('misc.unknown', { ns: 'common' })
					},
					{
						title: t('pages.map.details.building.floors', {
							ns: 'common'
						}),
						value:
							(properties.Etage as string | null)?.toString() ??
							t('misc.unknown', { ns: 'common' })
					},
					{
						title: t('labels.campus', { ns: 'common' }),
						value:
							formatCampusLocation(properties.Standort) ??
							t('misc.unknown', { ns: 'common' })
					}
				]
			}
		]
	}

	return []
}
