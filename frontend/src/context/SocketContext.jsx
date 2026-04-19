import { createContext, useContext, useEffect, useState } from 'react';
import { getSocket, disconnectSocket } from '../services/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    // Only connect socket for teacher/admin (students don't use chat)
    if (token && user && user.role !== 'student') {
      const s = getSocket(token);
      setSocket(s);

      s.on('online_users', (users) => setOnlineUsers(users));

      return () => {
        s.off('online_users');
        // Don't disconnect here – keep alive across nav
      };
    } else {
      disconnectSocket();
      setSocket(null);
    }
  }, [token, user]);

  const isOnline = (userId) => onlineUsers.includes(userId);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, isOnline }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
