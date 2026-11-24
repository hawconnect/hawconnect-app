import { describe, expect, it } from 'bun:test'
import {
	assertIntegrationAvailable,
	assertRequestAllowed,
	guardedFetch,
	IntegrationUnavailableError
} from '../integration-utils'

describe('HAWConnect integration boundaries', () => {
	it('rejects unavailable integrations without exposing sensitive input', () => {
		expect(() =>
			assertIntegrationAvailable('university', 'unavailable')
		).toThrow(IntegrationUnavailableError)
		try {
			assertIntegrationAvailable('university', 'unavailable')
		} catch (error) {
			expect((error as Error).message).not.toContain('https://')
			expect((error as Error).message).not.toContain('token')
		}
	})
	it('rejects demo integrations as network sources', () => {
		expect(() => assertIntegrationAvailable('food', 'demo')).toThrow()
	})
	it('permits explicitly enabled live integrations', () => {
		expect(() => assertIntegrationAvailable('food', 'live')).not.toThrow()
	})
	it('rejects embedded credentials and non-http schemes', () => {
		expect(() =>
			assertRequestAllowed('https://user:secret@example.org')
		).toThrow()
		expect(() => assertRequestAllowed('file:///tmp/menu')).toThrow()
	})
	it('allows a club-configured endpoint and local development', () => {
		expect(() =>
			assertRequestAllowed('https://example.org/graphql')
		).not.toThrow()
		expect(() =>
			assertRequestAllowed('http://localhost:4000/graphql')
		).not.toThrow()
	})
})

it('rejects insecure requests before the transport can send data', async () => {
	let sent = false
	await expect(
		guardedFetch('http://example.org/private', {}, async () => {
			sent = true
			return new Response('{}')
		})
	).rejects.toThrow('HTTPS is required')
	expect(sent).toBe(false)
})

it('does not call the transport for an unavailable capability', async () => {
	let sent = false
	await expect(
		guardedFetch(
			'https://private.example.test/with-token',
			{},
			async () => {
				sent = true
				return new Response('{}')
			},
			'university API',
			'unavailable'
		)
	).rejects.toBeInstanceOf(IntegrationUnavailableError)
	expect(sent).toBe(false)
})
