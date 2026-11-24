import { beforeAll, describe, expect, it } from 'bun:test'
import { reactNativePlatform } from './react-native-mock'

const SRC_ROOT = new URL('../../', import.meta.url).pathname

let resolveAnnouncementPlatform: typeof import('../web-host').resolveAnnouncementPlatform
let getAnnouncementPlatform: typeof import('../web-host').getAnnouncementPlatform
let resolveWebPlatform: typeof import('../web-host').resolveWebPlatform

beforeAll(async () => {
	const webHost = await import(`${SRC_ROOT}utils/web-host.ts`)
	resolveAnnouncementPlatform = webHost.resolveAnnouncementPlatform
	getAnnouncementPlatform = webHost.getAnnouncementPlatform
	resolveWebPlatform = webHost.resolveWebPlatform
})

describe('web-host', () => {
	it('resolveWebPlatform - Should map web.hawconnect.invalid to web', () => {
		expect(resolveWebPlatform('web.hawconnect.invalid')).toBe('web')
	})

	it('resolveWebPlatform - Should treat other hosts as web-local', () => {
		expect(resolveWebPlatform('localhost')).toBe('web-local')
		expect(resolveWebPlatform('127.0.0.1')).toBe('web-local')
		expect(resolveWebPlatform('dev.hawconnect.invalid')).toBe('web-local')
	})

	it('resolveAnnouncementPlatform - Should return WEB on web', () => {
		expect(resolveAnnouncementPlatform()).toBe('WEB')
	})

	it('resolveAnnouncementPlatform - Should return IOS on iOS', () => {
		reactNativePlatform.OS = 'ios'
		expect(resolveAnnouncementPlatform()).toBe('IOS')
		reactNativePlatform.OS = 'web'
	})

	it('resolveAnnouncementPlatform - Should return ANDROID on Android', () => {
		reactNativePlatform.OS = 'android'
		expect(resolveAnnouncementPlatform()).toBe('ANDROID')
		reactNativePlatform.OS = 'web'
	})

	it('getAnnouncementPlatform - Should delegate to resolveAnnouncementPlatform', () => {
		expect(getAnnouncementPlatform()).toBe(resolveAnnouncementPlatform())
	})
})
