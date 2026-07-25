import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'react-hot-toast';

const SocketContext = createContext(null);


export const SocketProvider = ({ children }) => {
  const { user, token } = useAuthStore();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setIsConnected(false);
      return;
    }

    // Connect to websocket server
    const socketInstance = io('http://localhost:5000', {
      transports: ['websocket'],
      autoConnect: true
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('WebSocket Connected to backend');

      // Join the company room
      const companyId = user.employees?.[0]?.companyId || user.companyId; 
      socketInstance.emit('join_company', {
        companyId,
        userId: user.id
      });
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('WebSocket Disconnected');
    });

    // Chat events
    socketInstance.on('chat_history', (history) => {
      setMessages(history);
    });

    socketInstance.on('new_message', (msg) => {
      setMessages((prev) => {
        // Prevent duplicate append
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    // Real-time update notifications
    socketInstance.on('task_updated', (data) => {
      console.log('Live task update received:', data);
      // Dispatch browser custom event so any component can listen and reload
      window.dispatchEvent(new CustomEvent('task:updated', { detail: data }));
    });

    socketInstance.on('announcement_created', (announcement) => {
      console.log('Live announcement received:', announcement);
      toast.success(`📢 Announcement: ${announcement.title}`, { duration: 5000 });
      window.dispatchEvent(new CustomEvent('announcement:created', { detail: announcement }));
    });

    socketInstance.on('notification_received', (notification) => {
      console.log('Live notification received:', notification);
      toast(`🔔 ${notification.title}: ${notification.message}`, { duration: 5000 });
      window.dispatchEvent(new CustomEvent('notification:received', { detail: notification }));
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token, user?.id]);

  const sendMessage = (text) => {
    if (!socket || !isConnected || !user) return;
    const companyId = user.employees?.[0]?.companyId || user.companyId;
    if (!companyId) return;

    socket.emit('send_message', {
      companyId,
      senderId: user.id,
      senderName: `${user.firstName} ${user.lastName}`,
      senderRole: user.role,
      text
    });
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, messages, sendMessage }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
