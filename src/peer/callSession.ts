import type { MediaConnection, Peer } from 'peerjs'
import { createPeer, waitForPeerOpen } from './createPeer'
import {
  attachStream,
  detachStream,
  getActiveDeviceIds,
  getLocalMedia,
  replaceTrackInStream,
  setAudioEnabled,
  setVideoEnabled,
  stopMediaStream,
} from './media'
import { isValidRoomId } from '../utils/roomId'

export type CallStatus =
  | 'idle'
  | 'connecting'
  | 'waiting'
  | 'incoming'
  | 'in-call'
  | 'ended'
  | 'error'

export type CallSessionCallbacks = {
  onStatusChange: (status: CallStatus, detail?: string) => void
  onLocalStream: (stream: MediaStream | null) => void
  onRemoteStream: (stream: MediaStream | null) => void
}

export class CallSession {
  private peer: Peer | null = null
  private localStream: MediaStream | null = null
  private activeCall: MediaConnection | null = null
  private remoteStream: MediaStream | null = null
  private roomId: string | null = null
  private micEnabled = true
  private cameraEnabled = true
  private remoteMuted = false
  private isHostSession = false
  private preferredVideoDeviceId: string | null = null
  private preferredAudioDeviceId: string | null = null

  constructor(
    private readonly remoteVideo: HTMLVideoElement,
    private readonly localVideo: HTMLVideoElement,
    private readonly callbacks: CallSessionCallbacks,
  ) {}

  getRoomId(): string | null {
    return this.roomId
  }

  getDeviceIds(): { videoDeviceId: string | null; audioDeviceId: string | null } {
    return getActiveDeviceIds(this.localStream)
  }

  setPreferredDevices(videoDeviceId: string | null, audioDeviceId: string | null): void {
    this.preferredVideoDeviceId = videoDeviceId
    this.preferredAudioDeviceId = audioDeviceId
  }

  isMicEnabled(): boolean {
    return this.micEnabled
  }

  isCameraEnabled(): boolean {
    return this.cameraEnabled
  }

  isRemoteMuted(): boolean {
    return this.remoteMuted
  }

  async startAsHost(roomId: string): Promise<void> {
    if (!isValidRoomId(roomId)) {
      throw new Error('Invalid room id')
    }

    this.resetConnection(false)
    this.roomId = roomId
    this.isHostSession = true
    this.callbacks.onStatusChange('connecting', 'Requesting camera…')

    this.localStream = await this.requestLocalMedia()
    this.attachLocalPreview(true)
    this.callbacks.onLocalStream(this.localStream)

    this.peer = createPeer(roomId)
    await waitForPeerOpen(this.peer)

    this.peer.on('call', (call) => {
      if (this.activeCall) {
        call.close()
        return
      }
      this.activeCall = call
      call.answer(this.localStream ?? undefined)
      this.bindCall(call)
    })

    this.peer.on('error', (error) => {
      this.callbacks.onStatusChange('error', error.message)
    })

    this.peer.on('disconnected', () => {
      if (!this.peer?.destroyed) {
        this.peer?.reconnect()
      }
    })

    this.callbacks.onStatusChange('waiting', 'Waiting for others to join')
  }

  async joinAsGuest(roomId: string): Promise<void> {
    if (!isValidRoomId(roomId)) {
      throw new Error('Invalid room id')
    }

    this.resetConnection(false)
    this.roomId = roomId
    this.isHostSession = false
    this.callbacks.onStatusChange('connecting', 'Requesting camera…')

    this.localStream = await this.requestLocalMedia()
    this.attachLocalPreview(false)
    this.callbacks.onLocalStream(this.localStream)

    this.peer = createPeer()
    await waitForPeerOpen(this.peer)

    this.peer.on('error', (error) => {
      this.callbacks.onStatusChange('error', error.message)
    })

    const call = this.peer.call(roomId, this.localStream)
    if (!call) {
      throw new Error('Unable to start call')
    }

    this.activeCall = call
    this.bindCall(call)
    this.callbacks.onStatusChange('connecting', 'Calling host…')
  }

  toggleMic(): boolean {
    this.micEnabled = !this.micEnabled
    setAudioEnabled(this.localStream, this.micEnabled)
    return this.micEnabled
  }

  toggleCamera(): boolean {
    this.cameraEnabled = !this.cameraEnabled
    setVideoEnabled(this.localStream, this.cameraEnabled)
    return this.cameraEnabled
  }

  toggleRemoteVolume(): boolean {
    this.remoteMuted = !this.remoteMuted
    this.remoteVideo.muted = this.remoteMuted
    return !this.remoteMuted
  }

  async switchCamera(deviceId: string): Promise<void> {
    if (!this.localStream) {
      this.preferredVideoDeviceId = deviceId
      return
    }

    const newTrack = await replaceTrackInStream(this.localStream, 'video', deviceId)
    newTrack.enabled = this.cameraEnabled
    this.preferredVideoDeviceId = deviceId
    await this.replaceSenderTrack('video', newTrack)
    this.refreshLocalPreview()
    this.callbacks.onLocalStream(this.localStream)
  }

  async switchMicrophone(deviceId: string): Promise<void> {
    if (!this.localStream) {
      this.preferredAudioDeviceId = deviceId
      return
    }

    const newTrack = await replaceTrackInStream(this.localStream, 'audio', deviceId)
    newTrack.enabled = this.micEnabled
    this.preferredAudioDeviceId = deviceId
    await this.replaceSenderTrack('audio', newTrack)
    this.callbacks.onLocalStream(this.localStream)
  }

  hangUp(): void {
    this.resetConnection(true)
    this.callbacks.onStatusChange('ended', 'You left the call')
  }

  private bindCall(call: MediaConnection): void {
    call.on('stream', (stream) => {
      this.remoteStream = stream
      attachStream(this.remoteVideo, stream)
      this.remoteVideo.muted = this.remoteMuted
      this.monitorRemoteStream(stream)
      this.callbacks.onRemoteStream(stream)
      this.attachLocalPreview(false)
      this.callbacks.onStatusChange('in-call', 'Connected')
    })

    call.on('close', () => {
      this.handleRemotePeerLeft()
    })

    call.on('error', (error) => {
      this.callbacks.onStatusChange('error', error.message)
    })
  }

  private monitorRemoteStream(stream: MediaStream): void {
    const onTrackEnded = () => {
      const hasLiveTrack = stream.getTracks().some((track) => track.readyState === 'live')
      if (!hasLiveTrack) {
        this.handleRemotePeerLeft()
      }
    }

    for (const track of stream.getTracks()) {
      track.addEventListener('ended', onTrackEnded)
    }
  }

  private handleRemotePeerLeft(): void {
    if (!this.activeCall && !this.remoteStream) {
      return
    }

    this.activeCall = null
    this.clearRemoteVideo()

    if (this.isHostSession && this.peer && !this.peer.destroyed && this.localStream) {
      this.attachLocalPreview(true)
      this.callbacks.onStatusChange('waiting', 'Participant left — waiting for others')
      return
    }

    this.resetConnection(true)
    this.callbacks.onStatusChange('ended', 'The other participant left')
  }

  private clearRemoteVideo(): void {
    this.remoteStream = null
    detachStream(this.remoteVideo)
    this.remoteVideo.muted = false
    this.remoteMuted = false
    this.callbacks.onRemoteStream(null)
  }

  private async requestLocalMedia() {
    try {
      return await getLocalMedia({
        videoDeviceId: this.preferredVideoDeviceId,
        audioDeviceId: this.preferredAudioDeviceId,
      })
    } catch {
      return getLocalMedia()
    }
  }

  private attachLocalPreview(asMain: boolean): void {
    if (asMain) {
      attachStream(this.remoteVideo, this.localStream)
      this.remoteVideo.muted = true
      detachStream(this.localVideo)
      return
    }

    attachStream(this.localVideo, this.localStream)
    this.localVideo.muted = true
  }

  private refreshLocalPreview(): void {
    const localInMain = Boolean(this.localStream && !this.remoteStream)
    this.attachLocalPreview(localInMain)
  }

  private async replaceSenderTrack(
    kind: 'audio' | 'video',
    track: MediaStreamTrack,
  ): Promise<void> {
    const pc = this.activeCall?.peerConnection
    if (!pc) {
      return
    }

    const sender = pc.getSenders().find((item) => item.track?.kind === kind)
    if (sender) {
      await sender.replaceTrack(track)
    }
  }

  private resetConnection(clearRoom: boolean): void {
    if (this.activeCall) {
      this.activeCall.close()
      this.activeCall = null
    }

    if (this.peer) {
      this.peer.destroy()
      this.peer = null
    }

    stopMediaStream(this.localStream)
    this.localStream = null
    this.remoteStream = null
    this.micEnabled = true
    this.cameraEnabled = true
    this.remoteMuted = false
    this.isHostSession = false

    detachStream(this.remoteVideo)
    detachStream(this.localVideo)
    this.remoteVideo.muted = false

    this.callbacks.onLocalStream(null)
    this.callbacks.onRemoteStream(null)

    if (clearRoom) {
      this.roomId = null
    }
  }
}
