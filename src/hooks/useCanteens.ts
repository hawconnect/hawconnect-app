import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import HAWConnectAPI from '@/api/hawconnect-api'
import { useFoodFilterStore } from '@/hooks/useFoodFilterStore'

/** Address and opening hours of the Hamburg canteens in the app language. */
export function useCanteens() {
	const { i18n } = useTranslation()
	const foodLanguage = useFoodFilterStore((state) => state.foodLanguage)
	// Same language source as the meals query (useMealDetail).
	const language = (foodLanguage === 'default'
		? i18n.language
		: foodLanguage
	).startsWith('en')
		? 'en'
		: 'de'
	return useQuery({
		queryKey: ['canteens', 2, language],
		queryFn: () => HAWConnectAPI.getCanteens(language),
		// An empty answer is not worth caching for a day.
		staleTime: (query) => (query.state.data?.length ? 86400000 : 0),
		gcTime: 604800000,
		retry: 1
	})
}
