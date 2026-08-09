import { CallSession, type CallStatus } from '../peer/callSession'
import { listMediaDevices, type MediaDeviceChoice } from '../peer/media'
import { copyToClipboard } from '../utils/clipboard'
import { buildRoomUrl, generateRoomId, getRoomFromUrl, parseRoomInput } from '../utils/roomId'
import { applyVideoLayout } from './layout'
import { loadSettings, saveSettings, type UserSettings } from './settings'

type Elements = {
  meetHeader: HTMLElement
  meetControls: HTMLElement
  lobby: HTMLElement
  videoStage: HTMLElement
  videoLayout: HTMLElement
  remoteTile: HTMLElement
  localTile: HTMLElement
  waitingTile: HTMLElement
  createLinkBtn: HTMLButtonElement
  newCallBtn: HTMLButtonElement
  joinRoomBtn: HTMLButtonElement
  roomInput: HTMLInputElement
  joinError: HTMLElement
  volumeBtn: HTMLButtonElement
  micBtn: HTMLButtonElement
  cameraBtn: HTMLButtonElement
  layoutBtn: HTMLButtonElement
  fitBtn: HTMLButtonElement
  fitBtnLabel: HTMLElement
  fullscreenBtn: HTMLButtonElement
  hangUpBtn: HTMLButtonElement
  acceptBtn: HTMLButtonElement
  declineBtn: HTMLButtonElement
  settingsBtn: HTMLButtonElement
  lobbySettingsBtn: HTMLButtonElement
  closeSettingsBtn: HTMLButtonElement
  settingsPanel: HTMLElement
  settingsBackdrop: HTMLElement
  layoutSelect: HTMLSelectElement
  cameraSelect: HTMLSelectElement
  micSelect: HTMLSelectElement
  mirrorToggle: HTMLInputElement
  showSelfToggle: HTMLInputElement
  remoteVideo: HTMLVideoElement
  localVideo: HTMLVideoElement
  remoteLabel: HTMLElement
  statusBadge: HTMLElement
  roomTitle: HTMLElement
  videoPlaceholder: HTMLElement
  placeholderText: HTMLElement
  waitingTileText: HTMLElement
  incomingOverlay: HTMLElement
  incomingRoomLabel: HTMLElement
}

function requireEl<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id)
  if (!el) {
    throw new Error(`Missing element #${id}`)
  }
  return el as T
}

function getElements(): Elements {
  return {
    meetHeader: requireEl('meetHeader'),
    meetControls: requireEl('meetControls'),
    lobby: requireEl('lobby'),
    videoStage: requireEl('videoStage'),
    videoLayout: requireEl('videoLayout'),
    remoteTile: requireEl('remoteTile'),
    localTile: requireEl('localTile'),
    waitingTile: requireEl('waitingTile'),
    createLinkBtn: requireEl('createLinkBtn'),
    newCallBtn: requireEl('newCallBtn'),
    joinRoomBtn: requireEl('joinRoomBtn'),
    roomInput: requireEl('roomInput'),
    joinError: requireEl('joinError'),
    volumeBtn: requireEl('volumeBtn'),
    micBtn: requireEl('micBtn'),
    cameraBtn: requireEl('cameraBtn'),
    layoutBtn: requireEl('layoutBtn'),
    fitBtn: requireEl('fitBtn'),
    fitBtnLabel: requireEl('fitBtnLabel'),
    fullscreenBtn: requireEl('fullscreenBtn'),
    hangUpBtn: requireEl('hangUpBtn'),
    acceptBtn: requireEl('acceptBtn'),
    declineBtn: requireEl('declineBtn'),
    settingsBtn: requireEl('settingsBtn'),
    lobbySettingsBtn: requireEl('lobbySettingsBtn'),
    closeSettingsBtn: requireEl('closeSettingsBtn'),
    settingsPanel: requireEl('settingsPanel'),
    settingsBackdrop: requireEl('settingsBackdrop'),
    layoutSelect: requireEl('layoutSelect'),
    cameraSelect: requireEl('cameraSelect'),
    micSelect: requireEl('micSelect'),
    mirrorToggle: requireEl('mirrorToggle'),
    showSelfToggle: requireEl('showSelfToggle'),
    remoteVideo: requireEl('remoteVideo'),
    localVideo: requireEl('localVideo'),
    remoteLabel: requireEl('remoteLabel'),
    statusBadge: requireEl('statusBadge'),
    roomTitle: requireEl('roomTitle'),
    videoPlaceholder: requireEl('videoPlaceholder'),
    placeholderText: requireEl('placeholderText'),
    waitingTileText: requireEl('waitingTileText'),
    incomingOverlay: requireEl('incomingOverlay'),
    incomingRoomLabel: requireEl('incomingRoomLabel'),
  }
}

function setButtonActiveOff(button: HTMLButtonElement, off: boolean, onIcon: string, offIcon: string): void {
  button.classList.toggle('active-off', off)
  const icon = button.querySelector('i')
  if (icon) {
    icon.className = `fa-solid ${off ? offIcon : onIcon}`
  }
}

function showMeetingUi(els: Elements): void {
  els.lobby.classList.add('hidden')
  els.videoStage.classList.remove('hidden')
  els.meetHeader.classList.remove('hidden')
  els.meetControls.classList.remove('hidden')
}

function showLobbyUi(els: Elements): void {
  els.lobby.classList.remove('hidden')
  els.videoStage.classList.add('hidden')
  els.meetHeader.classList.add('hidden')
  els.meetControls.classList.add('hidden')
  els.localTile.classList.add('hidden')
  els.incomingOverlay.classList.add('hidden')
  closeSettings(els)
}

function openSettings(els: Elements): void {
  els.settingsPanel.classList.remove('hidden')
  els.settingsBackdrop.classList.remove('hidden')
}

function closeSettings(els: Elements): void {
  els.settingsPanel.classList.add('hidden')
  els.settingsBackdrop.classList.add('hidden')
}

function fillDeviceSelect(
  select: HTMLSelectElement,
  devices: MediaDeviceChoice[],
  selectedId: string | null,
  emptyLabel: string,
): void {
  select.innerHTML = ''
  const fallback = document.createElement('option')
  fallback.value = ''
  fallback.textContent = emptyLabel
  select.appendChild(fallback)

  for (const device of devices) {
    const option = document.createElement('option')
    option.value = device.deviceId
    option.textContent = device.label
    select.appendChild(option)
  }

  if (selectedId && devices.some((device) => device.deviceId === selectedId)) {
    select.value = selectedId
  } else {
    select.value = ''
  }
}

async function refreshDeviceLists(
  els: Elements,
  settings: UserSettings,
  session: CallSession,
): Promise<void> {
  try {
    const { cameras, microphones } = await listMediaDevices()
    const active = session.getDeviceIds()
    const videoId = active.videoDeviceId ?? settings.videoDeviceId
    const audioId = active.audioDeviceId ?? settings.audioDeviceId

    fillDeviceSelect(els.cameraSelect, cameras, videoId, 'Default camera')
    fillDeviceSelect(els.micSelect, microphones, audioId, 'Default microphone')
  } catch {
    fillDeviceSelect(els.cameraSelect, [], settings.videoDeviceId, 'Default camera')
    fillDeviceSelect(els.micSelect, [], settings.audioDeviceId, 'Default microphone')
  }
}

function syncSettingsForm(els: Elements, settings: UserSettings): void {
  els.layoutSelect.value = settings.layout
  els.mirrorToggle.checked = settings.mirrorLocal
  els.showSelfToggle.checked = settings.showSelfView
  syncFitButton(els, settings.videoFit)
}

function syncFitButton(els: Elements, videoFit: UserSettings['videoFit']): void {
  const isContain = videoFit === 'contain'
  els.fitBtn.title = isContain ? 'Show full video' : 'Fill frame'
  els.fitBtnLabel.textContent = isContain ? 'Fit' : 'Fill'
  const icon = els.fitBtn.querySelector('i')
  if (icon) {
    icon.className = isContain
      ? 'fa-solid fa-up-right-and-down-left-from-center'
      : 'fa-solid fa-crop-simple'
  }
  els.fitBtn.classList.toggle('active-on', isContain)
}

function refreshLayout(
  els: Elements,
  settings: UserSettings,
  hasMedia: boolean,
  hasRemote: boolean,
): void {
  const localInMain = hasMedia && !hasRemote
  applyVideoLayout(els, settings, { hasMedia, hasRemote, localInMain })
}

export function bindCallUi(): void {
  const els = getElements()
  let settings = loadSettings()
  let hasMedia = false
  let hasRemote = false
  let currentStatus: CallStatus = 'idle'

  syncSettingsForm(els, settings)

  const updateLayout = (): void => {
    refreshLayout(els, settings, hasMedia, hasRemote)
  }

  const persistSettings = (): void => {
    saveSettings(settings)
    syncFitButton(els, settings.videoFit)
    updateLayout()
  }

  const session = new CallSession(els.remoteVideo, els.localVideo, {
    onStatusChange: (status, detail) => {
      currentStatus = status
      updateStatus(els, status, detail)
      syncControls(els, status, session, hasMedia, hasRemote)

      if (status === 'waiting' && hasMedia && !hasRemote) {
        els.placeholderText.textContent = 'Waiting for others to join'
        els.waitingTileText.textContent = 'Waiting for others to join'
        els.videoPlaceholder.classList.add('hidden')
      }

      if (status === 'ended') {
        hasMedia = false
        hasRemote = false
        resetToLobby(els, session)
      }

      updateLayout()
    },
    onLocalStream: (stream) => {
      hasMedia = Boolean(stream)
      updatePlaceholder(els, hasMedia, hasRemote, currentStatus)
      syncControls(els, currentStatus, session, hasMedia, hasRemote)
      updateLayout()
      void refreshDeviceLists(els, settings, session)
    },
    onRemoteStream: (stream) => {
      hasRemote = Boolean(stream)

      if (!stream) {
        els.volumeBtn.disabled = true
        setButtonActiveOff(els.volumeBtn, false, 'fa-volume-high', 'fa-volume-xmark')
      }

      updatePlaceholder(els, hasMedia, hasRemote, currentStatus)
      syncControls(els, currentStatus, session, hasMedia, hasRemote)
      updateLayout()
    },
  })

  session.setPreferredDevices(settings.videoDeviceId, settings.audioDeviceId)
  void refreshDeviceLists(els, settings, session)

  const incomingRoom = getRoomFromUrl()
  if (incomingRoom) {
    showIncoming(els, incomingRoom)
  }

  const openDeviceSettings = (): void => {
    openSettings(els)
    void refreshDeviceLists(els, settings, session)
  }

  els.settingsBtn.addEventListener('click', openDeviceSettings)
  els.lobbySettingsBtn.addEventListener('click', openDeviceSettings)
  els.closeSettingsBtn.addEventListener('click', () => closeSettings(els))
  els.settingsBackdrop.addEventListener('click', () => closeSettings(els))

  navigator.mediaDevices.addEventListener('devicechange', () => {
    void refreshDeviceLists(els, settings, session)
  })

  els.layoutSelect.addEventListener('change', () => {
    settings = { ...settings, layout: els.layoutSelect.value as UserSettings['layout'] }
    persistSettings()
  })

  els.cameraSelect.addEventListener('change', () => {
    void (async () => {
      const deviceId = els.cameraSelect.value || null
      settings = { ...settings, videoDeviceId: deviceId }
      session.setPreferredDevices(settings.videoDeviceId, settings.audioDeviceId)
      persistSettings()
      if (!deviceId || !hasMedia) {
        return
      }
      try {
        await session.switchCamera(deviceId)
      } catch {
        updateStatus(els, 'error', 'Could not switch camera')
      }
    })()
  })

  els.micSelect.addEventListener('change', () => {
    void (async () => {
      const deviceId = els.micSelect.value || null
      settings = { ...settings, audioDeviceId: deviceId }
      session.setPreferredDevices(settings.videoDeviceId, settings.audioDeviceId)
      persistSettings()
      if (!deviceId || !hasMedia) {
        return
      }
      try {
        await session.switchMicrophone(deviceId)
      } catch {
        updateStatus(els, 'error', 'Could not switch microphone')
      }
    })()
  })

  els.fitBtn.addEventListener('click', () => {
    settings = {
      ...settings,
      videoFit: settings.videoFit === 'cover' ? 'contain' : 'cover',
    }
    persistSettings()
  })

  els.mirrorToggle.addEventListener('change', () => {
    settings = { ...settings, mirrorLocal: els.mirrorToggle.checked }
    persistSettings()
  })

  els.showSelfToggle.addEventListener('change', () => {
    settings = { ...settings, showSelfView: els.showSelfToggle.checked }
    persistSettings()
  })

  els.layoutBtn.addEventListener('click', () => {
    settings = {
      ...settings,
      layout: settings.layout === 'split' ? 'spotlight' : 'split',
    }
    syncSettingsForm(els, settings)
    persistSettings()
  })

  els.fullscreenBtn.addEventListener('click', () => {
    void (async () => {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
        return
      }
      await els.videoStage.requestFullscreen()
    })()
  })

  document.addEventListener('fullscreenchange', () => {
    const icon = els.fullscreenBtn.querySelector('i')
    if (!icon) {
      return
    }
    icon.className = document.fullscreenElement
      ? 'fa-solid fa-compress'
      : 'fa-solid fa-expand'
  })

  els.newCallBtn.addEventListener('click', () => {
    void (async () => {
      try {
        const roomId = generateRoomId()
        showMeetingUi(els)
        await session.startAsHost(roomId)
        history.replaceState({}, '', buildRoomUrl(roomId))
        updateRoomInfo(els, roomId)
        els.createLinkBtn.disabled = false
        updateLayout()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to start meeting'
        updateStatus(els, 'error', message)
        showLobbyUi(els)
      }
    })()
  })

  els.joinRoomBtn.addEventListener('click', () => {
    attemptJoinFromInput(els)
  })

  els.roomInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      attemptJoinFromInput(els)
    }
  })

  els.roomInput.addEventListener('input', () => {
    els.joinError.classList.add('hidden')
  })

  els.createLinkBtn.addEventListener('click', () => {
    void (async () => {
      const roomId = session.getRoomId()
      if (!roomId) {
        return
      }
      const url = buildRoomUrl(roomId)
      const ok = await copyToClipboard(url)
      updateStatus(els, 'waiting', ok ? 'Link copied' : 'Could not copy link')
    })()
  })

  els.acceptBtn.addEventListener('click', () => {
    void (async () => {
      const roomId = getRoomFromUrl()
      if (!roomId) {
        return
      }
      hideIncoming(els)
      showMeetingUi(els)
      try {
        await session.joinAsGuest(roomId)
        updateRoomInfo(els, roomId)
        els.createLinkBtn.disabled = false
        updateLayout()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to join meeting'
        updateStatus(els, 'error', message)
        showLobbyUi(els)
      }
    })()
  })

  els.declineBtn.addEventListener('click', () => {
    hideIncoming(els)
    history.replaceState({}, '', window.location.pathname)
    showLobbyUi(els)
    els.joinError.classList.add('hidden')
  })

  els.micBtn.addEventListener('click', () => {
    const enabled = session.toggleMic()
    setButtonActiveOff(els.micBtn, !enabled, 'fa-microphone', 'fa-microphone-slash')
  })

  els.cameraBtn.addEventListener('click', () => {
    const enabled = session.toggleCamera()
    setButtonActiveOff(els.cameraBtn, !enabled, 'fa-video', 'fa-video-slash')
  })

  els.volumeBtn.addEventListener('click', () => {
    const audible = session.toggleRemoteVolume()
    setButtonActiveOff(els.volumeBtn, !audible, 'fa-volume-high', 'fa-volume-xmark')
  })

  els.hangUpBtn.addEventListener('click', () => {
    session.hangUp()
  })
}

function attemptJoinFromInput(els: Elements): void {
  const roomId = parseRoomInput(els.roomInput.value)
  if (!roomId) {
    els.joinError.classList.remove('hidden')
    return
  }

  els.joinError.classList.add('hidden')
  history.replaceState({}, '', buildRoomUrl(roomId))
  showIncoming(els, roomId)
}

function resetToLobby(els: Elements, session: CallSession): void {
  history.replaceState({}, '', window.location.pathname)
  showLobbyUi(els)
  updateRoomInfo(els, null)
  els.createLinkBtn.disabled = true
  els.roomInput.value = ''
  els.joinError.classList.add('hidden')
  els.roomInput.disabled = false
  els.joinRoomBtn.disabled = false
  els.videoPlaceholder.classList.remove('hidden')
  setButtonActiveOff(els.micBtn, false, 'fa-microphone', 'fa-microphone-slash')
  setButtonActiveOff(els.cameraBtn, false, 'fa-video', 'fa-video-slash')
  setButtonActiveOff(els.volumeBtn, false, 'fa-volume-high', 'fa-volume-xmark')
  if (!session.getRoomId()) {
    els.newCallBtn.disabled = false
  }
}

function showIncoming(els: Elements, roomId: string): void {
  els.lobby.classList.add('hidden')
  els.incomingOverlay.classList.remove('hidden')
  els.incomingRoomLabel.textContent = `Meeting ${roomId}`
  updateRoomInfo(els, roomId)
  updateStatus(els, 'incoming', 'Someone is inviting you')
  els.newCallBtn.disabled = true
  els.joinRoomBtn.disabled = true
  els.roomInput.disabled = true
}

function hideIncoming(els: Elements): void {
  els.incomingOverlay.classList.add('hidden')
  els.newCallBtn.disabled = false
  els.joinRoomBtn.disabled = false
  els.roomInput.disabled = false
}

function updateRoomInfo(els: Elements, roomId: string | null): void {
  els.roomTitle.textContent = roomId ?? '—'
}

function updatePlaceholder(
  els: Elements,
  hasMedia: boolean,
  hasRemote: boolean,
  status: CallStatus,
): void {
  if (hasRemote || hasMedia) {
    els.videoPlaceholder.classList.add('hidden')
    return
  }

  els.videoPlaceholder.classList.remove('hidden')

  if (status === 'waiting') {
    els.placeholderText.textContent = 'Waiting for others to join'
  } else if (status === 'connecting') {
    els.placeholderText.textContent = 'Connecting…'
  } else {
    els.placeholderText.textContent = 'No one else is here yet'
  }
}

function updateStatus(els: Elements, status: CallStatus, detail?: string): void {
  const labels: Record<CallStatus, string> = {
    idle: 'Ready',
    connecting: 'Connecting…',
    waiting: 'Waiting for others',
    incoming: 'Incoming invite',
    'in-call': 'In call',
    ended: 'Call ended',
    error: 'Error',
  }
  els.statusBadge.textContent = detail ?? labels[status]
}

function syncControls(
  els: Elements,
  status: CallStatus,
  session: CallSession,
  hasMedia: boolean,
  hasRemote: boolean,
): void {
  const inSession = hasMedia || status === 'waiting' || status === 'connecting' || status === 'in-call'
  els.micBtn.disabled = !inSession
  els.cameraBtn.disabled = !inSession
  els.hangUpBtn.disabled = !inSession
  els.layoutBtn.disabled = !inSession
  els.fullscreenBtn.disabled = !inSession
  els.volumeBtn.disabled = !hasRemote || status !== 'in-call'
  els.createLinkBtn.disabled = !session.getRoomId()
  els.newCallBtn.disabled = inSession || status === 'incoming'

  if (status === 'ended' || status === 'idle' || status === 'error') {
    if (!session.getRoomId()) {
      els.createLinkBtn.disabled = true
      els.newCallBtn.disabled = false
    }
  }
}
