import { io } from 'socket.io-client'

/**
 * 
 * @returns A socket connection to the server
 */
export const connectToGameServer = () => {
  const socket = io(import.meta.env.VITE_WS_URL)
  
  socket.on('hello', arg => {
    console.log(arg)
  })
  return socket
}