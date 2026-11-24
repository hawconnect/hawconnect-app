// Mirrors hawconnect-backend/src/marketplace/validation.ts; both repos pin
// the same registry in tests, so a drift fails one of them.
export type MarketType = 'offer' | 'request'
export type MarketCategory = 'housing' | 'jobs'
export type MarketPriceUnit = 'once' | 'perMonth' | 'perHour'

export const MARKET = {
	shortTextMax: 80,
	longTextMax: 1000,
	urlMax: 300,
	emailMax: 254
} as const

export type FieldSpec = {
	key: string
	kind:
		| 'text'
		| 'longText'
		| 'number'
		| 'date'
		| 'select'
		| 'multi'
		| 'url'
		| 'email'
	required: boolean
	options?: readonly string[]
	min?: number
	max?: number
}

export type PriceRule = {
	units: readonly MarketPriceUnit[]
	required: boolean
	free: boolean
}

const JOB_TYPES = [
	'fullTime',
	'partTime',
	'workingStudent',
	'internship',
	'minijob',
	'temporary'
] as const
const LANGUAGES = ['english', 'german', 'other'] as const
const HOUSING_TYPES = [
	'sharedFlatRoom',
	'privateRoom',
	'studio',
	'apartment'
] as const
const DURATIONS = ['short', 'medium', 'long', 'flexible'] as const

const select = (
	key: string,
	required: boolean,
	options: readonly string[]
): FieldSpec => ({ key, kind: 'select', required, options })
const multi = (
	key: string,
	required: boolean,
	options: readonly string[]
): FieldSpec => ({ key, kind: 'multi', required, options })
const simple = (
	key: string,
	kind: 'text' | 'longText' | 'date' | 'url' | 'email',
	required = false
): FieldSpec => ({ key, kind, required })
const num = (key: string, min: number, max: number): FieldSpec => ({
	key,
	kind: 'number',
	required: false,
	min,
	max
})

export const MARKET_FIELDS: Record<
	MarketCategory,
	Record<MarketType, FieldSpec[]>
> = {
	jobs: {
		offer: [
			simple('employer', 'text', true),
			select('jobType', true, JOB_TYPES),
			select('workMode', true, ['onSite', 'hybrid', 'remote']),
			multi('languages', true, LANGUAGES),
			num('weeklyHours', 1, 60),
			simple('requirements', 'longText'),
			select('applyMethod', true, ['url', 'email']),
			simple('applyUrl', 'url'),
			simple('applyEmail', 'email'),
			simple('applyDeadline', 'date'),
			simple('contactName', 'text'),
			simple('contactRole', 'text'),
			simple('contactEmail', 'email'),
			simple('companyWebsite', 'url')
		],
		request: [
			select('jobType', true, JOB_TYPES),
			select('workMode', false, ['onSite', 'hybrid', 'remote', 'flexible']),
			multi('languages', true, LANGUAGES),
			simple('skills', 'longText'),
			simple('portfolioUrl', 'url')
		]
	},
	housing: {
		offer: [
			select('housingType', true, HOUSING_TYPES),
			select('rentalDuration', true, DURATIONS),
			num('deposit', 0, 100000),
			multi('rentIncludes', false, [
				'electricity',
				'heating',
				'internet',
				'utilities'
			]),
			num('sizeSqm', 1, 1000),
			num('rooms', 1, 20),
			select('furnished', false, ['yes', 'no', 'partly']),
			multi('facilities', false, [
				'washingMachine',
				'kitchen',
				'privateBathroom',
				'balcony',
				'elevator',
				'wifi'
			])
		],
		request: [
			select('housingType', true, HOUSING_TYPES),
			select('rentalDuration', false, DURATIONS),
			select('furnished', false, ['preferred', 'notNeeded', 'any']),
			select('occupation', true, [
				'student',
				'professional',
				'intern',
				'other'
			]),
			multi('languages', false, LANGUAGES)
		]
	}
}

const rule = (
	units: readonly MarketPriceUnit[],
	required: boolean,
	free: boolean
): PriceRule => ({ units, required, free })

export const MARKET_PRICE: Record<
	MarketCategory,
	Record<MarketType, PriceRule>
> = {
	jobs: {
		offer: rule(['perHour', 'perMonth'], false, false),
		request: rule(['perHour', 'perMonth'], false, false)
	},
	housing: {
		offer: rule(['perMonth'], true, false),
		request: rule(['perMonth'], true, false)
	}
}

/** Fields of a category and type; empty for unknown values (old listings). */
export const fieldsFor = (category: string, type: string): FieldSpec[] =>
	(MARKET_FIELDS as Record<string, Record<string, FieldSpec[]>>)[category]?.[
		type
	] ?? []

/** Price rule of a category and type, or null for unknown values. */
export const priceRuleFor = (
	category: string,
	type: string
): PriceRule | null =>
	(MARKET_PRICE as Record<string, Record<string, PriceRule>>)[category]?.[
		type
	] ?? null

/** Only housing can be marked reserved. */
export const canReserve = (category: string): boolean => category === 'housing'

/** Only housing offers carry photos. */
export const photosAllowed = (category: string, type: string): boolean =>
	type === 'offer' && category === 'housing'

/** Shared columns a category needs on top of its details. */
export const requiresLocation = (category: string) =>
	category === 'jobs' || category === 'housing'
export const requiresAvailableFrom = (category: string) =>
	category === 'housing'

export type FormSectionId =
	| 'basic'
	| 'employment'
	| 'jobDescription'
	| 'application'
	| 'lookingFor'
	| 'aboutYou'
	| 'rent'
	| 'place'
	| 'descriptionPhotos'
/** A field id (registry key or shared field) or two short fields side by side. */
export type FormRow = string | [string, string]
export interface FormSection {
	id: FormSectionId
	rows: FormRow[]
}

const section = (id: FormSectionId, ...rows: FormRow[]): FormSection => ({
	id,
	rows
})

const FORM_SECTIONS: Record<
	MarketCategory,
	Record<MarketType, FormSection[]>
> = {
	jobs: {
		offer: [
			section('basic', 'title', 'employer'),
			section(
				'employment',
				'jobType',
				'workMode',
				'location',
				['price', 'weeklyHours'],
				'languages',
				'availableFrom'
			),
			section('jobDescription', 'description', 'requirements'),
			section(
				'application',
				'applyMethod',
				'applyUrl',
				'applyEmail',
				'applyDeadline',
				'contactName',
				'contactRole',
				'contactEmail',
				'companyWebsite'
			)
		],
		request: [
			section('basic', 'title'),
			section(
				'lookingFor',
				'jobType',
				'workMode',
				'location',
				'price',
				'languages',
				'availableFrom'
			),
			section('aboutYou', 'description', 'skills', 'portfolioUrl')
		]
	},
	housing: {
		offer: [
			section('basic', 'title', 'housingType'),
			section(
				'rent',
				['price', 'deposit'],
				'rentIncludes',
				'availableFrom',
				'rentalDuration'
			),
			section(
				'place',
				['sizeSqm', 'rooms'],
				'furnished',
				'facilities',
				'location'
			),
			section('descriptionPhotos', 'description', 'photos')
		],
		request: [
			section('basic', 'title', 'housingType'),
			section(
				'lookingFor',
				'price',
				'location',
				'availableFrom',
				'rentalDuration',
				'furnished'
			),
			section('aboutYou', 'occupation', 'languages', 'description')
		]
	}
}

/** Ordered form sections of a category and type; empty for unknown values. */
export const formSections = (category: string, type: string): FormSection[] =>
	(FORM_SECTIONS as Record<string, Record<string, FormSection[]>>)[category]?.[
		type
	] ?? []

const MENU_FIELDS = ['jobType', 'housingType']

/** Radio rows for short single-choice lists, a pull-down menu for long ones. */
export const selectStyle = (spec: FieldSpec): 'radio' | 'menu' =>
	MENU_FIELDS.includes(spec.key) || (spec.options?.length ?? 0) > 4
		? 'menu'
		: 'radio'
