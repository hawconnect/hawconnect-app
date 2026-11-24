import type { FeatureCollection } from 'geojson'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { FLOOR_OVERLAY_FADE_MS } from '@/components/Map/map-config'

interface UseFloorOverlaySlideOptions {
	floor: string
	rooms: FeatureCollection | undefined
}

interface OverlaySlot {
	rooms: FeatureCollection | undefined
	opacity: number
	fadeDuration: number
}

export function useFloorOverlaySlide({
	floor,
	rooms
}: UseFloorOverlaySlideOptions): {
	incoming: OverlaySlot
	outgoing: OverlaySlot | null
} {
	const floorRef = useRef(floor)
	const roomsRef = useRef(rooms)
	const incomingRoomsRef = useRef(rooms)
	const animatingRef = useRef(false)

	const [incoming, setIncoming] = useState<OverlaySlot>({
		rooms,
		opacity: 1,
		fadeDuration: 0
	})
	const [outgoing, setOutgoing] = useState<OverlaySlot | null>(null)

	useLayoutEffect(() => {
		roomsRef.current = rooms
		incomingRoomsRef.current = incoming.rooms
	}, [incoming.rooms, rooms])

	useEffect(() => {
		if (floor === floorRef.current) {
			return
		}

		const previousRooms = incomingRoomsRef.current
		const nextRooms = roomsRef.current
		floorRef.current = floor
		animatingRef.current = true

		setOutgoing({ rooms: previousRooms, opacity: 1, fadeDuration: 0 })
		setIncoming({ rooms: nextRooms, opacity: 0, fadeDuration: 0 })

		const frame = requestAnimationFrame(() => {
			setOutgoing({
				rooms: previousRooms,
				opacity: 0,
				fadeDuration: FLOOR_OVERLAY_FADE_MS
			})
			setIncoming({
				rooms: nextRooms,
				opacity: 1,
				fadeDuration: FLOOR_OVERLAY_FADE_MS
			})
		})

		const timeout = setTimeout(() => {
			animatingRef.current = false
			setOutgoing(null)
			setIncoming({ rooms: roomsRef.current, opacity: 1, fadeDuration: 0 })
		}, FLOOR_OVERLAY_FADE_MS)

		return () => {
			cancelAnimationFrame(frame)
			clearTimeout(timeout)
			animatingRef.current = false
		}
	}, [floor])

	useEffect(() => {
		if (animatingRef.current) {
			return
		}
		setIncoming((current) => ({ ...current, rooms }))
	}, [rooms])

	return { incoming, outgoing }
}
