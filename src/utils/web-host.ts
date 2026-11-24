import { Platform } from 'react-native'
import type { Platform as AnnouncementPlatform } from '@/__generated__/gql/graphql'
import { HAWCONNECT_WEB_HOST } from '@/utils/app-hosts'

export type WebPlatform = 'web' | 'web-local'

export {
	HAWCONNECT_APP_HOSTS,
	HAWCONNECT_WEB_HOST,
	isHAWConnectAppHost
} from '@/utils/app-hosts'

export function resolveAnnouncementPlatform(): AnnouncementPlatform {
	if (Platform.OS === 'ios') {
		return 'IOS'
	}

	if (Platform.OS === 'android') {
		return 'ANDROID'
	}

	return 'WEB'
}

/** Resolves the GraphQL announcement platform at call time (not module load). */
export function getAnnouncementPlatform(): AnnouncementPlatform {
	return resolveAnnouncementPlatform()
}

export function resolveWebPlatform(hostname: string): WebPlatform {
	return hostname === HAWCONNECT_WEB_HOST ? 'web' : 'web-local'
}
