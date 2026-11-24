import * as Application from 'expo-application'
import Constants from 'expo-constants'
import { Platform } from 'react-native'

/**
 * Version shown to people, e.g. "0.1.0" on the web and "0.1.0 (12)" in the
 * native apps, where the build number tells builds of one version apart.
 */
export function appVersionLabel(): string {
	const version =
		Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? ''
	const build = Platform.OS === 'web' ? null : Application.nativeBuildVersion
	return build ? `${version} (${build})` : version
}
