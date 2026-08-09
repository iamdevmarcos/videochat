export type MediaDeviceChoice = {
  deviceId: string
  label: string
}

export type MediaDeviceLists = {
  cameras: MediaDeviceChoice[]
  microphones: MediaDeviceChoice[]
}

export type MediaConstraints = {
  videoDeviceId?: string | null
  audioDeviceId?: string | null
}

function buildConstraints(options: MediaConstraints = {}): MediaStreamConstraints {
  const video: boolean | MediaTrackConstraints = options.videoDeviceId
    ? { deviceId: { exact: options.videoDeviceId } }
    : true
  const audio: boolean | MediaTrackConstraints = options.audioDeviceId
    ? { deviceId: { exact: options.audioDeviceId } }
    : true

  return { video, audio }
}

export async function getLocalMedia(options: MediaConstraints = {}): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia(buildConstraints(options))
}

export async function listMediaDevices(): Promise<MediaDeviceLists> {
  const devices = await navigator.mediaDevices.enumerateDevices()
  const cameras: MediaDeviceChoice[] = []
  const microphones: MediaDeviceChoice[] = []

  for (const device of devices) {
    if (device.kind === 'videoinput') {
      cameras.push({
        deviceId: device.deviceId,
        label: device.label || `Camera ${cameras.length + 1}`,
      })
    }
    if (device.kind === 'audioinput') {
      microphones.push({
        deviceId: device.deviceId,
        label: device.label || `Microphone ${microphones.length + 1}`,
      })
    }
  }

  return { cameras, microphones }
}

export function getActiveDeviceIds(stream: MediaStream | null): {
  videoDeviceId: string | null
  audioDeviceId: string | null
} {
  if (!stream) {
    return { videoDeviceId: null, audioDeviceId: null }
  }

  return {
    videoDeviceId: stream.getVideoTracks()[0]?.getSettings().deviceId ?? null,
    audioDeviceId: stream.getAudioTracks()[0]?.getSettings().deviceId ?? null,
  }
}

export function stopMediaStream(stream: MediaStream | null): void {
  if (!stream) {
    return
  }
  for (const track of stream.getTracks()) {
    track.stop()
  }
}

export function setAudioEnabled(stream: MediaStream | null, enabled: boolean): void {
  if (!stream) {
    return
  }
  for (const track of stream.getAudioTracks()) {
    track.enabled = enabled
  }
}

export function setVideoEnabled(stream: MediaStream | null, enabled: boolean): void {
  if (!stream) {
    return
  }
  for (const track of stream.getVideoTracks()) {
    track.enabled = enabled
  }
}

export async function replaceTrackInStream(
  stream: MediaStream,
  kind: 'audio' | 'video',
  deviceId: string,
): Promise<MediaStreamTrack> {
  const constraints: MediaStreamConstraints =
    kind === 'video'
      ? { video: { deviceId: { exact: deviceId } }, audio: false }
      : { video: false, audio: { deviceId: { exact: deviceId } } }

  const fresh = await navigator.mediaDevices.getUserMedia(constraints)
  const newTrack = fresh.getTracks()[0]
  if (!newTrack) {
    stopMediaStream(fresh)
    throw new Error(`No ${kind} track available`)
  }

  const oldTracks = kind === 'video' ? stream.getVideoTracks() : stream.getAudioTracks()
  for (const old of oldTracks) {
    stream.removeTrack(old)
    old.stop()
  }

  stream.addTrack(newTrack)
  for (const leftover of fresh.getTracks()) {
    if (leftover !== newTrack) {
      leftover.stop()
    }
  }

  return newTrack
}

export function attachStream(
  video: HTMLVideoElement,
  stream: MediaStream | null,
): void {
  if (stream) {
    video.srcObject = stream
    void video.play().catch(() => undefined)
    return
  }
  detachStream(video)
}

export function detachStream(video: HTMLVideoElement): void {
  video.pause()
  video.srcObject = null
  video.removeAttribute('src')
  video.load()
}
