import { describe, expect, it } from 'bun:test'
import { readSignInLink } from '@/utils/auth-confirm'
import { parseNativeSignInLink } from '@/utils/native-sign-in-link'

describe('parseNativeSignInLink', () => {
	it('accepts the app confirmation link', () => {
		expect(
			parseNativeSignInLink('hawconnect://auth-confirm#token=abc')
		).toEqual({
			url: 'hawconnect://auth-confirm#token=abc',
			token: 'abc',
			error: ''
		})
	})

	it('accepts the confirmation page on an app host', () => {
		expect(
			parseNativeSignInLink(
				'https://web.hawconnect.invalid/auth-confirm#token=abc'
			)
		).toEqual({
			url: 'https://web.hawconnect.invalid/auth-confirm#token=abc',
			token: 'abc',
			error: ''
		})
	})

	it('decodes the token value', () => {
		expect(
			parseNativeSignInLink('hawconnect://auth-confirm#token=a%2Bb')?.token
		).toBe('a+b')
	})

	it('ignores other app routes carrying a fragment', () => {
		expect(parseNativeSignInLink('hawconnect://timetable#token=abc')).toBeNull()
		expect(parseNativeSignInLink('hawconnect://x#y=abc')).toBeNull()
	})

	it('ignores fragments without a token key', () => {
		expect(
			parseNativeSignInLink('hawconnect://auth-confirm#foo=abc')
		).toBeNull()
	})

	it('ignores confirmation paths on unrelated hosts', () => {
		expect(
			parseNativeSignInLink('https://example.com/auth-confirm#token=abc')
		).toBeNull()
	})
})

describe('readSignInLink', () => {
	it('reads only the token key', () => {
		expect(readSignInLink('https://h.invalid/auth-confirm#foo=abc')).toEqual({
			token: '',
			error: 'missingLink'
		})
		expect(
			readSignInLink('https://h.invalid/auth-confirm#token=a%2Bb').token
		).toBe('a+b')
	})
})
