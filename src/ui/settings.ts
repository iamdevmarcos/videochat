export type LayoutMode = 'spotlight' | 'split'
export type VideoFit = 'cover' | 'contain'

export type UserSettings = {
  layout: LayoutMode
  mirrorLocal: boolean
  videoFit: VideoFit
  showSelfView: boolean
  videoDeviceId: string | null
  audioDeviceId: string | null
}

const STORAGE_KEY = 'videochat-settings'

const DEFAULTS: UserSettings = {
  layout: 'spotlight',
  mirrorLocal: true,
  videoFit: 'cover',
  showSelfView: true,
  videoDeviceId: null,
  audioDeviceId: null,
}

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { ...DEFAULTS }
    }
    const parsed = JSON.parse(raw) as Partial<UserSettings>
    return {
      layout: parsed.layout === 'split' ? 'split' : 'spotlight',
      mirrorLocal: parsed.mirrorLocal !== false,
      videoFit: parsed.videoFit === 'contain' ? 'contain' : 'cover',
      showSelfView: parsed.showSelfView !== false,
      videoDeviceId: typeof parsed.videoDeviceId === 'string' ? parsed.videoDeviceId : null,
      audioDeviceId: typeof parsed.audioDeviceId === 'string' ? parsed.audioDeviceId : null,
    }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveSettings(settings: UserSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}
