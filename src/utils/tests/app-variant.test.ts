import { describe, expect, it } from 'bun:test'
import {
	resolveAppVariant,
	validateVariantEnvironment
} from '../../../config/app-variant'

describe('app variants', () => {
	it('defaults to the unchanged production app', () => {
		const variant = resolveAppVariant({})
		expect(variant.name).toBe('HAWConnect')
		expect(variant.identifier).toBe('dev.hawconnect.app')
		expect(variant.scheme).toBe('hawconnect')
	})

	it('builds a separate beta app for staging', () => {
		const variant = resolveAppVariant({ APP_VARIANT: 'staging' })
		expect(variant.name).toBe('HAWConnect Beta')
		expect(variant.identifier).toBe('dev.hawconnect.app.beta')
		expect(variant.scheme).toBe('hawconnect-beta')
		expect(variant.identifier).not.toBe(resolveAppVariant({}).identifier)
	})

	it('treats unknown variants as production', () => {
		expect(resolveAppVariant({ APP_VARIANT: 'qa' }).variant).toBe('production')
	})

	it('rejects a staging build that points at production services', () => {
		expect(() =>
			validateVariantEnvironment({
				APP_VARIANT: 'staging',
				EXPO_PUBLIC_HAWCONNECT_GRAPHQL_ENDPOINT:
					'https://api.hawconnect.de/graphql'
			})
		).toThrow('api.hawconnect.de')
		expect(() =>
			validateVariantEnvironment({
				APP_VARIANT: 'staging',
				EXPO_PUBLIC_HAWCONNECT_LOGIN_URL: 'https://account.hawconnect.de'
			})
		).toThrow('account.hawconnect.de')
	})

	it('rejects a production build that points at staging services', () => {
		expect(() =>
			validateVariantEnvironment({
				EXPO_PUBLIC_HAWCONNECT_GRAPHQL_ENDPOINT:
					'https://dev-api.hawconnect.de/graphql'
			})
		).toThrow('dev-api.hawconnect.de')
	})

	it('accepts matching and local endpoints', () => {
		expect(
			validateVariantEnvironment({
				APP_VARIANT: 'staging',
				EXPO_PUBLIC_HAWCONNECT_GRAPHQL_ENDPOINT:
					'https://dev-api.hawconnect.de/graphql',
				EXPO_PUBLIC_HAWCONNECT_LOGIN_URL: 'https://dev-account.hawconnect.de'
			}).variant
		).toBe('staging')
		expect(
			validateVariantEnvironment({
				EXPO_PUBLIC_HAWCONNECT_GRAPHQL_ENDPOINT: 'http://localhost:4000/graphql'
			}).variant
		).toBe('production')
	})
})
