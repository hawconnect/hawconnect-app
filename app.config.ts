import { validateVariantEnvironment } from './config/app-variant'
import { validateTestFlightEnvironment } from './config/testflight-config'
import packageInfo from './package.json'

if (
	process.env.EAS_BUILD_PROFILE === 'testflight' ||
	process.env.EAS_BUILD_PROFILE === 'staging'
)
	validateTestFlightEnvironment(process.env)

// production (default) or staging ("HAWConnect Beta"); see config/app-variant.js.
const variant = validateVariantEnvironment(process.env)
// The EAS project @hawconnect/hawconnect; EAS_OWNER and EAS_PROJECT_ID override it (e.g. for a fork).
const easOwner = process.env.EAS_OWNER || 'hawconnect'
const easProjectId =
	process.env.EAS_PROJECT_ID || '0cb4308b-8ede-46dc-b9e7-67234f449a1b'

export default {
	name: variant.name,
	owner: easOwner,
	slug: 'hawconnect',
	scheme: variant.scheme,

	version: packageInfo.version,
	runtimeVersion: {
		policy: 'appVersion'
	},
	updates: {
		enabled: false
	},
	orientation: 'portrait',
	githubUrl: process.env.EXPO_PUBLIC_SOURCE_REPOSITORY_URL || undefined,
	extra: {
		appVariant: variant.variant,
		eas: { projectId: easProjectId }
	},
	userInterfaceStyle: 'automatic',
	ios: {
		bundleIdentifier: variant.identifier,
		buildNumber: '1',
		supportsTablet: true,
		userInterfaceStyle: 'automatic',
		entitlements: {},
		config: {
			usesNonExemptEncryption: false
		},
		infoPlist: {
			RCTAsyncStorageExcludeFromBackup: false,
			CFBundleAllowMixedLocalizations: true,
			CFBundleDevelopmentRegion: 'en',
			UIViewControllerBasedStatusBarAppearance: false,
			NSLocationWhenInUseUsageDescription:
				'Allow HAWConnect to access your location to show your location on the map.'
			// NSPhotoLibraryUsageDescription comes from the expo-image-picker plugin below (single source).
		},
		icon: {
			light: './src/assets/hawconnect/icon.png',
			dark: './src/assets/hawconnect/icon-dark.png',
			tinted: './src/assets/hawconnect/icon-tinted.png'
		}
	},
	locales: {
		en: './src/localization/en/metadata.json',
		de: './src/localization/de/metadata.json'
	},
	android: {
		package: variant.identifier,
		userInterfaceStyle: 'automatic',
		icon: './src/assets/hawconnect/icon.png',
		adaptiveIcon: {
			foregroundImage: './src/assets/hawconnect/foreground.png',
			backgroundColor: '#40296C'
		},
		permissions: [
			'android.permission.ACCESS_COARSE_LOCATION',
			'android.permission.ACCESS_FINE_LOCATION'
		],
		intentFilters: []
	},
	experiments: {
		autolinkingModuleResolution: true,
		reactCompiler: true,
		tsconfigPaths: true,
		typedRoutes: true
	},
	plugins: [
		[
			'expo-build-properties',
			{
				ios: { deploymentTarget: '17.0' },
				android: {
					// R8 minify/obfuscation for Play Console DEX optimization (≥25% obfuscation).
					// Resource shrinking left off until release builds are validated with minify alone.
					enableMinifyInReleaseBuilds: true
				}
			}
		],
		[
			// Hide floating Dev Tools FAB / onboarding overlays that block Maestro taps.
			'expo-dev-client',
			{
				toolsButton: false,
				skipOnboarding: true,
				showMenuAtLaunch: false
			}
		],
		[
			'expo-router',
			{
				origin: process.env.EXPO_PUBLIC_WEBSITE_URL || variant.webOrigin,
				sitemap: true
			}
		],
		'expo-web-browser',
		['expo-secure-store'],
		[
			'expo-image-picker',
			{
				photosPermission:
					'Allow HAWConnect to access your photos to add them to your marketplace posts.',
				// Library only: block camera and microphone permissions.
				cameraPermission: false,
				microphonePermission: false
			}
		],
		[
			'expo-localization',
			{
				supportedLocales: ['en', 'de']
			}
		],
		['@maplibre/maplibre-react-native'],
		[
			'expo-splash-screen',
			{
				backgroundColor: '#F7F6F8',
				image: './src/assets/hawconnect/splash-light.png',
				dark: {
					image: './src/assets/hawconnect/splash-dark.png',
					backgroundColor: '#141019'
				},
				imageWidth: 200
			}
		],
		[
			'expo-quick-actions',
			{
				androidIcons: {
					account: {
						foregroundImage: 'src/assets/android/account.png',
						backgroundColor: '#ffffff'
					},
					calendar: {
						foregroundImage: 'src/assets/android/calendar.png',
						backgroundColor: '#ffffff'
					},
					food: {
						foregroundImage: 'src/assets/android/food.png',
						backgroundColor: '#ffffff'
					},
					link: {
						foregroundImage: 'src/assets/android/link.png',
						backgroundColor: '#ffffff'
					}
				}
			}
		],
		[
			'./config/plugins/withDrawableAssets.js',
			'./src/assets/android/check.xml'
		],
		'./config/plugins/withIosCiArtifacts.js',
		'./config/plugins/withCiScriptsSymlink.js',
		'./config/plugins/withGradleJvmArgs.js',
		[
			'expo-font',
			{
				fonts: [
					'./config/fonts/MaterialSymbolsRoundedFill.ttf',
					'./config/fonts/MaterialSymbolsRoundedOutline.ttf',
					'./config/fonts/Outfit-Regular.ttf',
					'./config/fonts/Outfit-Medium.ttf',
					'./config/fonts/Outfit-SemiBold.ttf',
					'./config/fonts/Outfit-Bold.ttf'
				]
			}
		],
		['@react-native-community/datetimepicker'],
		['expo-image']
	],
	web: {
		favicon: './src/assets/hawconnect/icon.png',
		shortName: 'HAWConnect',
		name: 'HAWConnect - Deine App für die HAW Hamburg',
		description:
			'HAWConnect ist deine App für die HAW Hamburg, entwickelt von Studierenden für Studierende. Sie bietet dir alle Funktionen, die du für dein Studium benötigst, an einem Ort.',
		lang: 'de',
		dir: 'ltr',
		startUrl: '.',
		display: 'standalone',
		backgroundColor: '#F7F6F8',
		// theme-color is set in public/index.html (light/dark media queries) and
		// updated at runtime from src/app/_layout.tsx to match the active app theme.
		barStyle: 'black-translucent',
		preferRelatedApplications: true,
		output: 'single',
		bundler: 'metro'
	}
}
