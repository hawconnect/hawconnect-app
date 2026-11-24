import { describe, expect, it } from 'bun:test'
import {
	canReserve,
	type FieldSpec,
	fieldsFor,
	formSections,
	MARKET_FIELDS,
	MARKET_PRICE,
	photosAllowed,
	selectStyle
} from '../marketplace-fields'

const JOB_TYPES = [
	'fullTime',
	'partTime',
	'workingStudent',
	'internship',
	'minijob',
	'temporary'
]
const HOUSING_TYPES = ['sharedFlatRoom', 'privateRoom', 'studio', 'apartment']
const DURATIONS = ['short', 'medium', 'long', 'flexible']
const LANGUAGES = ['english', 'german', 'other']

const REGISTRY = {
	jobs: {
		offer: [
			{ key: 'employer', kind: 'text', required: true },
			{
				key: 'jobType',
				kind: 'select',
				required: true,
				options: JOB_TYPES
			},
			{
				key: 'workMode',
				kind: 'select',
				required: true,
				options: ['onSite', 'hybrid', 'remote']
			},
			{
				key: 'languages',
				kind: 'multi',
				required: true,
				options: LANGUAGES
			},
			{
				key: 'weeklyHours',
				kind: 'number',
				required: false,
				min: 1,
				max: 60
			},
			{ key: 'requirements', kind: 'longText', required: false },
			{
				key: 'applyMethod',
				kind: 'select',
				required: true,
				options: ['url', 'email']
			},
			{ key: 'applyUrl', kind: 'url', required: false },
			{ key: 'applyEmail', kind: 'email', required: false },
			{ key: 'applyDeadline', kind: 'date', required: false },
			{ key: 'contactName', kind: 'text', required: false },
			{ key: 'contactRole', kind: 'text', required: false },
			{ key: 'contactEmail', kind: 'email', required: false },
			{ key: 'companyWebsite', kind: 'url', required: false }
		],
		request: [
			{
				key: 'jobType',
				kind: 'select',
				required: true,
				options: JOB_TYPES
			},
			{
				key: 'workMode',
				kind: 'select',
				required: false,
				options: ['onSite', 'hybrid', 'remote', 'flexible']
			},
			{
				key: 'languages',
				kind: 'multi',
				required: true,
				options: LANGUAGES
			},
			{ key: 'skills', kind: 'longText', required: false },
			{ key: 'portfolioUrl', kind: 'url', required: false }
		]
	},
	housing: {
		offer: [
			{
				key: 'housingType',
				kind: 'select',
				required: true,
				options: HOUSING_TYPES
			},
			{
				key: 'rentalDuration',
				kind: 'select',
				required: true,
				options: DURATIONS
			},
			{
				key: 'deposit',
				kind: 'number',
				required: false,
				min: 0,
				max: 100000
			},
			{
				key: 'rentIncludes',
				kind: 'multi',
				required: false,
				options: ['electricity', 'heating', 'internet', 'utilities']
			},
			{
				key: 'sizeSqm',
				kind: 'number',
				required: false,
				min: 1,
				max: 1000
			},
			{ key: 'rooms', kind: 'number', required: false, min: 1, max: 20 },
			{
				key: 'furnished',
				kind: 'select',
				required: false,
				options: ['yes', 'no', 'partly']
			},
			{
				key: 'facilities',
				kind: 'multi',
				required: false,
				options: [
					'washingMachine',
					'kitchen',
					'privateBathroom',
					'balcony',
					'elevator',
					'wifi'
				]
			}
		],
		request: [
			{
				key: 'housingType',
				kind: 'select',
				required: true,
				options: HOUSING_TYPES
			},
			{
				key: 'rentalDuration',
				kind: 'select',
				required: false,
				options: DURATIONS
			},
			{
				key: 'furnished',
				kind: 'select',
				required: false,
				options: ['preferred', 'notNeeded', 'any']
			},
			{
				key: 'occupation',
				kind: 'select',
				required: true,
				options: ['student', 'professional', 'intern', 'other']
			},
			{
				key: 'languages',
				kind: 'multi',
				required: false,
				options: LANGUAGES
			}
		]
	}
}

const PRICES = {
	jobs: {
		offer: { units: ['perHour', 'perMonth'], required: false, free: false },
		request: { units: ['perHour', 'perMonth'], required: false, free: false }
	},
	housing: {
		offer: { units: ['perMonth'], required: true, free: false },
		request: { units: ['perMonth'], required: true, free: false }
	}
}

describe('registry', () => {
	it('matches the backend', () => {
		expect(MARKET_FIELDS as unknown).toEqual(REGISTRY)
		expect(MARKET_PRICE as unknown).toEqual(PRICES)
	})
	it('fieldsFor returns the fields of a category and type', () => {
		expect(fieldsFor('housing', 'offer') as unknown).toEqual(
			REGISTRY.housing.offer
		)
		expect(fieldsFor('jobs', 'request').map((f) => f.key)).toEqual([
			'jobType',
			'workMode',
			'languages',
			'skills',
			'portfolioUrl'
		])
	})
	it('fieldsFor is empty for unknown categories or types', () => {
		expect(fieldsFor('other', 'offer')).toEqual([])
		expect(fieldsFor('jobs', 'swap')).toEqual([])
	})
	it('only housing can be reserved', () => {
		expect(canReserve('housing')).toBe(true)
		expect(canReserve('jobs')).toBe(false)
		expect(canReserve('buySell')).toBe(false)
	})
})

describe('photosAllowed', () => {
	it('photos are offered for housing offers only', () => {
		expect(photosAllowed('housing', 'offer')).toBe(true)
		expect(photosAllowed('housing', 'request')).toBe(false)
		expect(photosAllowed('jobs', 'offer')).toBe(false)
		expect(photosAllowed('buySell', 'offer')).toBe(false)
		expect(photosAllowed('other', 'offer')).toBe(false)
	})
})

describe('formSections', () => {
	const flat = (category: string, type: string) =>
		formSections(category, type).flatMap((s) =>
			s.rows.flatMap((row) => (Array.isArray(row) ? row : [row]))
		)
	for (const category of ['housing', 'jobs'] as const)
		for (const type of ['offer', 'request'] as const)
			it(`places every ${category} ${type} field exactly once`, () => {
				const expected = [
					'title',
					'price',
					'location',
					'availableFrom',
					'description',
					...(photosAllowed(category, type) ? ['photos'] : []),
					...fieldsFor(category, type).map((f) => f.key)
				]
				expect([...flat(category, type)].sort()).toEqual([...expected].sort())
			})
	it('orders the sections as the owner asked', () => {
		const ids = (c: string, t: string) => formSections(c, t).map((s) => s.id)
		expect(ids('jobs', 'offer')).toEqual([
			'basic',
			'employment',
			'jobDescription',
			'application'
		])
		expect(ids('jobs', 'request')).toEqual(['basic', 'lookingFor', 'aboutYou'])
		expect(ids('housing', 'offer')).toEqual([
			'basic',
			'rent',
			'place',
			'descriptionPhotos'
		])
		expect(ids('housing', 'request')).toEqual([
			'basic',
			'lookingFor',
			'aboutYou'
		])
	})
	it('pairs wage with weekly hours, rent with deposit, size with rooms', () => {
		const pairs = (c: string, t: string) =>
			formSections(c, t)
				.flatMap((s) => s.rows)
				.filter(Array.isArray)
		expect(pairs('jobs', 'offer')).toEqual([['price', 'weeklyHours']])
		expect(pairs('housing', 'offer')).toEqual([
			['price', 'deposit'],
			['sizeSqm', 'rooms']
		])
	})
	it('puts the contact fields after the deadline in the application section', () => {
		const application = formSections('jobs', 'offer').find(
			(s) => s.id === 'application'
		)
		expect(application?.rows).toEqual([
			'applyMethod',
			'applyUrl',
			'applyEmail',
			'applyDeadline',
			'contactName',
			'contactRole',
			'contactEmail',
			'companyWebsite'
		])
	})
	it('is empty for unknown values', () => {
		expect(formSections('other', 'offer')).toEqual([])
	})
})

describe('selectStyle', () => {
	it('uses radios for short lists and a menu for job and housing type', () => {
		const style = (c: string, t: string, key: string) =>
			selectStyle(fieldsFor(c, t).find((f) => f.key === key) as FieldSpec)
		expect(style('jobs', 'offer', 'workMode')).toBe('radio')
		expect(style('jobs', 'offer', 'applyMethod')).toBe('radio')
		expect(style('housing', 'offer', 'rentalDuration')).toBe('radio')
		expect(style('housing', 'request', 'occupation')).toBe('radio')
		expect(style('jobs', 'offer', 'jobType')).toBe('menu')
		expect(style('housing', 'offer', 'housingType')).toBe('menu')
	})
})
