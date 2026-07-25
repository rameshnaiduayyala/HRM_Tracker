import { Server, Socket } from 'socket.io';
import http from 'http';
import { logger } from '../shared/logger';

let io: Server;

interface ChatMessage {
  id: string;
  companyId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  createdAt: string;
}

// In-memory fallback message store: companyId -> ChatMessage[]
const chatHistories = new Map<string, ChatMessage[]>();

export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  logger.info('WebSocket Server initialized with Socket.io');

  io.on('connection', (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Join company room for scoping updates
    socket.on('join_company', ({ companyId, userId }) => {
      if (companyId) {
        socket.join(companyId);
        logger.info(`Socket ${socket.id} (User: ${userId}) joined room ${companyId}`);
        
        // Send existing chat history for this company
        const history = chatHistories.get(companyId) || [];
        socket.emit('chat_history', history);
      }
      if (userId) {
        socket.join(`user:${userId}`);
        logger.info(`Socket ${socket.id} joined personal room user:${userId}`);
      }
    });

    // Handle new chat messages
    socket.on('send_message', (payload: { companyId: string; senderId: string; senderName: string; senderRole: string; text: string }) => {
      const { companyId, senderId, senderName, senderRole, text } = payload;
      if (!companyId || !text.trim()) return;

      const message: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        companyId,
        senderId,
        senderName,
        senderRole,
        text,
        createdAt: new Date().toISOString()
      };

      // Save to memory cache (keep last 50)
      const history = chatHistories.get(companyId) || [];
      history.push(message);
      if (history.length > 50) history.shift();
      chatHistories.set(companyId, history);

      // Broadcast to everyone in the company room
      io.to(companyId).emit('new_message', message);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Broadcast task change event to company room
export const notifyTaskUpdated = (companyId: string, taskId: string, action: string) => {
  if (io) {
    io.to(companyId).emit('task_updated', { taskId, action });
  }
};

// Broadcast announcement event to company room
export const notifyAnnouncementCreated = (companyId: string, announcement: any) => {
  if (io) {
    io.to(companyId).emit('announcement_created', announcement);
  }
};

// Send direct notification to a specific user
export const notifyUser = (userId: string, notification: any) => {
  if (io) {
    io.to(`user:${userId}`).emit('notification_received', notification);
  }
};
