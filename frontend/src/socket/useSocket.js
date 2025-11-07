import { useEffect, useRef } from 'react';
import { connectSocket, disconnectSocket, getSocket } from './index.js';
import { SOCKET_EVENTS } from './events.js';

/**
 * useAppSocket
 * - Initializes socket on token change
 */
export function useAppSocket(token) {
  useEffect(() => {
    if (!token) return;
    const s = connectSocket(token);
    const onAuthError = (err) => {
      if (err?.code === 'AUTH_EXPIRED') {
        // optional: handle at AuthProvider interceptor already
      }
    };
    s?.on(SOCKET_EVENTS.ERROR, onAuthError);
    return () => {
      s?.off(SOCKET_EVENTS.ERROR, onAuthError);
      disconnectSocket();
    };
  }, [token]);
}

/**
 * useRoomSocket
 * - Joins/leaves a room and wires message + typing events
 */
export function useRoomSocket(roomId, handlers = {}) {
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    const s = getSocket();
    if (!s || !roomId) return;

    s.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId }, () => {});

    const handleCreated = (payload) => {
      if (payload?.roomId === roomId) handlersRef.current?.onMessageCreated?.(payload);
    };
    const handleTypingStart = (payload) => {
      if (payload?.roomId === roomId) handlersRef.current?.onTypingStart?.(payload);
    };
    const handleTypingStop = (payload) => {
      if (payload?.roomId === roomId) handlersRef.current?.onTypingStop?.(payload);
    };
    const handleMessageRead = (payload) => {
      if (payload?.roomId === roomId) handlersRef.current?.onMessageRead?.(payload);
    };

    s.on(SOCKET_EVENTS.MESSAGE_CREATED, handleCreated);
    s.on(SOCKET_EVENTS.TYPING_START, handleTypingStart);
    s.on(SOCKET_EVENTS.TYPING_STOP, handleTypingStop);
    s.on(SOCKET_EVENTS.MESSAGE_READ, handleMessageRead);

    return () => {
      s.emit(SOCKET_EVENTS.LEAVE_ROOM, { roomId }, () => {});
      s.off(SOCKET_EVENTS.MESSAGE_CREATED, handleCreated);
      s.off(SOCKET_EVENTS.TYPING_START, handleTypingStart);
      s.off(SOCKET_EVENTS.TYPING_STOP, handleTypingStop);
      s.off(SOCKET_EVENTS.MESSAGE_READ, handleMessageRead);
    };
  }, [roomId]);
}

