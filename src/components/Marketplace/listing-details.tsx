import type { TFunction } from 'i18next'
import { Linking } from 'react-native'
import type { MarketPost } from '@/api/marketplace-api'
import type { SectionGroup } from '@/types/components'
import { safeHttpsUrl } from '@/utils/marketplace-apply'
import { fieldsFor } from '@/utils/marketplace-fields'
import { deadlineState, detailIcon } from '@/utils/marketplace-job'
import { fieldLabel, formatMarketDate, optionLabel } from './market-labels'

type MarketT = TFunction<'marketplace'>

/**
 * Apply fields drive the Apply Now button, the employer sits in the subtitle
 * and the contact fields in their own block.
 */
const HIDDEN_FIELDS = [
	'applyMethod',
	'applyUrl',
	'applyEmail',
	'employer',
	'contactName',
	'contactRole',
	'contactEmail',
	'companyWebsite'
]
const UNIT_KEYS = ['sizeSqm', 'weeklyHours', 'deposit']

/** Opens like Apply Now; web adds noopener in react-native-web's Linking. */
export const openLink = (url: string, onFail?: () => void) => {
	void Linking.openURL(url).catch(() => onFail?.())
}

/** The deadline date with how long applying is still possible. */
function deadlineText(
	t: MarketT,
	deadline: string,
	language: string,
	now: Date
): string {
	const date = formatMarketDate(deadline, language)
	const state = deadlineState(deadline, now)
	if (state?.kind === 'open')
		return t('marketplace.detail.deadlineDaysLeft', {
			date,
			count: state.days
		})
	if (state?.kind === 'today')
		return t('marketplace.detail.deadlineToday', { date })
	if (state?.kind === 'closed')
		return t('marketplace.detail.deadlineClosed', { date })
	return date
}

/** Every filled detail in registry order, labelled and with units. */
export function detailItems(
	post: MarketPost,
	t: MarketT,
	language: string,
	now: Date = new Date()
): SectionGroup[] {
	const items: SectionGroup[] = []
	for (const spec of fieldsFor(post.category, post.type)) {
		const raw = post.details[spec.key]
		if (HIDDEN_FIELDS.includes(spec.key) || raw == null || raw === '') continue
		if (Array.isArray(raw) && raw.length === 0) continue
		const title =
			spec.key === 'applyDeadline'
				? t('marketplace.detail.applyBy')
				: fieldLabel(t, spec.key)
		const icon = detailIcon(spec.key)
		if (spec.kind === 'url') {
			const url = safeHttpsUrl(raw)
			if (url)
				items.push({
					title,
					icon,
					value: url,
					layout: 'column',
					hideChevron: true,
					onPress: () => openLink(url),
					accessibilityHint: url
				})
			continue
		}
		let value: string
		if (spec.kind === 'select') value = optionLabel(t, spec.key, String(raw))
		else if (spec.kind === 'multi' && Array.isArray(raw))
			value = raw.map((o) => optionLabel(t, spec.key, o)).join(', ')
		else if (spec.key === 'applyDeadline')
			value = deadlineText(t, String(raw), language, now)
		else if (spec.kind === 'date')
			value = formatMarketDate(String(raw), language)
		else if (UNIT_KEYS.includes(spec.key))
			value = t(`marketplace.unit.${spec.key}` as 'marketplace.unit.sizeSqm', {
				value: String(raw)
			})
		else value = String(raw)
		items.push({
			title,
			icon,
			value,
			selectable: true,
			...(spec.kind === 'longText' ? { layout: 'column' as const } : {})
		})
	}
	return items
}
