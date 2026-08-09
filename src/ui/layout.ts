import type { UserSettings } from './settings'

export type LayoutState = {
  hasMedia: boolean
  hasRemote: boolean
  localInMain: boolean
}

type LayoutElements = {
  videoStage: HTMLElement
  videoLayout: HTMLElement
  remoteTile: HTMLElement
  localTile: HTMLElement
  waitingTile: HTMLElement
  remoteVideo: HTMLVideoElement
  localVideo: HTMLVideoElement
  remoteLabel: HTMLElement
  layoutBtn: HTMLButtonElement
}

export function applyVideoLayout(
  els: LayoutElements,
  settings: UserSettings,
  state: LayoutState,
): void {
  const { hasMedia, hasRemote, localInMain } = state
  const inCall = hasRemote
  const alone = hasMedia && !hasRemote
  const split = settings.layout === 'split' && (inCall || alone)
  const aloneSplit = alone && split

  els.videoStage.classList.toggle('layout-split', split)
  els.videoStage.classList.toggle('layout-spotlight', !split)
  els.videoStage.classList.toggle('layout-alone', aloneSplit)

  els.videoLayout.dataset.fit = settings.videoFit

  if (aloneSplit) {
    els.waitingTile.classList.remove('hidden')

    if (localInMain) {
      els.remoteTile.classList.remove('hidden')
      els.localTile.classList.add('hidden')
    } else {
      els.remoteTile.classList.add('hidden')
      els.localTile.classList.toggle('hidden', !hasMedia || !settings.showSelfView)
    }
  } else {
    els.remoteTile.classList.remove('hidden')
    els.waitingTile.classList.add('hidden')

    const showLocalTile =
      hasMedia &&
      settings.showSelfView &&
      hasRemote &&
      (split || !localInMain)

    els.localTile.classList.toggle('hidden', !showLocalTile)
  }

  els.remoteLabel.textContent = localInMain && !hasRemote ? 'You' : hasRemote ? 'Participant' : 'You'

  applyMirror(els.remoteVideo, localInMain && settings.mirrorLocal)
  applyMirror(els.localVideo, settings.mirrorLocal)

  const layoutIcon = settings.layout === 'split' ? 'fa-table-columns' : 'fa-expand'
  const layoutIconEl = els.layoutBtn.querySelector('i')
  if (layoutIconEl) {
    layoutIconEl.className = `fa-solid ${layoutIcon}`
  }
  els.layoutBtn.title =
    settings.layout === 'split' ? 'Switch to spotlight' : 'Switch to side by side'
  els.layoutBtn.classList.toggle('active-on', settings.layout === 'split')
}

function applyMirror(video: HTMLVideoElement, enabled: boolean): void {
  video.classList.toggle('mirror', enabled)
}
