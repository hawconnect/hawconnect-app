export interface LeaveAccountDeps {
	/** Ends the server session (sign-out) or deletes the account. */
	endSession: () => Promise<void>
	/** Removes the locally stored session credential (native only). */
	clearCredential: () => Promise<void>
	/** Removes this account's cached data from the device. */
	clearLocal: () => Promise<void>
	signedOut: () => void
	/** False once another account became active during the operation. */
	unchanged: () => boolean
}

/**
 * Logout must remove the account from this device even when the server is
 * unreachable; server revocation is best-effort. Deletion is only treated as
 * done once the server confirmed it, so local data stays until then.
 */
export async function leaveAccount(
	action: 'logout' | 'delete',
	deps: LeaveAccountDeps
): Promise<{ serverEnded: boolean }> {
	let serverEnded = true
	try {
		await deps.endSession()
	} catch (error) {
		if (action === 'delete') throw error
		serverEnded = false
	}
	if (!deps.unchanged()) return { serverEnded }
	if (!serverEnded) await deps.clearCredential()
	await deps.clearLocal()
	deps.signedOut()
	return { serverEnded }
}
