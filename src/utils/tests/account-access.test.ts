import { expect, it } from 'bun:test'
import { accountAccess } from '../account-access'

it('allows an explicitly chosen web guest while keeping locked sessions gated', () => {
	for (const path of [
		'/',
		'/calendar-import',
		'/timetable',
		'/food',
		'/settings',
		'/lecture'
	]) {
		expect(accountAccess('web', 'guest', path)).toBe('allow')
		expect(accountAccess('web', 'locked', path)).toBe('sign-in')
	}
	expect(accountAccess('web', 'authenticated', '/calendar-import')).toBe(
		'allow'
	)
})
it('allows mobile guest access, but locks an expired account session', () => {
	expect(accountAccess('ios', 'guest', '/timetable')).toBe('allow')
	expect(accountAccess('android', 'guest', '/food')).toBe('allow')
	expect(accountAccess('ios', 'locked', '/timetable')).toBe('sign-in')
})
it('allows confirmation and legal routes without exposing application screens', () => {
	for (const path of [
		'/auth-confirm',
		'/login',
		'/legal',
		'/licenses',
		'/license'
	])
		expect(accountAccess('web', 'guest', path)).toBe('allow')
	expect(accountAccess('web', 'loading', '/settings')).toBe('loading')
})

it('allows public legal documents while signed out or loading', () => {
	for (const path of ['/privacy', '/imprint'])
		for (const status of ['locked', 'loading'] as const)
			expect(accountAccess('web', status, path)).toBe('allow')
})

it('opens the marketplace list and post pages to signed-out visitors, but nothing else under it', () => {
	const post = '/marketplace/123e4567-e89b-12d3-a456-426614174000'
	for (const path of ['/marketplace', post])
		expect(accountAccess('web', 'locked', path)).toBe('allow')
	for (const path of [
		'/marketplace/new',
		'/marketplace/mine',
		'/marketplace/edit/123e4567-e89b-12d3-a456-426614174000',
		`${post}/x`,
		'/marketplaces'
	])
		expect(accountAccess('web', 'locked', path)).toBe('sign-in')
	expect(accountAccess('web', 'loading', '/marketplace')).toBe('loading')
})
