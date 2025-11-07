import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import apiClient from '../api/client.js';
import endpoints from '../api/endpoints.js';

/**
 * useMessages Hook - per-room messages management (REST-based)
 * - Fetch initial messages with pagination (createdAt desc index)
 * - Load more using before cursor
 * - Send message (REST)
 */
export function useMessages(roomId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [sending, setSending] = useState(false);
  const loadingMoreRef = useRef(false);
  const nextBeforeRef = useRef(null);

  const normalize = useCallback((m) => ({
    id: m.id || m._id,
    roomId: m.roomId?.toString?.() || m.roomId,
    senderId: m.senderId?.toString?.() || m.senderId,
    username: m.senderId?.username || m.sender?.username || m.username || 'user',
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
    if (!roomId || !content?.trim()) return;
    try {
      setSending(true);
      const res = await apiClient.post(endpoints.messages.send(roomId), { content });
      // Do not append locally; rely on socket 'message:created' to avoid double entries
      if (res.data?.success) return res.data.data;
    } finally {
      setSending(false);
    }
  }, [roomId, normalize]);

  // Append incoming socket message if it belongs to this room
  const addIncoming = useCallback((payload) => {
    if (!payload || payload.roomId !== roomId) return;
    const candidate = normalize(payload);
    setMessages((prev) => {
      // de-dup by id
      if (prev.some((m) => (m.id || m._id) === (candidate.id || candidate._id))) return prev;
      return [...prev, candidate];
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


