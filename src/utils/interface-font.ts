/** "Interface font" setting: the bundled Outfit (`default`) or the platform font (`system`). */
export const interfaceFonts = ['default', 'system'] as const

export type InterfaceFont = (typeof interfaceFonts)[number]

export function normalizeInterfaceFont(value: unknown): InterfaceFont {
	return value === 'system' ? 'system' : 'default'
}

/** Web `--font-sans` value per setting; `default` matches `src/global.css`. */
export const WEB_FONT_STACK: Record<InterfaceFont, string> = {
	default: '"Outfit", ui-sans-serif, system-ui, sans-serif',
	system:
		'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
}

/**
 * Shared with the patched uniwind Text/TextInput (patches/uniwind@1.13.0.patch,
 * `outfit.ts`), which subscribe to this store to drop Outfit on iOS and Android.
 */
export const INTERFACE_FONT_STORE_KEY = Symbol.for('hawconnect.interfaceFont')

interface InterfaceFontStore {
	mode: InterfaceFont
	listeners: Set<() => void>
}

export function setNativeInterfaceFont(mode: InterfaceFont): void {
	const scope = globalThis as unknown as Record<
		symbol,
		InterfaceFontStore | undefined
	>
	scope[INTERFACE_FONT_STORE_KEY] ??= { mode: 'default', listeners: new Set() }
	const store = scope[INTERFACE_FONT_STORE_KEY]
	if (store.mode === mode) return
	store.mode = mode
	for (const listener of store.listeners) listener()
}
