import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

export function useSocket(fileId: string | null) {
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        // Connect to socket server
        socketRef.current = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
        });

        return () => {
            socketRef.current?.disconnect();
        };
    }, []);

    useEffect(() => {
        if (!fileId || !socketRef.current) return;

        // Join the canvas room
        socketRef.current.emit('join-canvas', fileId);

        return () => {
            socketRef.current?.emit('leave-canvas', fileId);
        };
    }, [fileId]);

    const emitElementAdded = useCallback((element: any) => {
        if (!fileId || !socketRef.current) return;
        socketRef.current.emit('element-added', { fileId, element });
    }, [fileId]);

    const emitElementModified = useCallback((element: any) => {
        if (!fileId || !socketRef.current) return;
        socketRef.current.emit('element-modified', { fileId, element });
    }, [fileId]);

    const emitElementDeleted = useCallback((elementId: string) => {
        if (!fileId || !socketRef.current) return;
        socketRef.current.emit('element-deleted', { fileId, elementId });
    }, [fileId]);

    const emitCursorMove = useCallback((x: number, y: number, color: string) => {
        if (!fileId || !socketRef.current) return;
        socketRef.current.emit('cursor-move', { fileId, x, y, color });
    }, [fileId]);

    const onElementAdded = useCallback((callback: (data: any) => void) => {
        socketRef.current?.on('element-added', callback);
        return () => {
            socketRef.current?.off('element-added', callback);
        };
    }, []);

    const onElementModified = useCallback((callback: (data: any) => void) => {
        socketRef.current?.on('element-modified', callback);
        return () => {
            socketRef.current?.off('element-modified', callback);
        };
    }, []);

    const onElementDeleted = useCallback((callback: (data: any) => void) => {
        socketRef.current?.on('element-deleted', callback);
        return () => {
            socketRef.current?.off('element-deleted', callback);
        };
    }, []);

    const onCursorMove = useCallback((callback: (data: any) => void) => {
        socketRef.current?.on('cursor-move', callback);
        return () => {
            socketRef.current?.off('cursor-move', callback);
        };
    }, []);

    return {
        socket: socketRef.current,
        emitElementAdded,
        emitElementModified,
        emitElementDeleted,
        emitCursorMove,
        onElementAdded,
        onElementModified,
        onElementDeleted,
        onCursorMove,
    };
}
