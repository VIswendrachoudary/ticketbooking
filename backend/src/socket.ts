import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { env } from './config/env.js';

let io: Server | null = null;

export function initSocket(server: HttpServer): Server {
  io = new Server(server, {
    cors: {
      origin: env.FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected to Socket.IO: ${socket.id}`);

    // Client joins a room for a specific show
    socket.on('join_show', (showId: string) => {
      socket.join(`show:${showId}`);
      console.log(`Client ${socket.id} joined room show:${showId}`);
    });

    socket.on('leave_show', (showId: string) => {
      socket.leave(`show:${showId}`);
      console.log(`Client ${socket.id} left room show:${showId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function broadcastSeatUpdate(showId: string, payload: {
  seatIds: string[];
  status: string; // "AVAILABLE" | "HELD" | "BOOKED" | "OFFERED"
  heldByUserId?: string | null;
  holdExpiresAt?: string | null;
}) {
  if (io) {
    io.to(`show:${showId}`).emit('seat_status_updated', {
      showId,
      ...payload,
      timestamp: new Date().toISOString(),
    });
  }
}
