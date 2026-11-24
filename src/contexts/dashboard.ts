import { useCallback, useEffect, useMemo } from 'react'
import { useMMKVObject } from 'react-native-mmkv'
import { AllCards, type Card } from '@/components/all-cards'
import { USER_GUEST } from '@/data/constants'
import { useDashboardOrderStore } from '@/hooks/useDashboardOrderStore'
import type { FeatureFlagState } from '@/lib/feature-flags'
import { arraysEqual } from '@/utils/app-utils'
import { normalizePreferenceKey } from '@/utils/legacy-preferences'

import { useFeatureFlags } from './feature-flags'
import { useUserKind } from './userKind'

interface DashboardOrder {
	shown: string[]
	unavailable: string[]
}

const cardByKey = new Map(AllCards.map((card) => [card.key, card]))

const cardEntries = AllCards.map((card, index) => ({
	card,
	index,
	allowedRoles: new Set(card.allowed),
	initialRoles: new Set(card.initial)
}))

function buildKeyIndex(keys: string[]): Map<string, number> {
	return new Map(keys.map((key, index) => [key, index]))
}

export function isCardEnabled(
	card: Pick<Card, 'featureFlag'>,
	flags: FeatureFlagState
): boolean {
	if (card.featureFlag == null) {
		return true
	}

	return flags[card.featureFlag] === true
}

export function isCardKeyEnabled(
	cardKey: string,
	flags: FeatureFlagState
): boolean {
	const card = cardByKey.get(cardKey)
	if (card == null) {
		return false
	}

	return isCardEnabled(card, flags)
}

export function normalizeShownDashboardEntries(
	shownEntries: string[],
	flags: FeatureFlagState
): string[] {
	const knownCardKeys = new Set(AllCards.map((card) => card.key))
	const normalized: string[] = []

	for (const storedKey of shownEntries) {
		const key =
			storedKey === 'sports' ? 'clubs' : normalizePreferenceKey(storedKey)
		if (!knownCardKeys.has(key)) {
			continue
		}
		if (!isCardKeyEnabled(key, flags)) {
			continue
		}
		if (!normalized.includes(key)) normalized.push(key)
	}

	return normalized
}

export function resolveDashboardCards(keys: string[]): Card[] {
	return keys.flatMap((key) => {
		const card = cardByKey.get(key)
		return card == null ? [] : [card]
	})
}

/**
 * Puts a card the user shows first, keeping the rest in order. A card the
 * user doesn't show is never added.
 */
export function moveCardToTop(shown: string[], key: string): string[] {
	if (!shown.includes(key)) return shown
	return [key, ...shown.filter((entry) => entry !== key)]
}

export function getDefaultDashboardOrder(
	userKind: string | undefined,
	flags: FeatureFlagState
): DashboardOrder {
	const userRole = userKind ?? USER_GUEST

	const shown: string[] = []
	const unavailable: string[] = []

	for (const { card, allowedRoles, initialRoles } of cardEntries) {
		if (!isCardEnabled(card, flags)) {
			continue
		}

		if (allowedRoles.has(userRole)) {
			if (initialRoles.has(userRole)) {
				shown.push(card.key)
			}
		} else if (card.stillVisible ?? true) {
			unavailable.push(card.key)
		}
	}

	return { shown, unavailable }
}

/**
 * Where a card belongs in a customised order: right after the nearest
 * earlier card (by AllCards order) the user shows, else before the nearest later one.
 */
function insertionIndex(
	cardIndex: number,
	keyIndex: Map<string, number>,
	length: number
): number {
	for (let index = cardIndex - 1; index >= 0; index--) {
		const anchorIndex = keyIndex.get(cardEntries[index].card.key)
		if (anchorIndex !== undefined) return anchorIndex + 1
	}
	for (let index = cardIndex + 1; index < cardEntries.length; index++) {
		const anchorIndex = keyIndex.get(cardEntries[index].card.key)
		if (anchorIndex !== undefined) return anchorIndex
	}
	return length
}

/**
 * Adds cards marked `addToSavedLayouts` to an existing customised dashboard
 * exactly once. `introduced` remembers them, so a card the user later removes
 * is not added again. Returns null when nothing changes.
 */
export function introduceNewCards(
	shownEntries: string[],
	introduced: string[],
	userKind: string | undefined
): { shown: string[]; introduced: string[] } | null {
	const userRole = userKind ?? USER_GUEST
	const shown = [...shownEntries]
	const seen = new Set(introduced)
	let changed = false
	for (const { card, index, allowedRoles, initialRoles } of cardEntries) {
		if (card.addToSavedLayouts !== true || seen.has(card.key)) continue
		if (!allowedRoles.has(userRole) || !initialRoles.has(userRole)) continue
		if (!shown.includes(card.key))
			shown.splice(
				insertionIndex(index, buildKeyIndex(shown), shown.length),
				0,
				card.key
			)
		seen.add(card.key)
		changed = true
	}
	return changed ? { shown, introduced: [...seen] } : null
}

/**
 * Inserts newly enabled feature-flagged cards into a customized dashboard order.
 * Placement follows {@link AllCards} order relative to cards the user already shows.
 */
export function mergeNewFlaggedCardsIntoDashboard(
	shownEntries: string[],
	userKind: string | undefined,
	flags: FeatureFlagState
): string[] {
	const userRole = userKind ?? USER_GUEST
	const merged = [...shownEntries]
	const mergedKeys = new Set(merged)
	let keyIndex = buildKeyIndex(merged)

	for (const {
		card,
		index: cardIndex,
		allowedRoles,
		initialRoles
	} of cardEntries) {
		if (card.featureFlag == null || !isCardEnabled(card, flags)) {
			continue
		}
		if (!allowedRoles.has(userRole) || !initialRoles.has(userRole)) {
			continue
		}
		if (mergedKeys.has(card.key)) {
			continue
		}

		const insertAt = insertionIndex(cardIndex, keyIndex, merged.length)
		merged.splice(insertAt, 0, card.key)
		mergedKeys.add(card.key)
		keyIndex = buildKeyIndex(merged)
	}

	return merged
}

export function syncDashboardEntriesWithFlags(
	shownDashboardEntries: string[],
	userKind: string | undefined,
	flags: FeatureFlagState
): string[] | null {
	const merged = mergeNewFlaggedCardsIntoDashboard(
		shownDashboardEntries,
		userKind,
		flags
	)

	return arraysEqual(merged, shownDashboardEntries) ? null : merged
}

export interface Dashboard {
	shownDashboardEntries: Card[]
	hiddenAnnouncements: string[]
	hideAnnouncement: (id: string) => void
	resetOrder: (userKind: string) => void
	updateDashboardOrder: (shown: string[]) => void
}

export function useDashboard(): Dashboard {
	const shownDashboardEntries = useDashboardOrderStore((state) => state.shown)
	const setShownDashboardEntries = useDashboardOrderStore(
		(state) => state.setShown
	)
	const introducedCards = useDashboardOrderStore((state) => state.introduced)
	const setIntroducedCards = useDashboardOrderStore(
		(state) => state.setIntroduced
	)
	const [hiddenAnnouncements, setHiddenAnnouncements] = useMMKVObject<string[]>(
		'hiddenAnnouncements'
	)
	const { userKind = USER_GUEST } = useUserKind()
	const flags = useFeatureFlags()

	const defaultEntries = useMemo(
		() => getDefaultDashboardOrder(userKind, flags),
		[userKind, flags]
	)

	useEffect(() => {
		if (shownDashboardEntries == null) {
			return
		}

		const merged = syncDashboardEntriesWithFlags(
			shownDashboardEntries,
			userKind,
			flags
		)

		if (merged != null) {
			setShownDashboardEntries(merged)
		}
	}, [shownDashboardEntries, userKind, flags, setShownDashboardEntries])

	useEffect(() => {
		const introduced = introducedCards ?? []
		if (shownDashboardEntries == null) {
			// The default layout already includes new cards; remember them so a
			// later customisation that removes one is respected.
			const pending = AllCards.filter(
				(card) =>
					card.addToSavedLayouts === true && !introduced.includes(card.key)
			).map((card) => card.key)
			if (pending.length) setIntroducedCards([...introduced, ...pending])
			return
		}
		const next = introduceNewCards(shownDashboardEntries, introduced, userKind)
		if (next != null) {
			setShownDashboardEntries(next.shown)
			setIntroducedCards(next.introduced)
		}
	}, [
		shownDashboardEntries,
		introducedCards,
		userKind,
		setShownDashboardEntries,
		setIntroducedCards
	])

	const normalizedShownEntries = useMemo(() => {
		const fallback = defaultEntries.shown
		const shownEntries = shownDashboardEntries ?? fallback

		return normalizeShownDashboardEntries(shownEntries, flags)
	}, [shownDashboardEntries, defaultEntries.shown, flags])

	const entries = useMemo(
		() => resolveDashboardCards(normalizedShownEntries),
		[normalizedShownEntries]
	)

	const updateDashboardOrder = useCallback(
		(entries: string[]) => {
			setShownDashboardEntries(entries)
		},
		[setShownDashboardEntries]
	)

	const hideAnnouncement = useCallback(
		(id: string) => {
			setHiddenAnnouncements((prev) => {
				const newHiddenAnnouncements = new Set(prev ?? [])
				newHiddenAnnouncements.add(id)
				return Array.from(newHiddenAnnouncements)
			})
		},
		[setHiddenAnnouncements]
	)

	const resetOrder = useCallback(
		(userKind: string) => {
			const defaultEntries = getDefaultDashboardOrder(userKind, flags)
			if (defaultEntries.shown == null) {
				throw new Error('defaultEntries.shown is null')
			}
			setShownDashboardEntries(defaultEntries.shown)
		},
		[setShownDashboardEntries, flags]
	)

	return {
		shownDashboardEntries: entries,
		resetOrder,
		updateDashboardOrder,
		hiddenAnnouncements: hiddenAnnouncements ?? [],
		hideAnnouncement
	}
}
