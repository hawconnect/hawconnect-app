import SegmentedControl from '@expo/ui/community/segmented-control'
import { useRouter } from 'expo-router'
import type React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useUniwind } from 'uniwind'
import type { MarketFilter } from '@/api/marketplace-api'
import ThemeMenu from '@/components/Settings/theme-menu'
import FormList from '@/components/Universal/form-list'
import { useAccountStore } from '@/hooks/useAccountStore'
import type { FormListSections } from '@/types/components'
import { categoryOptions, typeFilterLabels } from './market-labels'

const TYPES = [null, 'offer', 'request'] as const

interface MarketFiltersProps {
	filter: MarketFilter
	onChange: (filter: MarketFilter) => void
}

/** "Create listing" / "My listings" rows plus type and category filters. */
export function MarketFilters({
	filter,
	onChange
}: MarketFiltersProps): React.JSX.Element {
	const { t } = useTranslation('marketplace')
	const router = useRouter()
	const isDark = useUniwind().theme === 'dark'
	// Guests keep "Create listing" (it asks them to sign in) but have no listings.
	const signedIn = useAccountStore(
		(s) => s.status === 'authenticated' && s.user != null
	)
	const typeLabels = typeFilterLabels(t, filter.category)
	const sections: FormListSections[] = [
		{
			items: [
				{
					testID: 'marketplace-new-post',
					title: t('marketplace.list.newPost'),
					icon: {
						ios: 'square.and.pencil',
						android: 'edit_square',
						web: 'SquarePen'
					},
					onPress: () => router.navigate('/marketplace/new')
				},
				...(signedIn
					? [
							{
								testID: 'marketplace-my-posts',
								title: t('marketplace.list.myPosts'),
								icon: {
									ios: 'person.crop.rectangle',
									android: 'person' as const,
									web: 'User' as const
								},
								onPress: () => router.navigate('/marketplace/mine')
							}
						]
					: [])
			]
		},
		{
			item: (
				<SegmentedControl
					testID="marketplace-type-filter"
					accessibilityLabel={t('marketplace.filter.type')}
					values={[
						t('marketplace.filter.all'),
						typeLabels.offer,
						typeLabels.request
					]}
					selectedIndex={Math.max(
						0,
						TYPES.indexOf((filter.type ?? null) as (typeof TYPES)[number])
					)}
					onChange={(event) =>
						onChange({
							...filter,
							type: TYPES[event.nativeEvent.selectedSegmentIndex] ?? null
						})
					}
					appearance={isDark ? 'dark' : 'light'}
				/>
			)
		},
		{
			items: [
				{
					title: t('marketplace.filter.category'),
					icon: {
						ios: 'square.grid.2x2',
						android: 'category',
						web: 'LayoutGrid'
					},
					customComponent: () => (
						<ThemeMenu
							testID="marketplace-category-filter"
							accessibilityLabel={t('marketplace.filter.category')}
							options={categoryOptions(
								t,
								t('marketplace.filter.allCategories')
							)}
							selected={filter.category ?? 'all'}
							onSelect={(key) =>
								onChange({ ...filter, category: key === 'all' ? null : key })
							}
						/>
					)
				}
			]
		}
	]
	return (
		<View className="pb-2">
			<FormList sections={sections} />
		</View>
	)
}
