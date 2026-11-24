import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import HAWConnectAPI from '@/api/hawconnect-api'

/** Latest HAW Hamburg news in the app language (German and English lists differ). */
export function useHawNews() {
	const { i18n } = useTranslation()
	const language = i18n.language.startsWith('de') ? 'de' : 'en'
	return useQuery({
		queryKey: ['haw-news', 1, language],
		queryFn: () => HAWConnectAPI.getHawNews(language),
		staleTime: 300000,
		gcTime: 86400000,
		retry: 1
	})
}
