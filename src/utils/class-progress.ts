/** How far a running class is: share elapsed (0–1) and whole minutes left. */
export function classProgress(
	start: Date,
	end: Date,
	now: Date
): { fraction: number; minutesLeft: number } {
	const total = end.getTime() - start.getTime()
	const elapsed = now.getTime() - start.getTime()
	const fraction = total > 0 ? Math.min(1, Math.max(0, elapsed / total)) : 1
	const minutesLeft = Math.max(
		0,
		Math.ceil((end.getTime() - now.getTime()) / 60000)
	)
	return { fraction, minutesLeft }
}

/** Under this many minutes the card says "ends in N mins" instead of the end time. */
export const ENDING_SOON_MINUTES = 15
