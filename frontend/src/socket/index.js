import { io } from 'socket.io-client';

let socketInstance = null;

export function connectSocket(token) {
  if (!token) return null;
  if (socketInstance) {
    try { socketInstance.disconnect(); } catch (e) {}
    socketInstance = null;
  }
  socketInstance = io(import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000', {
    auth: { token },
    transports: ['websocket'],
  });
  return socketInstance;
}

export function getSocket() {
  return socketInstance;
}

export function disconnectSocket() {
  if (socketInstance) {
    try { socketInstance.disconnect(); } catch (e) {}
    socketInstance = null;
  }
}

