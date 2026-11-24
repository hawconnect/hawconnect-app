import { describe, expect, it } from 'bun:test'
import { classProgress } from '../class-progress'

const start = new Date('2026-11-17T13:00:00Z')
const end = new Date('2026-11-17T14:40:00Z')

describe('classProgress', () => {
	it('reports the elapsed share and minutes left', () => {
		expect(classProgress(start, end, new Date('2026-11-17T14:00:00Z'))).toEqual(
			{
				fraction: 0.6,
				minutesLeft: 40
			}
		)
	})
	it('rounds partial minutes up so a class never says 0 while running', () => {
		expect(
			classProgress(start, end, new Date('2026-11-17T14:39:30Z')).minutesLeft
		).toBe(1)
	})
	it('stays within 0 and 1 outside the class and for zero-length events', () => {
		expect(classProgress(start, end, new Date('2026-11-17T12:00:00Z'))).toEqual(
			{
				fraction: 0,
				minutesLeft: 160
			}
		)
		expect(classProgress(start, end, new Date('2026-11-17T15:00:00Z'))).toEqual(
			{
				fraction: 1,
				minutesLeft: 0
			}
		)
		expect(classProgress(start, start, start).fraction).toBe(1)
	})
})
