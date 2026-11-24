import { describe, expect, it } from 'bun:test'
import { hasValueCopyButton, isRowPressable } from '../form-list-rows'

describe('form-list rows', () => {
	it('a row with an action is pressable unless disabled', () => {
		expect(isRowPressable({ onPress: () => {} })).toBe(true)
		expect(isRowPressable({ onPress: () => {}, disabled: true })).toBe(false)
		expect(isRowPressable({})).toBe(false)
	})

	it('a copyable value gets its own copy button on a static row', () => {
		expect(hasValueCopyButton({ value: '240', copyable: true })).toBe(true)
	})

	it('a pressable row never holds a second button for its value', () => {
		expect(
			hasValueCopyButton({
				value: 'anna@example.org',
				copyable: 'anna@example.org',
				onPress: () => {}
			})
		).toBe(false)
	})

	it('no copy button without a value or without copyable', () => {
		expect(hasValueCopyButton({ copyable: true })).toBe(false)
		expect(hasValueCopyButton({ value: 'x' })).toBe(false)
	})
})
