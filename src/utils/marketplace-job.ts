import type { CommunityIcon, WebIcon } from '@/components/Universal/icon'
import type { MaterialIcon } from '@/types/material-icons'
import { mailtoLink, safeHttpsUrl } from './marketplace-apply'

type Details = Record<string, string | number | string[] | null | undefined>

const text = (value: unknown): string =>
	typeof value === 'string' ? value.trim() : ''

/**
 * The line under the title: `employer · location` for job offers, otherwise
 * the location. Null when there is nothing to show.
 */
export function listingSubtitle(post: {
	category: string
	type: string
	location: string | null
	details: Details
}): string | null {
	const location = text(post.location)
	const employer =
		post.category === 'jobs' && post.type === 'offer'
			? text(post.details.employer)
			: ''
	return [employer, location].filter(Boolean).join(' · ') || null
}

export type DeadlineState =
	| { kind: 'open'; days: number }
	| { kind: 'today' }
	| { kind: 'closed' }

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/

/** `now` as YYYY-MM-DD in the zone; the device date where Intl cannot. */
function calendarDay(now: Date, timeZone: string): string {
	const pad = (n: number) => String(n).padStart(2, '0')
	try {
		const parts = new Intl.DateTimeFormat('en-CA', {
			timeZone,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		}).formatToParts(now)
		const part = (type: string) =>
			parts.find((p) => p.type === type)?.value ?? ''
		const [y, m, d] = [part('year'), part('month'), part('day')].map(Number)
		if (y > 999 && m >= 1 && m <= 12 && d >= 1 && d <= 31)
			return `${y}-${pad(m)}-${pad(d)}`
	} catch {
		// Hermes on iOS may lack time zone support.
	}
	return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

const utcDay = (day: string): number => {
	const m = DAY.exec(day)
	return m ? Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : Number.NaN
}

/** Calendar-day comparison of a 'YYYY-MM-DD' deadline with today. */
export function deadlineState(
	deadline: string | null | undefined,
	now: Date,
	timeZone = 'Europe/Berlin'
): DeadlineState | null {
	if (typeof deadline !== 'string' || !DAY.test(deadline)) return null
	const today = utcDay(calendarDay(now, timeZone))
	const end = utcDay(deadline)
	if (Number.isNaN(today) || Number.isNaN(end)) return null
	const days = Math.round((end - today) / 86_400_000)
	if (days < 0) return { kind: 'closed' }
	return days === 0 ? { kind: 'today' } : { kind: 'open', days }
}

export interface ContactLinks {
	name?: string
	role?: string
	email?: { text: string; href: string }
	website?: { text: string; href: string }
}

/** The job contact block: only filled, safe fields. Null when none is left. */
export function contactLinks(details: Details): ContactLinks | null {
	const out: ContactLinks = {}
	const name = text(details.contactName)
	const role = text(details.contactRole)
	const email = text(details.contactEmail)
	const site = safeHttpsUrl(details.companyWebsite)
	if (name) out.name = name
	if (role) out.role = role
	const href = mailtoLink(email)
	if (href) out.email = { text: email, href }
	if (site)
		out.website = {
			text: site.replace(/^https:\/\//, '').replace(/\/$/, ''),
			href: site
		}
	return Object.keys(out).length ? out : null
}

export interface DetailIcon {
	ios: string
	android: MaterialIcon | CommunityIcon
	web: WebIcon
}

const icon = (
	ios: string,
	android: MaterialIcon,
	web: WebIcon
): DetailIcon => ({ ios, android, web })

const ICONS: Record<string, DetailIcon> = {
	price: icon('eurosign.circle', 'euro', 'Euro'),
	location: icon('mappin.and.ellipse', 'location_on', 'MapPin'),
	availableFrom: icon('calendar', 'calendar_today', 'Calendar'),
	employer: icon('building.2', 'work', 'Building'),
	jobType: icon('briefcase', 'work', 'Briefcase'),
	workMode: icon('house', 'home', 'House'),
	languages: icon('character.bubble', 'translate', 'Languages'),
	weeklyHours: icon('clock', 'schedule', 'Clock'),
	requirements: icon('checklist', 'checklist', 'ListChecks'),
	applyMethod: icon('paperplane', 'send', 'Send'),
	applyUrl: icon('link', 'link', 'Link'),
	applyEmail: icon('envelope', 'mail', 'Mail'),
	applyDeadline: icon('calendar.badge.clock', 'event', 'CalendarClock'),
	contactName: icon('person', 'person', 'User'),
	contactRole: icon('person.text.rectangle', 'badge', 'BadgeCheck'),
	contactEmail: icon('envelope', 'mail', 'Mail'),
	companyWebsite: icon('globe', 'language', 'Globe'),
	skills: icon('star', 'star', 'Star'),
	portfolioUrl: icon('link', 'link', 'Link'),
	housingType: icon('building', 'apartment', 'Hotel'),
	rentalDuration: icon('calendar', 'calendar_today', 'Calendar'),
	deposit: icon('banknote', 'payments', 'Banknote'),
	rentIncludes: icon('bolt', 'bolt', 'Zap'),
	sizeSqm: icon('ruler', 'square_foot', 'Ruler'),
	rooms: icon('door.left.hand.open', 'meeting_room', 'DoorOpen'),
	furnished: icon('chair.lounge', 'weekend', 'Sofa'),
	facilities: icon('sparkles', 'star', 'Sparkles'),
	occupation: icon('person.crop.circle', 'account_circle', 'CircleUser')
}

/** Platform icon names of a detail row; a neutral tag for unknown keys. */
export const detailIcon = (key: string): DetailIcon =>
	ICONS[key] ?? icon('tag', 'sell', 'Tag')
