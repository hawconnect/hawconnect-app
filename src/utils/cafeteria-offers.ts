/**
 * Tabler icon for each offer key the backend reads from a Studierendenwerk
 * location page. Unknown offers (a slug of their title) get a neutral icon.
 */
import type { WebIconName } from './tabler-icons'

export interface OfferIcon {
	ios: string
	android: string
	web: WebIconName
}

export const OFFER_ICONS: Record<string, OfferIcon> = {
	breakfast: { ios: 'cup.and.saucer', android: 'egg_alt', web: 'Egg' },
	'hot-dishes': { ios: 'flame', android: 'soup_kitchen', web: 'Soup' },
	'warm-snacks': {
		ios: 'flame',
		android: 'local_fire_department',
		web: 'Flame'
	},
	'happy-hour': { ios: 'percent', android: 'percent', web: 'BadgePercent' },
	seats: { ios: 'chair', android: 'chair', web: 'Armchair' },
	highchairs: {
		ios: 'figure.and.child.holdinghands',
		android: 'child_care',
		web: 'Baby'
	},
	'barrier-free': {
		ios: 'figure.roll',
		android: 'accessible',
		web: 'Accessibility'
	},
	'pasta-bar': {
		ios: 'fork.knife',
		android: 'ramen_dining',
		web: 'CookingPot'
	},
	'salad-bar': { ios: 'leaf', android: 'eco', web: 'Salad' },
	'vegetable-bar': { ios: 'carrot', android: 'nutrition', web: 'Carrot' },
	pizza: { ios: 'fork.knife', android: 'local_pizza', web: 'Pizza' }
}

export const OFFER_FALLBACK_ICON: OfferIcon = {
	ios: 'fork.knife',
	android: 'restaurant',
	web: 'Utensils'
}

export function offerIcon(key: string): OfferIcon {
	return Object.hasOwn(OFFER_ICONS, key)
		? OFFER_ICONS[key]
		: OFFER_FALLBACK_ICON
}
