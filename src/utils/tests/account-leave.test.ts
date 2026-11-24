import { describe, expect, it } from 'bun:test'
import { leaveAccount } from '@/utils/account-leave'

function harness(endSession: () => Promise<void>) {
	const calls: string[] = []
	return {
		calls,
		deps: {
			endSession: async () => {
				calls.push('endSession')
				await endSession()
			},
			clearCredential: async () => {
				calls.push('clearCredential')
			},
			clearLocal: async () => {
				calls.push('clearLocal')
			},
			signedOut: () => {
				calls.push('signedOut')
			},
			unchanged: () => true
		}
	}
}
const offline = () => Promise.reject(new Error('AccountUnavailable'))

describe('leaveAccount', () => {
	it('clears local account data on logout when the server is unreachable', async () => {
		const { calls, deps } = harness(offline)

		const result = await leaveAccount('logout', deps)

		expect(result).toEqual({ serverEnded: false })
		expect(calls).toContain('clearCredential')
		expect(calls).toContain('clearLocal')
		expect(calls.at(-1)).toBe('signedOut')
	})

	it('reports a completed server sign-out', async () => {
		const { calls, deps } = harness(() => Promise.resolve())

		expect(await leaveAccount('logout', deps)).toEqual({ serverEnded: true })
		expect(calls).toEqual(['endSession', 'clearLocal', 'signedOut'])
	})

	it('keeps local data when account deletion fails', async () => {
		const { calls, deps } = harness(offline)

		await expect(leaveAccount('delete', deps)).rejects.toThrow()
		expect(calls).toEqual(['endSession'])
	})

	it('does not clear another account that became active meanwhile', async () => {
		const { calls, deps } = harness(offline)

		await leaveAccount('logout', { ...deps, unchanged: () => false })

		expect(calls).toEqual(['endSession'])
	})
})
