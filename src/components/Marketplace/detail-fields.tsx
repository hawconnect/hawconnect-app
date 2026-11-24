import type React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import ThemeMenu from '@/components/Settings/theme-menu'
import { type FieldSpec, MARKET, selectStyle } from '@/utils/marketplace-fields'
import { isRequiredNow, type MarketDraft } from '@/utils/marketplace-form'
import { DateField } from './date-field'
import { ChoiceRow, FieldShell, PillInput } from './form-controls'
import { fieldLabel, fieldPlaceholder, optionLabel } from './market-labels'

type Details = MarketDraft['details']

interface DetailFieldProps {
	spec: FieldSpec
	value: string | string[] | undefined
	details: Details
	onChange: (value: string | string[] | undefined) => void
	invalidText: string | null
	disabled: boolean
}

/** One registry field: pill input, select, radio or checkbox rows, or date. */
export function DetailField({
	spec,
	value,
	details,
	onChange,
	invalidText,
	disabled
}: DetailFieldProps): React.JSX.Element {
	const { t } = useTranslation('marketplace')
	const name = fieldLabel(t, spec.key)
	const required = isRequiredNow({ details }, spec)
	const testID = `marketplace-form-${spec.key}`
	const text = typeof value === 'string' ? value : ''
	const selected = Array.isArray(value) ? value : []
	const invalid = invalidText != null
	const hint =
		spec.kind === 'url'
			? t('marketplace.form.urlHint')
			: spec.key === 'applyEmail'
				? t('marketplace.form.emailNote')
				: null
	let control: React.JSX.Element
	switch (spec.kind) {
		case 'select': {
			const options = (spec.options ?? []).map((option) => ({
				key: option,
				title: optionLabel(t, spec.key, option)
			}))
			if (selectStyle(spec) === 'radio') {
				control = (
					<View accessibilityRole="radiogroup" accessibilityLabel={name}>
						{options.map((option) => (
							<ChoiceRow
								key={option.key}
								kind="radio"
								testID={`${testID}-${option.key}`}
								checked={text === option.key}
								label={option.title}
								disabled={disabled}
								// An optional choice can be cleared by pressing it again.
								onPress={() =>
									onChange(
										text === option.key && !required ? undefined : option.key
									)
								}
							/>
						))}
					</View>
				)
				break
			}
			control = (
				<ThemeMenu
					testID={testID}
					accessibilityLabel={name}
					options={
						required && text !== ''
							? options
							: [{ key: '', title: t('marketplace.form.choose') }, ...options]
					}
					selected={text}
					onSelect={(key) => onChange(key === '' ? undefined : key)}
					field={{
						placeholder: fieldPlaceholder(t, spec.key),
						invalid
					}}
				/>
			)
			break
		}
		case 'multi':
			control = (
				<View accessibilityLabel={name}>
					{(spec.options ?? []).map((option) => {
						const checked = selected.includes(option)
						return (
							<ChoiceRow
								key={option}
								kind="checkbox"
								testID={`${testID}-${option}`}
								checked={checked}
								label={optionLabel(t, spec.key, option)}
								disabled={disabled}
								onPress={() => {
									const next = checked
										? selected.filter((o) => o !== option)
										: [...selected, option]
									onChange(next.length ? next : undefined)
								}}
							/>
						)
					})}
				</View>
			)
			break
		case 'date':
			control = (
				<DateField
					value={text || null}
					onChange={(next) => onChange(next ?? undefined)}
					label={name}
					placeholder={fieldPlaceholder(t, spec.key)}
					invalid={invalid}
					testID={testID}
				/>
			)
			break
		default: {
			const numeric = spec.kind === 'number'
			const link = spec.kind === 'url' || spec.kind === 'email'
			control = (
				<PillInput
					testID={testID}
					accessibilityLabel={name}
					placeholder={fieldPlaceholder(t, spec.key)}
					value={text}
					invalid={invalid}
					onChangeText={(next) =>
						onChange((numeric ? next.replace(/[^\d]/g, '') : next) || undefined)
					}
					editable={!disabled}
					multiline={spec.kind === 'longText'}
					keyboardType={
						numeric
							? 'number-pad'
							: spec.kind === 'email'
								? 'email-address'
								: spec.kind === 'url'
									? 'url'
									: 'default'
					}
					autoComplete={link ? 'off' : undefined}
					autoCapitalize={link ? 'none' : undefined}
					autoCorrect={link ? false : undefined}
					maxLength={
						spec.kind === 'url'
							? MARKET.urlMax
							: spec.kind === 'email'
								? MARKET.emailMax
								: spec.kind === 'longText'
									? MARKET.longTextMax
									: numeric
										? String(spec.max ?? 0).length
										: MARKET.shortTextMax
					}
				/>
			)
		}
	}
	return (
		<FieldShell
			label={name}
			required={required}
			hint={hint}
			error={invalidText}
		>
			{control}
		</FieldShell>
	)
}
