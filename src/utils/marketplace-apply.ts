import { MARKET } from './marketplace-fields'

type Details = Record<string, string | number | string[] | null | undefined>

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * https with a non-empty host free of whitespace and credentials. A regex, not
 * `new URL()`: React Native's URL polyfill accepts `https://my site.de`.
 */
const HTTPS_URL = /^https:\/\/[^\s/?#@]+(?:[/?#]\S*)?$/

export const isHttpsUrl = (value: string): boolean =>
	value.length <= MARKET.urlMax && HTTPS_URL.test(value)

/** An https link without credentials, or null. Never javascript: or http:. */
export function safeHttpsUrl(value: unknown): string | null {
	if (typeof value !== 'string') return null
	const url = value.trim()
	return isHttpsUrl(url) ? url : null
}

const validEmail = (email: unknown): email is string =>
	typeof email === 'string' &&
	email.length <= MARKET.emailMax &&
	EMAIL.test(email)

/** A mailto link for a valid address, or null. Only the local part is encoded. */
export function mailtoLink(email: unknown): string | null {
	if (!validEmail(email)) return null
	const at = email.lastIndexOf('@')
	return `mailto:${encodeURIComponent(email.slice(0, at))}${email.slice(at)}`
}

/**
 * Where Apply Now goes: the https URL or a mailto link, depending on the
 * employer's chosen method. Null when the chosen method has no usable value.
 */
export function applyLink(details: Details): string | null {
	if (details.applyMethod === 'url') return safeHttpsUrl(details.applyUrl)
	if (details.applyMethod === 'email') return mailtoLink(details.applyEmail)
	return null
}

/**
 * The plain address Apply Now would open (email or https link), for showing in
 * a failure message. Null when the chosen method has no usable value.
 */
export function applyAddress(details: Details): string | null {
	if (details.applyMethod === 'url') return safeHttpsUrl(details.applyUrl)
	if (details.applyMethod === 'email')
		return validEmail(details.applyEmail) ? details.applyEmail : null
	return null
}
