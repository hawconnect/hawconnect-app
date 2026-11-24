import type React from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshControl, ScrollView, Text, View } from 'react-native'
import ErrorView from '@/components/Error/error-view'
import { CafeteriaCard } from '@/components/Food/cafeteria-card'
import LoadingIndicator from '@/components/Universal/loading-indicator'
import { HAW_CAMPUSES } from '@/data/haw-campuses'
import { useRefreshByUser } from '@/hooks'
import { useCafeterias } from '@/hooks/useCafeterias'
import { useTransparentHeaderPadding } from '@/hooks/useTransparentHeader'
import { networkError } from '@/utils/api-utils'
import { groupByCampus } from '@/utils/cafeterias'
import { ServiceStatus } from '@/utils/gatus-status'

export default function CafeteriasScreen(): React.JSX.Element {
	const { t, i18n } = useTranslation('food')
	const { data, isLoading, isError, isPaused, isSuccess, refetch } =
		useCafeterias()
	const { isRefetchingByUser, refetchByUser } = useRefreshByUser(refetch)
	const paddingTop = useTransparentHeaderPadding() + 12
	const language = i18n.language.startsWith('de') ? 'de' : 'en'

	if (isLoading && !isRefetchingByUser)
		return (
			<View className="flex-1 items-center justify-center">
				<LoadingIndicator />
			</View>
		)
	if (isError)
		return (
			<ErrorView
				title={t('cafeterias.error')}
				onRefresh={refetchByUser}
				refreshing={isRefetchingByUser}
			/>
		)
	if ((isPaused && !isSuccess) || data == null)
		return (
			<ErrorView
				title={networkError}
				statusServices={ServiceStatus.Backend}
				onRefresh={refetchByUser}
				refreshing={isRefetchingByUser}
			/>
		)

	const now = new Date()
	return (
		<ScrollView
			testID="cafeterias-screen"
			className="flex-1"
			contentContainerClassName="px-page pb-bottom-safe gap-5 w-full max-w-[700px] self-center"
			contentContainerStyle={{ paddingTop }}
			refreshControl={
				<RefreshControl
					refreshing={isRefetchingByUser}
					onRefresh={refetchByUser}
				/>
			}
		>
			{groupByCampus(data).map((group) => (
				<View key={group.campus} className="gap-2">
					<Text
						accessibilityRole="header"
						className="text-label text-xs font-semibold uppercase tracking-wide px-1"
					>
						{HAW_CAMPUSES.find((campus) => campus.label === group.campus)?.name[
							language
						] ?? group.campus}
					</Text>
					{group.places.map((cafeteria) => (
						<CafeteriaCard key={cafeteria.id} cafeteria={cafeteria} now={now} />
					))}
				</View>
			))}
		</ScrollView>
	)
}
