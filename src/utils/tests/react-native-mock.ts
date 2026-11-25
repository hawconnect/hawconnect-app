import { mock } from 'bun:test'

type PlatformOS = 'web' | 'ios' | 'android'

export const reactNativePlatform = {
	OS: 'web' as PlatformOS,
	/**
	 * Like React Native's `Platform.select`: the current OS, then `native` on
	 * iOS/Android, then `default`. Libraries such as expo-router call it when
	 * their modules load, so the mock must provide it.
	 */
	select<T>(
		specifics: Partial<Record<PlatformOS | 'native' | 'default', T>>
	): T | undefined {
		const os = reactNativePlatform.OS
		if (os in specifics) return specifics[os]
		if (os !== 'web' && 'native' in specifics) return specifics.native
		return specifics.default
	}
}

export const reactNativeShareMock = mock(async () => {})
export const reactNativeOpenURLMock = mock(async () => {})

class ReactNativeNativeEventEmitter {
	addListener() {
		return { remove: () => {} }
	}
	removeAllListeners() {}
}

const turboModuleRegistry = {
	get: () => null,
	getEnforcing: () => null
}

export function buildReactNativeMock() {
	const platform = reactNativePlatform
	const share = { share: reactNativeShareMock }
	const linking = { openURL: reactNativeOpenURLMock }

	return {
		__esModule: true as const,
		default: {
			Platform: platform,
			Share: share,
			Linking: linking,
			NativeEventEmitter: ReactNativeNativeEventEmitter,
			TurboModuleRegistry: turboModuleRegistry,
			NativeModules: {},
			StyleSheet: {
				create: (styles: unknown) => styles,
				hairlineWidth: 1
			}
		},
		Platform: platform,
		Share: share,
		Linking: linking,
		NativeEventEmitter: ReactNativeNativeEventEmitter,
		TurboModuleRegistry: turboModuleRegistry,
		NativeModules: {},
		StyleSheet: {
			create: (styles: unknown) => styles,
			hairlineWidth: 1
		}
	}
}

export function mockReactNative() {
	void mock.module('react-native', () => buildReactNativeMock())
}
