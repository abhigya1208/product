import { io } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';

let socket = null;

export const getSocket = (token) => {
  if (!socket || !socket.connected) {
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
