import { io } from 'socket.io-client'

type BoardData = { fenString: string }
type MoveData = { id: number, prevIndex: number, newIndex: number, newFenString: string }

/**
 * 
 * @returns A socket connection to the server
 */
export const connectToGameServer = (code?: string) => {
  const socket = io(import.meta.env.VITE_WS_URL)
  
  socket.emit('join', { code })
  socket.on('error', err => console.error(err))
  return socket
}

export class GameServerConnection {
  private socket = io(import.meta.env.VITE_WS_URL)
  public isActive = (): boolean => this.socket.active
  public isConnected = (): boolean => this.socket.connected
  public onOpponentMove: (...args: any[]) => void = () => {}

  constructor() {
    this.socket.on('move', data => this.onOpponentMove(data))
  }
  
  joinRoom = async (code: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      this.socket.on('join-error', err => {
        reject(err)
        this.socket.removeListener('join-error')
      })
      this.socket.on('join', ({ fenString }: BoardData) => resolve(fenString))
      this.socket.emit('join', { code })
    })
  }

  createRoom = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      this.socket.emit('new-room')
      this.socket.on('join', ({ code }: { code: string }) => resolve(code))
    })
  }

  opponentPlayer = async (): Promise<any> => {
    return new Promise((resolve, reject) => {
      this.socket.on('join', data => {
        console.log(data)
        resolve(data)
      })
    })
  }

  sendMove = (data: MoveData): void => {
    this.socket.emit('move', data)
  }
}