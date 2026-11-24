import type { SectionGroup } from '@/types/components'

type RowParts = Pick<
	SectionGroup,
	'onPress' | 'disabled' | 'value' | 'copyable'
>

export const isRowPressable = (item: RowParts): boolean =>
	item.onPress != null && !(item.disabled ?? false)

/**
 * A copyable value gets its own copy button only on a row that isn't a button
 * itself: on web a <button> may not hold another <button>. Pressable rows keep
 * the value selectable, so it can still be copied.
 */
export const hasValueCopyButton = (item: RowParts): boolean =>
	Boolean(item.copyable) && item.value != null && !isRowPressable(item)
