import {
	type Href,
	router,
	usePathname,
	useRootNavigationState
} from 'expo-router'
import { useEffect, useRef } from 'react'
import { Linking, Platform } from 'react-native'
import {
	claimInitialNativeSignIn,
	parseNativeSignInLink,
	queueNativeSignIn,
	skipInitialNativeSignIn
} from '@/utils/native-sign-in-link'
import {
	normalizeRoutePath,
	parseUniversalLinkPath
} from '@/utils/universal-link'

// Do not replay a consumed launch link when account gating remounts the navigator.
let initialLinkHandled = false

function navigateToUniversalLinkPath(path: string, currentPath: string): void {
	const targetPath = normalizeRoutePath(path)
	const normalizedCurrentPath = normalizeRoutePath(currentPath)

	if (targetPath === normalizedCurrentPath) {
		return
	}

	router.navigate(`/${targetPath}` as Href)
}

export function useUniversalLinkHandler(): void {
	const rootNavigationState = useRootNavigationState()
	const pathname = usePathname()
	const pathnameRef = useRef(pathname)
	useEffect(() => {
		pathnameRef.current = pathname
	}, [pathname])
	const navigationReady = rootNavigationState?.key != null

	useEffect(() => {
		if (!navigationReady) {
			return
		}

		const handleOpenURL = (url: string, initial = false): void => {
			if (Platform.OS !== 'web') {
				const signIn = parseNativeSignInLink(url)
				if (signIn) {
					if (initial && !claimInitialNativeSignIn()) return
					queueNativeSignIn(signIn)
					if (normalizeRoutePath(pathnameRef.current) !== 'auth-confirm')
						router.navigate('/auth-confirm')
					return
				}
			}
			const path = parseUniversalLinkPath(url)
			if (!path) {
				return
			}

			navigateToUniversalLinkPath(path, pathnameRef.current)
		}

		let cancelled = false
		let receivedEvent = false
		if (!initialLinkHandled) {
			void Linking.getInitialURL()
				.then((url) => {
					if (cancelled || receivedEvent) return
					initialLinkHandled = true
					if (url) handleOpenURL(url, true)
				})
				.catch(() => {})
		}

		const linkingSubscription = Linking.addEventListener('url', (event) => {
			receivedEvent = true
			initialLinkHandled = true
			if (Platform.OS !== 'web') skipInitialNativeSignIn()
			if (!cancelled) handleOpenURL(event.url)
		})

		return () => {
			cancelled = true
			linkingSubscription.remove()
		}
	}, [navigationReady])
}
