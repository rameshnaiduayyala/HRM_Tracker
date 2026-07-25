import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { isPermissionGranted, sendNotification } from '@tauri-apps/plugin-notification';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  const triggerNativeNotification = async (title, body) => {
    try {
      const granted = await isPermissionGranted();
      if (granted) {
        sendNotification({ title, body });
      }
    } catch (_) {}
  };

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
      console.log('Desktop WebSocket Connected');

      // Join the company room
      socketInstance.emit('join_company', {
        companyId: user.companyId,
        userId: user.id
      });
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('Desktop WebSocket Disconnected');
    });

    // Chat events
    socketInstance.on('chat_history', (history) => {
      setMessages(history);
    });

    socketInstance.on('new_message', (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // Trigger a native notification for messages if chat is closed
      if (msg.senderId !== user.id) {
        triggerNativeNotification(
          `New message from ${msg.senderName}`,
          msg.text.length > 55 ? `${msg.text.substring(0, 55)}...` : msg.text
        );
      }
    });

    // Real-time updates
    socketInstance.on('task_updated', (data) => {
      console.log('Desktop live task update received:', data);
      window.dispatchEvent(new CustomEvent('task:updated', { detail: data }));
    });

    socketInstance.on('announcement_created', (announcement) => {
      console.log('Desktop live announcement received:', announcement);
      triggerNativeNotification('New Announcement Posted!', announcement.title);
      window.dispatchEvent(new CustomEvent('announcement:created', { detail: announcement }));
    });

    socketInstance.on('notification_received', (notification) => {
      console.log('Desktop live notification received:', notification);
      triggerNativeNotification(notification.title, notification.message);
      window.dispatchEvent(new CustomEvent('notification:received', { detail: notification }));
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token, user?.id]);

  const sendMessage = (text) => {
    if (!socket || !isConnected || !user) return;
    socket.emit('send_message', {
      companyId: user.companyId,
      senderId: user.id,
      senderName: `${user.firstName} ${user.lastName}`,
      senderRole: 'EMPLOYEE',
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
