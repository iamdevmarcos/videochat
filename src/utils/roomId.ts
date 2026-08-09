const ROOM_PATTERN = /^vc-[a-z0-9]{8}$/

export function generateRoomId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(4))
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `vc-${hex}`
}

export function isValidRoomId(roomId: string): boolean {
  return ROOM_PATTERN.test(roomId)
}

export function parseRoomInput(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) {
    return null
  }

  if (isValidRoomId(trimmed)) {
    return trimmed
  }

  try {
    const url = new URL(trimmed)
    const room = url.searchParams.get('room')
    if (room && isValidRoomId(room)) {
      return room
    }
  } catch {
    return null
  }

  return null
}

export function getRoomFromUrl(): string | null {
  const room = new URLSearchParams(window.location.search).get('room')
  if (!room || !isValidRoomId(room)) {
    return null
  }
  return room
}

export function buildRoomUrl(roomId: string): string {
  if (!isValidRoomId(roomId)) {
    throw new Error('Invalid room id')
  }
  const url = new URL(window.location.href)
  url.search = ''
  url.searchParams.set('room', roomId)
  return url.toString()
}
