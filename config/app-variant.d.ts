export interface AppVariant {
	variant: 'production' | 'staging'
	name: string
	identifier: string
	scheme: string
	webOrigin: string
	forbiddenHosts: string[]
}

export const VARIANTS: Record<'production' | 'staging', AppVariant>
export function resolveAppVariant(
	env: Record<string, string | undefined>
): AppVariant
export function validateVariantEnvironment(
	env: Record<string, string | undefined>
): AppVariant
