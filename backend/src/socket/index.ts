import { Server, Socket } from 'socket.io';

interface CanvasUpdate {
    fileId: string;
    elements: any[];
    userId?: string;
}

interface CursorPosition {
    fileId: string;
    userId: string;
    x: number;
    y: number;
    color: string;
}

export function setupSocketHandlers(io: Server) {
    const activeUsers = new Map<string, Set<string>>();

    io.on('connection', (socket: Socket) => {
        console.log(`🔌 Client connected: ${socket.id}`);

        // Join a canvas room
        socket.on('join-canvas', (fileId: string) => {
            socket.join(fileId);

            if (!activeUsers.has(fileId)) {
                activeUsers.set(fileId, new Set());
            }
            activeUsers.get(fileId)?.add(socket.id);

            // Notify others in the room
            socket.to(fileId).emit('user-joined', { userId: socket.id });

            // Send current user count
            io.to(fileId).emit('users-count', activeUsers.get(fileId)?.size || 0);

            console.log(`👤 User ${socket.id} joined canvas: ${fileId}`);
        });

        // Leave a canvas room
        socket.on('leave-canvas', (fileId: string) => {
            socket.leave(fileId);
            activeUsers.get(fileId)?.delete(socket.id);

            socket.to(fileId).emit('user-left', { userId: socket.id });
            io.to(fileId).emit('users-count', activeUsers.get(fileId)?.size || 0);
        });

        // Canvas element updates
        socket.on('canvas-update', (data: CanvasUpdate) => {
            socket.to(data.fileId).emit('canvas-update', {
                ...data,
                userId: socket.id,
            });
        });

        // Element added
        socket.on('element-added', (data: { fileId: string; element: any }) => {
            socket.to(data.fileId).emit('element-added', {
                ...data,
                userId: socket.id,
            });
        });

        // Element modified
        socket.on('element-modified', (data: { fileId: string; element: any }) => {
            socket.to(data.fileId).emit('element-modified', {
                ...data,
                userId: socket.id,
            });
        });

        // Element deleted
        socket.on('element-deleted', (data: { fileId: string; elementId: string }) => {
            socket.to(data.fileId).emit('element-deleted', {
                ...data,
                userId: socket.id,
            });
        });

        // Cursor position updates
        socket.on('cursor-move', (data: CursorPosition) => {
            socket.to(data.fileId).emit('cursor-move', {
                ...data,
                userId: socket.id,
            });
        });

        // Disconnect handling
        socket.on('disconnect', () => {
            console.log(`🔌 Client disconnected: ${socket.id}`);

            // Remove from all rooms
            activeUsers.forEach((users, fileId) => {
                if (users.has(socket.id)) {
                    users.delete(socket.id);
                    io.to(fileId).emit('user-left', { userId: socket.id });
                    io.to(fileId).emit('users-count', users.size);
                }
            });
        });
    });
}
