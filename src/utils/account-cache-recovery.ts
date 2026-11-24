export function cacheGenerationPointer(profile: string): string {
	return `account-cache-generation.${profile}`
}

export async function prepareFreshCacheGeneration(input: {
	profile: string
	active: () => boolean
	read: (key: string) => string | undefined
	write: (key: string, value: string) => void
	saveKey: (key: string, value: string) => Promise<void>
	loadKey: (key: string) => Promise<string | null>
	generation: string
	encryptionKey: string
}): Promise<void> {
	if (!input.active()) throw Error('ProfileChanged')
	await input.saveKey(
		`hawconnect-sync-key-${input.profile.length}-${input.profile}.generation.${input.generation}`,
		input.encryptionKey
	)
	input.write(cacheGenerationPointer(input.profile), input.generation)
}
