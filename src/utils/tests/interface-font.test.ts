import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
	INTERFACE_FONT_STORE_KEY,
	interfaceFonts,
	normalizeInterfaceFont,
	setNativeInterfaceFont,
	WEB_FONT_STACK
} from '@/utils/interface-font'

const root = join(import.meta.dir, '../../..')

describe('interface font', () => {
	it('offers Default then System', () => {
		expect([...interfaceFonts]).toEqual(['default', 'system'])
	})

	it('falls back to default for unknown stored values', () => {
		expect(normalizeInterfaceFont('system')).toBe('system')
		expect(normalizeInterfaceFont(undefined)).toBe('default')
		expect(normalizeInterfaceFont('comic')).toBe('default')
	})

	it('keeps the web default stack equal to global.css', () => {
		const css = readFileSync(join(root, 'src/global.css'), 'utf8')
		expect(css).toContain(`--font-sans: ${WEB_FONT_STACK.default};`)
		expect(WEB_FONT_STACK.system).not.toContain('Outfit')
	})

	it('notifies native listeners when the mode changes', () => {
		const calls: string[] = []
		setNativeInterfaceFont('default')
		const store = (
			globalThis as unknown as Record<
				symbol,
				{ mode: string; listeners: Set<() => void> }
			>
		)[INTERFACE_FONT_STORE_KEY]
		const listener = () => calls.push(store.mode)
		store.listeners.add(listener)
		setNativeInterfaceFont('system')
		setNativeInterfaceFont('system')
		setNativeInterfaceFont('default')
		store.listeners.delete(listener)
		expect(calls).toEqual(['system', 'default'])
	})

	it('uses the same store key as the uniwind patch', () => {
		const patch = readFileSync(
			join(root, 'patches/uniwind@1.13.0.patch'),
			'utf8'
		)
		expect(patch).toContain("Symbol.for('hawconnect.interfaceFont')")
		expect(INTERFACE_FONT_STORE_KEY as symbol).toBe(
			Symbol.for('hawconnect.interfaceFont')
		)
	})
})
