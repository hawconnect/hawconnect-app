import type React from 'react'
import { View } from 'react-native'
import { projectLinks } from '@/data/project-links'

import { FeedbackButton } from './action-buttons'

/** Offers a feedback mail when a support address is configured. */
export default function StatusBox({
	error,
	crash
}: {
	error: Error
	crash: boolean
}): React.JSX.Element | null {
	if (!projectLinks.supportEmail) return null
	return (
		<View className="items-center rounded-lg bg-card p-[25px]">
			<FeedbackButton error={error} crash={crash} />
		</View>
	)
}
