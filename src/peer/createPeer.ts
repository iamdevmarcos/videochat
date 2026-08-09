import Peer from 'peerjs'
import { isValidRoomId } from '../utils/roomId'

export function createPeer(peerId?: string): Peer {
  if (peerId !== undefined && !isValidRoomId(peerId)) {
    throw new Error('Invalid peer id')
  }

  const options = { debug: 1 as const }

  if (peerId) {
    return new Peer(peerId, options)
  }

  return new Peer(options)
}

export function waitForPeerOpen(peer: Peer): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!peer.destroyed && peer.id) {
      resolve(peer.id)
      return
    }

    const onOpen = (id: string) => {
      cleanup()
      resolve(id)
    }

    const onError = (error: Error) => {
      cleanup()
      reject(error)
    }

    const cleanup = () => {
      peer.off('open', onOpen)
      peer.off('error', onError)
    }

    peer.on('open', onOpen)
    peer.on('error', onError)
  })
}
