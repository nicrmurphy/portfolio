import { io } from 'socket.io-client'

/**
 * 
 * @returns A socket connection to the server
 */
export const connectToGameServer = () => {
  console.log(`Connecting to ${import.meta.env.VITE_WS_URL} via websocket`)
  const socket = io(import.meta.env.VITE_WS_URL)
  
  console.log(socket)
  
  socket.on('hello', arg => {
    console.log(arg)
  })
  return socket
}