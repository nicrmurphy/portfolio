import { io } from 'socket.io-client'

/**
 * 
 * @returns A socket connection to the server
 */
export const connectToGameServer = () => {
  const socket = io('ws://localhost:5000')
  
  socket.on('hello', arg => {
    console.log(arg)
  })
  return socket
}