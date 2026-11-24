import { describe, expect, it } from 'bun:test'
import {
	isAllowedReturnPath,
	RETURN_PATH_TTL_MS,
	type ReturnPathStore,
	saveReturnPath,
	takeReturnPath
} from '../return-path'

const memory = (): ReturnPathStore => {
	const map = new Map<string, string>()
	return {
		getString: (k) => map.get(k),
		set: (k, v) => void map.set(k, v),
		remove: (k) => void map.delete(k)
	}
}
const TOKEN = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOP-_'
const path = `/marketplace/report/${TOKEN}`

describe('return path', () => {
	it('returns an allowed path once', () => {
		const s = memory()
		saveReturnPath(s, path, 1000)
		expect(takeReturnPath(s, 2000)).toBe(path)
		expect(takeReturnPath(s, 2000)).toBeNull()
	})
	it('also restores a marketplace post page, but no other marketplace page', () => {
		const post = '/marketplace/123e4567-e89b-12d3-a456-426614174000'
		expect(isAllowedReturnPath(post)).toBe(true)
		for (const path of [
			'/marketplace',
			'/marketplace/new',
			'/marketplace/mine',
			'/marketplace/edit/123e4567-e89b-12d3-a456-426614174000',
			`${post}/x`,
			`${post}?a=1`,
			'/marketplace/123E4567-E89B-12D3-A456-426614174000x'
		])
			expect(isAllowedReturnPath(path)).toBe(false)
	})
	it('expires after one hour', () => {
		const s = memory()
		saveReturnPath(s, path, 1000)
		expect(takeReturnPath(s, 1000 + RETURN_PATH_TTL_MS + 1)).toBeNull()
		saveReturnPath(s, path, 1000)
		expect(takeReturnPath(s, 1000 + RETURN_PATH_TTL_MS)).toBe(path)
	})
	it('rejects disallowed paths', () => {
		for (const bad of [
			'/(tabs)',
			'https://evil.example',
			'//evil.example',
			'/marketplace/report/../x',
			`${path}?a=1`,
			`${path}#x`,
			'/marketplace/report/'
		]) {
			const s = memory()
			saveReturnPath(s, bad, 1000)
			expect(takeReturnPath(s, 1000)).toBeNull()
		}
	})
	it('rejects tampered stored values', () => {
		const s = memory()
		s.set(
			'hawconnect-return-path',
			JSON.stringify({ path: '//evil.example', at: 1000 })
		)
		expect(takeReturnPath(s, 1000)).toBeNull()
		s.set('hawconnect-return-path', 'not json')
		expect(takeReturnPath(s, 1000)).toBeNull()
	})
})

describe('return path with a failing store', () => {
	it('returns null instead of throwing when the store cannot be read', () => {
		const broken: ReturnPathStore = {
			getString: () => {
				throw new Error('storage unavailable')
			},
			set: () => {},
			remove: () => {}
		}
		expect(takeReturnPath(broken, 1000)).toBeNull()
	})
	it('returns null when the stored value cannot be removed', () => {
		const s = memory()
		saveReturnPath(s, path, 1000)
		const stuck: ReturnPathStore = {
			...s,
			remove: () => {
				throw new Error('storage unavailable')
			}
		}
		expect(takeReturnPath(stuck, 1000)).toBeNull()
	})
})
