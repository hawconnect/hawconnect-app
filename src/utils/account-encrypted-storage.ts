import { bytesToHex } from '@noble/ciphers/utils.js'
import { getRandomBytes } from 'expo-crypto'
import type { StateStorage } from 'zustand/middleware'
import {
	cacheGenerationPointer,
	prepareFreshCacheGeneration
} from './account-cache-recovery'
import { createLocalSyncCipher } from './account-local-crypto'
import {
	accountProfileStorage,
	appStorage,
	deleteSecure,
	loadSecureAsync,
	saveSecureAsync
} from './storage'

const keys = new Map<string, Promise<string>>()
const readyKeys = new Map<string, string>()
const generations = new Map<string, number>()
const writes = new Map<string, Promise<void>>()
const errors = new Map<string, unknown>()
const recoveries = new Map<string, Promise<void>>()
function generationSuffix(profile: string) {
	const value = appStorage.getString(cacheGenerationPointer(profile))
	if (value === undefined) return ''
	if (!/^[a-f0-9]{32}$/.test(value)) throw Error('InvalidLocalProfile')
	return `.generation.${value}`
}
const cacheKey = (profile: string) =>
	`encrypted-sync.${profile.length}-${profile}${generationSuffix(profile)}`
const secureKey = (profile: string) =>
	`hawconnect-sync-key-${profile.length}-${profile}${generationSuffix(profile)}`
export async function startFreshEncryptedProfile(
	profile: string,
	active: () => boolean
) {
	const generation = (generations.get(profile) ?? 0) + 1
	generations.set(profile, generation)
	const previous = recoveries.get(profile)
	const unchanged = () => active() && generations.get(profile) === generation
	const task = (async () => {
		await previous?.catch(() => {})
		if (!unchanged()) throw Error('ProfileChanged')
		await writes.get(profile)
		await keys.get(profile)?.catch(() => {})
		if (!unchanged()) throw Error('ProfileChanged')
		await prepareFreshCacheGeneration({
			profile,
			active: unchanged,
			read: (key) => appStorage.getString(key),
			write: (key, value) => appStorage.set(key, value),
			saveKey: saveSecureAsync,
			loadKey: loadSecureAsync,
			generation: bytesToHex(getRandomBytes(16)),
			encryptionKey: bytesToHex(getRandomBytes(32))
		})
		keys.delete(profile)
		readyKeys.delete(profile)
		errors.delete(profile)
	})()
	recoveries.set(profile, task)
	try {
		await task
	} finally {
		if (recoveries.get(profile) === task) recoveries.delete(profile)
	}
}
async function encryptionKey(
	profile: string,
	create: boolean
): Promise<string> {
	const current = keys.get(profile)
	if (current) return current
	const promise = (async () => {
		let key = await loadSecureAsync(secureKey(profile))
		if (!key) {
			if (!create) throw new Error('EncryptedCacheLocked')
			key = bytesToHex(getRandomBytes(32))
			await saveSecureAsync(secureKey(profile), key)
			if ((await loadSecureAsync(secureKey(profile))) !== key)
				throw new Error('EncryptedCacheLocked')
		}
		readyKeys.set(profile, key)
		return key
	})()
	keys.set(profile, promise)
	try {
		return await promise
	} catch (error) {
		keys.delete(profile)
		throw error
	}
}
export async function readEncryptedProfile(
	profile: string
): Promise<string | null> {
	const value = appStorage.getString(cacheKey(profile))
	if (value === undefined) return null
	return createLocalSyncCipher(
		await encryptionKey(profile, false),
		profile
	).open(value)
}
export async function clearEncryptedProfile(profile: string): Promise<void> {
	generations.set(profile, (generations.get(profile) ?? 0) + 1)
	await recoveries.get(profile)?.catch(() => {})
	const pending = keys.get(profile)
	if (pending) await pending.catch(() => {})
	await writes.get(profile)
	const cacheBase = `encrypted-sync.${profile.length}-${profile}`
	const secretBase = `hawconnect-sync-key-${profile.length}-${profile}`
	const historyPrefix = `encrypted-sync-recovery.${profile.length}-${profile}.`
	const namespaces = new Set<string>()
	const pointer = cacheGenerationPointer(profile)
	const active = appStorage.getString(pointer)
	if (active && /^[a-f0-9]{32}$/.test(active)) namespaces.add(active)
	for (const key of appStorage.getAllKeys()) {
		const generation = key.startsWith(`${cacheBase}.generation.`)
			? key.slice(`${cacheBase}.generation.`.length)
			: key.startsWith(historyPrefix)
				? key.slice(historyPrefix.length)
				: ''
		if (/^[a-f0-9]{32}$/.test(generation)) {
			namespaces.add(generation)
			appStorage.remove(key)
		}
	}
	appStorage.remove(cacheBase)
	appStorage.remove(pointer)
	keys.delete(profile)
	readyKeys.delete(profile)
	errors.delete(profile)
	await deleteSecure(secretBase)
	for (const generation of namespaces)
		await deleteSecure(`${secretBase}.generation.${generation}`)
}
export async function prepareEncryptedProfile(profile: string) {
	await encryptionKey(profile, true)
}
export async function flushEncryptedProfile(profile: string): Promise<void> {
	await writes.get(profile)
	if (errors.has(profile)) throw new Error('EncryptedCacheLocked')
}
export const encryptedSyncStorage: StateStorage = {
	getItem() {
		return readEncryptedProfile(accountProfileStorage.getProfile())
	},
	setItem(_name, value) {
		const profile = accountProfileStorage.getProfile()
		const generation = generations.get(profile) ?? 0
		if (profile === 'guest') return
		const ready = readyKeys.get(profile)
		if (ready) {
			try {
				appStorage.set(
					cacheKey(profile),
					createLocalSyncCipher(ready, profile).seal(value, getRandomBytes(12))
				)
				errors.delete(profile)
			} catch (error) {
				errors.set(profile, error)
			}
			return
		}
		const write = (writes.get(profile) ?? Promise.resolve())
			.then(async () => {
				const key = await encryptionKey(profile, true)
				if (generation !== (generations.get(profile) ?? 0)) return
				appStorage.set(
					cacheKey(profile),
					createLocalSyncCipher(key, profile).seal(value, getRandomBytes(12))
				)
				errors.delete(profile)
			})
			.catch((error) => {
				errors.set(profile, error)
			})
		writes.set(profile, write)
	},
	removeItem() {
		return clearEncryptedProfile(accountProfileStorage.getProfile())
	}
}
