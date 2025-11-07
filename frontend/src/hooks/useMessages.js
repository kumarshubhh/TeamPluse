import { useCallback, useEffect, useRef, useState } from 'react';
import apiClient from '../api/client.js';
import endpoints from '../api/endpoints.js';
import { getSocket } from '../socket/index.js';
import { SOCKET_EVENTS } from '../socket/events.js';

/**
 * useMessages Hook - per-room messages management (REST-based)
 * - Fetch initial messages with pagination (createdAt desc index)
 * - Load more using before cursor
 * - Send message (REST)
 */
export function useMessages(roomId, currentUser = null) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [sending, setSending] = useState(false);
  const loadingMoreRef = useRef(false);
  const nextBeforeRef = useRef(null);
  const currentUserRef = useRef(currentUser);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const normalize = useCallback((m) => ({
    id: m.id || m._id,
    roomId: m.roomId?.toString?.() || m.roomId,
    senderId: m.senderId?.toString?.() || m.senderId,
    username: m.senderId?.username || m.sender?.username || m.username || 'user',
    name: m.senderId?.name || m.sender?.name || m.name || null,
    displayName: m.senderId?.name || m.sender?.name || m.name || m.senderId?.username || m.sender?.username || m.username || 'user',
    content: m.content,
    createdAt: m.createdAt,
    readBy: (m.readBy || []).map((r) => ({
      userId: r.userId?.toString?.() || r.userId,
      at: r.at || r.createdAt || new Date(),
    })),
    isMine: false, // will be set by caller if needed
  }), []);

  const fetchMessages = useCallback(async ({ initial = false } = {}) => {
    if (!roomId) return;
    try {
      if (initial) {
        setLoading(true);
        setError(null);
        loadingMoreRef.current = false;
      }
      const params = { limit: 20 };
      if (!initial && nextBeforeRef.current) params.before = nextBeforeRef.current;
      const url = endpoints.messages.list(roomId, params);
      const res = await apiClient.get(url);
      if (res.data?.success) {
        const list = res.data.data || [];
        const normalized = list.map(normalize);
        setMessages((prev) => {
          const next = initial ? normalized : [...normalized, ...prev];
          // de-duplicate by id
          const seen = new Set();
          const unique = [];
          for (const m of next) {
            const key = (m.id || m._id || '') + ':' + (m.createdAt || '');
            if (!seen.has(key)) {
              seen.add(key);
              unique.push(m);
            }
          }
          return unique;
        });
        nextBeforeRef.current = res.data.nextBefore || null;
        setHasMore(!!res.data.nextBefore);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load messages');
    } finally {
      if (initial) setLoading(false);
      loadingMoreRef.current = false;
    }
  }, [roomId, normalize]);

  const loadMore = useCallback(async () => {
    if (!hasMore || !roomId) return;
    if (loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    await fetchMessages({ initial: false });
  }, [hasMore, roomId, fetchMessages]);

  const sendMessage = useCallback(async (content) => {
    if (!roomId || !content?.trim()) return null;

    const trimmed = content.trim();
    const tempId = `temp-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const me = currentUserRef.current;
    const myId = me?._id?.toString?.() || me?.id?.toString?.() || null;
    const optimisticMessage = {
      id: tempId,
      clientId: tempId,
      roomId,
      senderId: myId,
      username: me?.username || 'you',
      name: me?.name || null,
      displayName: me?.name || me?.username || 'You',
      content: trimmed,
      createdAt: new Date().toISOString(),
      readBy: [],
      isMine: true,
      status: 'pending',
      optimistic: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    const updateFromServerPayload = (payload) => {
      const normalized = normalize(payload);
      const meId = currentUserRef.current?._id?.toString?.() || currentUserRef.current?.id?.toString?.();
      const result = {
        ...normalized,
        isMine: meId ? normalized.senderId === meId : false,
        status: 'sent',
        optimistic: false,
      };
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === tempId || m.clientId === tempId) {
            return { ...result };
          }
          return m;
        })
      );
      return result;
    };

    const markAsError = (message) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === tempId || m.clientId === tempId) {
            return { ...m, status: 'error', error: message };
          }
          return m;
        })
      );
    };

    let delivered = false;
    let finalResult = null;

    const socket = getSocket();
    if (socket) {
      try {
        setSending(true);
        const socketResponse = await new Promise((resolve, reject) => {
          try {
            socket
              .timeout(5000)
              .emit(
                SOCKET_EVENTS.NEW_MESSAGE,
                { roomId, content: trimmed, clientId: tempId },
                (err, response) => {
                  if (err) {
                    reject(typeof err === 'string' ? new Error(err) : err);
                    return;
                  }
                  resolve(response);
                }
              );
          } catch (emitError) {
            reject(emitError);
          }
        });

        if (socketResponse?.success && socketResponse.data) {
          delivered = true;
          finalResult = updateFromServerPayload(socketResponse.data);
        } else if (socketResponse?.error?.message) {
          throw new Error(socketResponse.error.message);
        }
      } catch (err) {
        console.warn('Socket emit failed, falling back to REST', err);
      } finally {
        setSending(false);
      }
    }

    if (!delivered) {
      try {
        setSending(true);
        const res = await apiClient.post(endpoints.messages.send(roomId), { content: trimmed });
        if (res.data?.success) {
          delivered = true;
          finalResult = updateFromServerPayload(res.data.data);
        } else {
          throw new Error('Failed to send message');
        }
      } catch (err) {
        const message = err?.response?.data?.error?.message || err?.message || 'Failed to send message';
        markAsError(message);
        console.error('Failed to send message', err);
        return null;
      } finally {
        setSending(false);
      }
    }

    return finalResult;
  }, [roomId, normalize]);

  // Append incoming socket message if it belongs to this room
  const addIncoming = useCallback((payload) => {
    if (!payload || payload.roomId !== roomId) return;
    const candidate = normalize(payload);
    const me = currentUserRef.current;
    const myId = me?._id?.toString?.() || me?.id?.toString?.() || null;

    setMessages((prev) => {
      const existingIndex = prev.findIndex((m) => (m.id || m._id) === (candidate.id || candidate._id));
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = {
          ...prev[existingIndex],
          ...candidate,
          isMine: prev[existingIndex].isMine || (myId && candidate.senderId === myId),
          status: 'sent',
          optimistic: false,
        };
        return next;
      }

      const pendingIndex = prev.findIndex(
        (m) =>
          m.optimistic &&
          m.status === 'pending' &&
          m.isMine &&
          myId &&
          candidate.senderId === myId &&
          m.content === candidate.content
      );

      if (pendingIndex >= 0) {
        const next = [...prev];
        next[pendingIndex] = {
          ...candidate,
          isMine: true,
          status: 'sent',
          optimistic: false,
        };
        return next;
      }

      return [
        ...prev,
        {
          ...candidate,
          isMine: myId ? candidate.senderId === myId : false,
          status: 'sent',
          optimistic: false,
        },
      ];
    });
  }, [roomId, normalize]);

  // Add read receipt from socket
  const addReadReceipt = useCallback(({ messageId, userId, at, roomId: evtRoomId }) => {
    if (!evtRoomId || evtRoomId !== roomId || !messageId || !userId) return;
    
    setMessages((prev) =>
      prev.map((m) => {
        const msgId = m.id || m._id;
        if (msgId?.toString() !== messageId.toString()) return m;
        
        // Check if this userId already exists in readBy
        const userIdStr = userId.toString();
        const alreadyRead = (m.readBy || []).some((r) => {
          const rUserId = r.userId?.toString() || r.userId;
          return rUserId === userIdStr;
        });
        
        if (alreadyRead) return m;
        
        // Add new read receipt
        return {
          ...m,
          readBy: [...(m.readBy || []), { userId: userIdStr, at: at || new Date() }],
        };
      })
    );
  }, [roomId]);

  // Mark read up to latest visible message
  const markReadUpTo = useCallback(async (timestamp = null) => {
    if (!roomId) return;
    
    // Use provided timestamp or get from latest message
    const targetTimestamp = timestamp || (messages.length > 0 ? messages[messages.length - 1]?.createdAt : null);
    if (!targetTimestamp) return;
    
    try {
      await apiClient.post(endpoints.messages.readReceipts(roomId), { 
        upToTimestamp: targetTimestamp 
      });
    } catch (err) {
      // Silently ignore errors (e.g., network issues, already read)
      console.debug('Failed to mark messages as read:', err);
    }
  }, [roomId, messages]);

  useEffect(() => {
    nextBeforeRef.current = null;
    setMessages([]);
    setHasMore(false);
    setError(null);
    setLoading(true);
    fetchMessages({ initial: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  return { messages, loading, error, hasMore, loadMore, sendMessage, sending, addIncoming, addReadReceipt, markReadUpTo };
}


