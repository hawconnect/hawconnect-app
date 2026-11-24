/**
 * Build variants: production (default, the store app) and staging (the
 * "HAWConnect Beta" app that talks to the staging backend). Both can be
 * installed side by side because their identifiers and URL schemes differ.
 * Select with APP_VARIANT=staging; anything else (or unset) is production.
 */
const VARIANTS = {
	production: {
		variant: 'production',
		name: 'HAWConnect',
		identifier: 'dev.hawconnect.app',
		scheme: 'hawconnect',
		webOrigin: 'https://app.hawconnect.de',
		// Staging services a production build must never use.
		forbiddenHosts: ['dev-api.hawconnect.de', 'dev-account.hawconnect.de']
	},
	staging: {
		variant: 'staging',
		name: 'HAWConnect Beta',
		identifier: 'dev.hawconnect.app.beta',
		scheme: 'hawconnect-beta',
		webOrigin: 'https://dev-app.hawconnect.de',
		// Production services a staging build must never use.
		forbiddenHosts: ['api.hawconnect.de', 'account.hawconnect.de']
	}
}

function resolveAppVariant(env) {
	return env.APP_VARIANT === 'staging' ? VARIANTS.staging : VARIANTS.production
}

function hostOf(value) {
	try {
		return new URL(value).hostname.toLowerCase()
	} catch {
		return undefined
	}
}

/**
 * Stops a staging build from pointing at production services and a
 * production build from pointing at staging services. Unset values and
 * local URLs are allowed so development builds keep working.
 */
function validateVariantEnvironment(env) {
	const variant = resolveAppVariant(env)
	for (const name of [
		'EXPO_PUBLIC_HAWCONNECT_GRAPHQL_ENDPOINT',
		'EXPO_PUBLIC_HAWCONNECT_AUTH_URL',
		'EXPO_PUBLIC_HAWCONNECT_LOGIN_URL'
	]) {
		const host = hostOf(env[name])
		if (host && variant.forbiddenHosts.includes(host)) {
			throw new Error(
				`The ${variant.variant} app must not use ${host} (${name}). Check the EAS environment for this build profile.`
			)
		}
	}
	return variant
}

module.exports = { VARIANTS, resolveAppVariant, validateVariantEnvironment }
