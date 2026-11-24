import type React from 'react'
import { USER_EMPLOYEE, USER_GUEST, USER_STUDENT } from '@/data/constants'
import type { FeatureFlagKey } from '@/lib/feature-flags'
import CalendarCard from './Cards/calendar-card'
import ClubsCard from './Cards/clubs-card'
import EventsCard from './Cards/events-card'
import HawEventsCard from './Cards/haw-events-card'
import LinkCard from './Cards/link-card'
import LoginCard from './Cards/login-card'
import MarketplaceCard from './Cards/marketplace-card'
import NewsCard from './Cards/news-card'
import UpNextCard from './Cards/up-next/up-next-card'

export const AllCards: Card[] = [
	// Up Next / Import calendar: first by default for guests, like the timetable card for students.
	// Default order for new home screens: daily tools first (Quick Links: myHAW, Moodle, email), then
	// official HAW events before club events (often empty), dates after news. Saved layouts keep their own order.
	{
		key: 'login',
		removable: false,
		initial: [USER_GUEST],
		stillVisible: false,
		allowed: [USER_GUEST],
		card: () => <LoginCard />
	},
	{
		key: 'timetable',
		removable: true,
		initial: [USER_STUDENT, USER_EMPLOYEE],
		allowed: [USER_STUDENT, USER_EMPLOYEE],
		card: () => <UpNextCard />
	},
	{
		key: 'links',
		removable: true,
		initial: [USER_STUDENT, USER_EMPLOYEE, USER_GUEST],
		allowed: [USER_STUDENT, USER_EMPLOYEE, USER_GUEST],
		card: () => <LinkCard />
	},
	{
		key: 'hawEvents',
		removable: true,
		initial: [USER_STUDENT, USER_EMPLOYEE, USER_GUEST],
		allowed: [USER_STUDENT, USER_EMPLOYEE, USER_GUEST],
		card: () => <HawEventsCard />
	},
	{
		key: 'events',
		removable: true,
		initial: [USER_STUDENT, USER_EMPLOYEE, USER_GUEST],
		allowed: [USER_STUDENT, USER_EMPLOYEE, USER_GUEST],
		card: () => <EventsCard />
	},
	{
		key: 'news',
		removable: true,
		initial: [USER_STUDENT, USER_EMPLOYEE, USER_GUEST],
		allowed: [USER_STUDENT, USER_EMPLOYEE, USER_GUEST],
		addToSavedLayouts: true,
		card: () => <NewsCard />
	},
	{
		key: 'calendar',
		removable: true,
		initial: [USER_STUDENT, USER_EMPLOYEE, USER_GUEST],
		allowed: [USER_STUDENT, USER_EMPLOYEE, USER_GUEST],
		card: () => <CalendarCard />
	},
	{
		key: 'marketplace',
		removable: true,
		initial: [USER_STUDENT, USER_EMPLOYEE, USER_GUEST],
		allowed: [USER_STUDENT, USER_EMPLOYEE, USER_GUEST],
		addToSavedLayouts: true,
		card: () => <MarketplaceCard />
	},
	{
		key: 'clubs',
		removable: true,
		initial: [USER_STUDENT, USER_EMPLOYEE, USER_GUEST],
		allowed: [USER_STUDENT, USER_EMPLOYEE, USER_GUEST],
		card: () => <ClubsCard />
	}
]

export interface Card {
	key: string
	removable: boolean // can the card be removed
	stillVisible?: boolean // is the card visible to not allowed users
	initial: string[] // for which user kind is the card shown by default
	allowed: string[] // for which user kind is the card allowed
	featureFlag?: FeatureFlagKey
	/** Also add this card once to dashboards the user already customised. */
	addToSavedLayouts?: boolean
	card: () => React.JSX.Element
}

export interface ExtendedCard extends Card {
	text: string
}
