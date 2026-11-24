import type React from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, Text, useWindowDimensions, View } from 'react-native'
import ThemeMenu from '@/components/Settings/theme-menu'
import {
	type FormRow,
	formSections,
	priceRuleFor,
	requiresAvailableFrom,
	requiresLocation
} from '@/utils/marketplace-fields'
import {
	activeFields,
	DESCRIPTION_MAX,
	type DraftField,
	LOCATION_MAX,
	type MarketDraft,
	TITLE_MAX
} from '@/utils/marketplace-form'
import { DateField } from './date-field'
import { DetailField } from './detail-fields'
import {
	ChoiceRow,
	FieldShell,
	FormCard,
	FormSectionBlock,
	PillInput,
	useFormColors
} from './form-controls'
import {
	availableFromLabel,
	categoryOptions,
	datePlaceholder,
	invalidFieldText,
	locationHint,
	locationLabel,
	locationPlaceholder,
	priceLabel,
	priceUnitLabel,
	typeChoice
} from './market-labels'

const TYPES = ['offer', 'request'] as const
/** Window width from which short number pairs sit side by side. */
const WIDE = 600

interface PostFormFieldsProps {
	draft: MarketDraft
	set: (patch: Partial<MarketDraft>) => void
	invalid: DraftField | null
	disabled: boolean
	/** Rendered where the form places the `photos` field (housing offers). */
	photos?: React.ReactNode
}

/** One bordered card: category and type first, then the category's sections. */
export function PostFormFields({
	draft,
	set,
	invalid,
	disabled,
	photos
}: PostFormFieldsProps): React.JSX.Element {
	const { t } = useTranslation('marketplace')
	const { width } = useWindowDimensions()
	const { border, primary } = useFormColors()
	const { category, type } = draft
	const rule = priceRuleFor(category, type)
	const active = activeFields(draft)
	const invalidText = (field: DraftField) =>
		invalid === field ? invalidFieldText(t, field, category, type) : null
	const about =
		type === 'request'
			? t('marketplace.form.aboutMe')
			: t('marketplace.form.description')
	const setDetail = (key: string, value: string | string[] | undefined) => {
		const details = { ...draft.details }
		if (value === undefined) delete details[key]
		else details[key] = value
		set({ details })
	}

	const field = (id: string): React.JSX.Element | null => {
		switch (id) {
			case 'title':
				return (
					<FieldShell
						key={id}
						label={t('marketplace.form.titleLabel')}
						required
						error={invalidText('title')}
					>
						<PillInput
							testID="marketplace-form-title"
							accessibilityLabel={t('marketplace.form.titleLabel')}
							placeholder={t('marketplace.form.titlePlaceholder')}
							value={draft.title}
							onChangeText={(title) => set({ title })}
							maxLength={TITLE_MAX}
							editable={!disabled}
							returnKeyType="next"
							invalid={invalid === 'title'}
						/>
					</FieldShell>
				)
			case 'price':
				return (
					<FieldShell
						key={id}
						label={priceLabel(t, category, type)}
						required={rule?.required}
						error={invalidText('price')}
					>
						<PillInput
							testID="marketplace-form-price"
							accessibilityLabel={priceLabel(t, category, type)}
							placeholder={t(
								rule?.required
									? 'marketplace.form.pricePlaceholderRequired'
									: 'marketplace.form.pricePlaceholder'
							)}
							value={draft.price}
							onChangeText={(price) =>
								set({ price: price.replace(/[^\d]/g, '') })
							}
							keyboardType="number-pad"
							maxLength={6}
							editable={!disabled}
							invalid={invalid === 'price'}
						/>
						{rule && rule.units.length > 1 ? (
							<View
								accessibilityRole="radiogroup"
								accessibilityLabel={t('marketplace.form.priceUnit')}
								className="flex-row flex-wrap gap-x-5 pt-1"
							>
								{rule.units.map((unit) => (
									<ChoiceRow
										key={unit}
										kind="radio"
										testID={`marketplace-form-price-unit-${unit}`}
										checked={(draft.priceUnit ?? rule.units[0]) === unit}
										label={priceUnitLabel(t, unit)}
										disabled={disabled}
										onPress={() => set({ priceUnit: unit })}
									/>
								))}
							</View>
						) : null}
					</FieldShell>
				)
			case 'location':
				return (
					<FieldShell
						key={id}
						label={locationLabel(t, category)}
						required={requiresLocation(category)}
						hint={locationHint(t, category)}
						error={invalidText('location')}
					>
						<PillInput
							testID="marketplace-form-location"
							accessibilityLabel={locationLabel(t, category)}
							placeholder={locationPlaceholder(t, category)}
							value={draft.location}
							onChangeText={(location) => set({ location })}
							maxLength={LOCATION_MAX}
							editable={!disabled}
							invalid={invalid === 'location'}
						/>
					</FieldShell>
				)
			case 'availableFrom':
				return (
					<FieldShell
						key={id}
						label={availableFromLabel(t, category, type)}
						required={requiresAvailableFrom(category)}
						error={invalidText('availableFrom')}
					>
						<DateField
							value={draft.availableFrom}
							onChange={(availableFrom) => set({ availableFrom })}
							label={availableFromLabel(t, category, type)}
							placeholder={datePlaceholder(t, category)}
							invalid={invalid === 'availableFrom'}
						/>
					</FieldShell>
				)
			case 'description':
				return (
					<FieldShell
						key={id}
						label={about}
						required
						hint={t('marketplace.form.descriptionFooter')}
						error={invalidText('description')}
					>
						<PillInput
							testID="marketplace-form-description"
							accessibilityLabel={about}
							placeholder={t('marketplace.form.descriptionPlaceholder')}
							value={draft.description}
							onChangeText={(description) => set({ description })}
							maxLength={DESCRIPTION_MAX}
							editable={!disabled}
							multiline
							invalid={invalid === 'description'}
						/>
					</FieldShell>
				)
			case 'photos':
				return photos ? <View key={id}>{photos}</View> : null
			default: {
				const spec = active.find((s) => s.key === id)
				if (!spec) return null
				const control = (
					<DetailField
						key={`${category}-${type}-${id}`}
						spec={spec}
						value={draft.details[id]}
						details={draft.details}
						onChange={(value) => setDetail(id, value)}
						invalidText={
							invalid === `details.${id}`
								? invalidFieldText(t, `details.${id}`, category, type)
								: null
						}
						disabled={disabled}
					/>
				)
				// The four contact fields share one public note under the group.
				return id === 'companyWebsite' ? (
					<View key={control.key} className="gap-2">
						{control}
						<Text className="text-label text-sm">
							{t('marketplace.form.publicNote')}
						</Text>
					</View>
				) : (
					control
				)
			}
		}
	}
	const row = (item: FormRow) => {
		if (!Array.isArray(item)) return field(item)
		return (
			<View
				key={item.join('-')}
				className={width >= WIDE ? 'flex-row gap-3' : 'gap-4'}
			>
				{item.map((id) => (
					<View key={id} className={width >= WIDE ? 'flex-1' : undefined}>
						{field(id)}
					</View>
				))}
			</View>
		)
	}

	return (
		<FormCard>
			<Text className="text-label text-sm">
				{t('marketplace.form.requiredNote')}
			</Text>
			<FormSectionBlock title={t('marketplace.form.listingSection')} first>
				<FieldShell label={t('marketplace.form.category')}>
					<ThemeMenu
						testID="marketplace-form-category"
						accessibilityLabel={t('marketplace.form.category')}
						options={categoryOptions(t)}
						selected={category}
						onSelect={(next) => set({ category: next })}
						field={{ placeholder: t('marketplace.form.category') }}
					/>
				</FieldShell>
				<FieldShell label={t('marketplace.form.typeQuestion')}>
					<View
						accessibilityRole="radiogroup"
						accessibilityLabel={t('marketplace.form.typeQuestion')}
						className="gap-3"
					>
						{TYPES.map((choice) => {
							const selected = type === choice
							const text = typeChoice(t, category, choice)
							return (
								<Pressable
									key={choice}
									testID={`marketplace-form-type-${choice}`}
									accessibilityRole="radio"
									accessibilityState={{ selected, disabled }}
									accessibilityLabel={`${text.title}. ${text.subtitle}`}
									disabled={disabled}
									onPress={() => set({ type: choice })}
									className={`px-4 py-3.5 active:opacity-70 ${
										selected ? 'bg-primary-background' : 'bg-card'
									}`}
									style={{
										borderRadius: 12,
										borderWidth: selected ? 2 : 1,
										borderColor: selected ? primary : border
									}}
								>
									<Text
										className={`text-base font-semibold ${selected ? 'text-primary' : 'text-text'}`}
									>
										{text.title}
									</Text>
									<Text className="text-label text-sm pt-0.5">
										{text.subtitle}
									</Text>
								</Pressable>
							)
						})}
					</View>
				</FieldShell>
			</FormSectionBlock>
			{formSections(category, type).map((section) => (
				<FormSectionBlock
					key={section.id}
					title={t(`marketplace.form.sections.${section.id}`)}
					first={false}
				>
					{section.rows.map(row)}
				</FormSectionBlock>
			))}
		</FormCard>
	)
}
