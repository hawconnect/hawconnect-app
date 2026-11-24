import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import HAWConnectAPI from '@/api/hawconnect-api'
import { useFoodFilterStore } from '@/hooks/useFoodFilterStore'

/** The Studierendenwerk cafés and mensas on the HAW campuses. */
export function useCafeterias() {
	const { i18n } = useTranslation()
	const foodLanguage = useFoodFilterStore((state) => state.foodLanguage)
	// Same language source as the canteens and meals queries.
	const language = (foodLanguage === 'default'
		? i18n.language
		: foodLanguage
	).startsWith('en')
		? 'en'
		: 'de'
	return useQuery({
		queryKey: ['cafeterias', language],
		queryFn: () => HAWConnectAPI.getCafeterias(language),
		staleTime: 1000 * 60 * 60,
		gcTime: 604800000,
		retry: 1
	})
}
