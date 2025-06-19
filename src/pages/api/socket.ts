
import type { Server as HTTPServer } from 'http';
import type { Socket as NetSocket } from 'net';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Server as IOServerType } from 'socket.io';
import { Server as IOServer } from 'socket.io';
import type { ChatMessage } from '@/types';

// Define a custom NextApiResponse type that includes the Socket.IO server instance
interface NextApiResponseServerIO extends NextApiResponse {
  socket: NetSocket & {
    server: HTTPServer & {
      io?: IOServerType;
    };
  };
}

export const config = {
  api: {
    bodyParser: false, // Disabling body parser for socket.io
  },
};

export default function socketHandler(req: NextApiRequest, res: NextApiResponseServerIO) {
  // Ensure this handler is only used for Socket.IO handshake (typically GET)
  // and not for other HTTP methods if you were to expand this file.
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'OPTIONS' ) {
     // Allowing OPTIONS for CORS preflight
    res.status(405).json({ message: 'Method not allowed' });
    return;
  }
  
  if (!res.socket.server.io) {
    console.log('Setting up new Socket.IO server...');
    const httpServer: HTTPServer = res.socket.server;
    const io = new IOServer(httpServer, {
      path: '/api/socket', // This must match the client-side path
      addTrailingSlash: false,
      cors: { 
        origin: "*", // Allow all origins for development. Restrict in production.
        methods: ["GET", "POST"]
      } 
    });

    io.on('connection', (socket) => {
      console.log('Socket connected:', socket.id);

      socket.on('joinConversation', (conversationId: string) => {
        socket.join(conversationId);
        console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
      });

      socket.on('sendMessage', (data: { conversationId: string; message: ChatMessage }) => {
        // Broadcast to all clients in the room except the sender
        socket.to(data.conversationId).emit('receiveMessage', data.message);
        console.log(`Message sent in room ${data.conversationId} by ${socket.id}: ${data.message.text}`);
      });

      socket.on('disconnect', (reason) => {
        console.log(`Socket ${socket.id} disconnected: ${reason}`);
      });

      socket.on('error', (error) => {
        console.error(`Socket ${socket.id} error:`, error);
      });
    });

    res.socket.server.io = io;
  } else {
    console.log('Socket.IO server already running.');
  }
  res.end(); // Important to end the response for the HTTP request
}
