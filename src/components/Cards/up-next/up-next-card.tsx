import type React from 'react'
import LoginCard from '@/components/Cards/login-card'

/**
 * The students' and staff's "What's Next" card: the imported calendar's next
 * classes. HAWConnect has no university timetable API, so they come from the
 * imported calendar.
 */
export default function UpNextCard(): React.JSX.Element {
	return <LoginCard />
}
