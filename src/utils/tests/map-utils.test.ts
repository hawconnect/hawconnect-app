import { beforeAll, describe, expect, it, mock } from 'bun:test'
import { SEARCH_TYPES } from '@/types/map'
import { reactNativePlatform, reactNativeShareMock } from './react-native-mock'

const UTILS_ROOT = new URL('../', import.meta.url).pathname

const trackEventMock = mock(() => {})
const clipboardSetStringAsyncMock = mock(async () => {})

mock.module(`${UTILS_ROOT}../localization/i18n.ts`, () => ({
	default: { language: 'de' }
}))

mock.module('expo-localization', () => ({
	getLocales: () => [{ languageCode: 'de' }]
}))

mock.module('react-i18next', () => ({
	initReactI18next: {}
}))

mock.module('@aptabase/react-native', () => ({
	trackEvent: trackEventMock
}))

mock.module('expo-clipboard', () => ({
	setStringAsync: clipboardSetStringAsyncMock
}))

mock.module('burnt', () => ({
	toast: () => {}
}))

mock.module('i18next', () => ({
	t: (key: string) => key
}))

let mapUtils: typeof import('../map-utils')

beforeAll(async () => {
	mapUtils = await import('../map-utils')
})

describe('map-utils', () => {
	it('getCenter - Should calculate the average center across rooms', () => {
		const rooms = [
			[
				[
					[0, 0],
					[2, 0],
					[2, 2],
					[0, 2]
				]
			],
			[
				[
					[2, 2],
					[4, 2],
					[4, 4],
					[2, 4]
				]
			]
		]
		const center = mapUtils.getCenter(rooms as never)
		expect(center[0]).toBe(2)
		expect(center[1]).toBe(2)
	})

	it('getCenterSingle - Should fall back to the HAW Hamburg center when coordinates are missing', () => {
		expect(mapUtils.getCenterSingle(undefined)).toEqual(
			mapUtils.HAW_HAMBURG_CENTER
		)
		expect(mapUtils.getCenterSingle([])).toEqual(mapUtils.HAW_HAMBURG_CENTER)
		expect(mapUtils.getCenterSingle([[]])).toEqual(mapUtils.HAW_HAMBURG_CENTER)
	})

	it('getCenterSingle - Should calculate the center of one polygon', () => {
		const center = mapUtils.getCenterSingle([
			[
				[0, 0],
				[2, 0],
				[2, 2],
				[0, 2]
			]
		])
		expect(center[0]).toBe(1)
		expect(center[1]).toBe(1)
	})

	it('getPolygonArea - Should return the shoelace area of the outer ring', () => {
		expect(
			mapUtils.getPolygonArea([
				[
					[0, 0],
					[2, 0],
					[2, 2],
					[0, 2],
					[0, 0]
				]
			])
		).toBe(4)
		expect(mapUtils.getPolygonArea(undefined)).toBe(0)
		expect(mapUtils.getPolygonArea([[]])).toBe(0)
		expect(
			mapUtils.getPolygonArea([
				[
					[0, 0],
					['1', 0],
					[2, 2],
					[0, 2],
					[0, 0]
				]
			] as never)
		).toBe(0)
	})

	it('getFloorSlideDirection - Should treat higher floors as an upward elevator', () => {
		expect(mapUtils.getFloorSlideDirection('1', '2')).toBe(1)
		expect(mapUtils.getFloorSlideDirection('2', '1')).toBe(-1)
		expect(mapUtils.getFloorSlideDirection('EG', '1')).toBe(1)
		expect(mapUtils.getFloorSlideDirection('1', 'EG')).toBe(-1)
		expect(mapUtils.getFloorSlideDirection('1', '1')).toBe(0)
	})

	it('sortFloors - Should keep known floors ordered without mutating the input', () => {
		const floors = ['EG', '5', '1', '4']
		expect(mapUtils.sortFloors(floors)).toEqual(['4', '1', 'EG', '5'])
		expect(floors).toEqual(['EG', '5', '1', '4'])
	})

	it('getBuildingCodes - Should deduplicate and sort building codes', () => {
		expect(mapUtils.getBuildingCodes(['C', 'BN', 'A', 'C', 'S'])).toEqual([
			'A',
			'BN',
			'C',
			'S'
		])
	})

	it('getIcon - Should return the building icon for building search types', () => {
		expect(mapUtils.getIcon(SEARCH_TYPES.BUILDING)).toEqual({
			ios: 'building',
			android: 'corporate_fare'
		})
	})

	it('getIcon - Should return the PC icon for PC rooms', () => {
		expect(
			mapUtils.getIcon(SEARCH_TYPES.ROOM, {
				result: {
					item: { properties: { Funktion_en: 'PC Lab', Raum: 'B101' } }
				}
			})
		).toEqual({ ios: 'pc', android: 'keyboard' })
	})

	it('getIcon - Should return the lab icon for laboratory rooms', () => {
		expect(
			mapUtils.getIcon(SEARCH_TYPES.ROOM, {
				result: {
					item: {
						properties: { Funktion_en: 'Experimental Laboratory', Raum: 'B102' }
					}
				}
			})
		).toEqual({ ios: 'flask', android: 'science' })
	})

	it('getIcon - Should return the food icon for canteen rooms', () => {
		expect(
			mapUtils.getIcon(SEARCH_TYPES.ROOM, {
				result: {
					item: { properties: { Funktion_en: 'Cafeteria', Raum: 'M001' } }
				}
			})
		).toEqual({ ios: 'fork.knife', android: 'local_cafe' })
	})

	it('getIcon - Should return the office icon for office rooms', () => {
		expect(
			mapUtils.getIcon(SEARCH_TYPES.ROOM, {
				result: {
					item: { properties: { Funktion_en: 'Office', Raum: 'G215' } }
				}
			})
		).toEqual({ ios: 'lamp.desk', android: 'business_center' })
	})

	it('getIcon - Should return the toilet icon for toilet rooms', () => {
		expect(
			mapUtils.getIcon(SEARCH_TYPES.ROOM, {
				result: {
					item: { properties: { Funktion_en: 'Toilet', Raum: 'G001' } }
				}
			})
		).toEqual({ ios: 'toilet', android: 'wc' })
	})

	it('getIcon - Should return the lecture icon for lecture rooms', () => {
		expect(
			mapUtils.getIcon(SEARCH_TYPES.ROOM, {
				result: {
					item: { properties: { Funktion_en: 'Lecture Hall', Raum: 'G001' } }
				}
			})
		).toEqual({ ios: 'studentdesk', android: 'school' })
	})

	it('getIcon - Should return the lecture icon for seminar rooms', () => {
		expect(
			mapUtils.getIcon(SEARCH_TYPES.ROOM, {
				result: {
					item: { properties: { Funktion_en: 'Seminar room', Raum: 'G002' } }
				}
			})
		).toEqual({ ios: 'studentdesk', android: 'school' })
	})

	it('getIcon - Should return the corridor icon for corridor rooms', () => {
		expect(
			mapUtils.getIcon(SEARCH_TYPES.ROOM, {
				result: {
					item: {
						properties: { Funktion_en: 'Corridor Section', Raum: 'G002' }
					}
				}
			})
		).toEqual({
			ios: 'arrow.triangle.turn.up.right.diamond',
			android: 'directions'
		})
	})

	it('getIcon - Should fall back to the default room icon when no match exists', () => {
		expect(
			mapUtils.getIcon(SEARCH_TYPES.ROOM, {
				result: { item: { properties: { Funktion_en: '', Raum: 'X101' } } }
			})
		).toEqual({ ios: 'mappin', android: 'location_on' })
	})

	it('getIcon - Should fall back to the default icon for unknown search types', () => {
		expect(mapUtils.getIcon(SEARCH_TYPES.LECTURE)).toEqual({
			ios: 'mappin',
			android: 'location_on'
		})
	})

	it('handleShareModal - Should copy the room link on web', () => {
		reactNativePlatform.OS = 'web'
		trackEventMock.mockReset()
		clipboardSetStringAsyncMock.mockReset()

		mapUtils.handleShareModal('G101')

		expect(trackEventMock).toHaveBeenCalledWith('Share', { type: 'room' })
		expect(clipboardSetStringAsyncMock).toHaveBeenCalledWith(
			'hawconnect:/map/?room=G101'
		)

		reactNativePlatform.OS = 'web'
	})

	it('handleShareModal - Should use the native share sheet off web', () => {
		reactNativePlatform.OS = 'ios'
		reactNativeShareMock.mockReset()

		mapUtils.handleShareModal('H201')

		expect(reactNativeShareMock).toHaveBeenCalledWith({
			url: 'hawconnect:/map/?room=H201'
		})

		reactNativePlatform.OS = 'web'
	})

	it('handleShareModal - Should share via message on Android', () => {
		reactNativePlatform.OS = 'android'
		reactNativeShareMock.mockReset()

		mapUtils.handleShareModal('A101')

		expect(reactNativeShareMock).toHaveBeenCalledWith({
			message: 'hawconnect:/map/?room=A101'
		})

		reactNativePlatform.OS = 'web'
	})
})
