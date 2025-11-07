import { useCallback, useEffect, useRef, useState } from 'react';
import apiClient from '../api/client.js';
import endpoints from '../api/endpoints.js';
import { getSocket } from '../socket/index.js';
import { SOCKET_EVENTS } from '../socket/events.js';

/**
 * useNotifications - fetch, live update, and mark read
 */
export function useNotifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const nextBeforeRef = useRef(null);
  const loadingMoreRef = useRef(false);

  const recalcUnread = useCallback((list) => {
    setUnreadCount(list.reduce((acc, n) => acc + (n.read ? 0 : 1), 0));
  }, []);

  const fetchList = useCallback(async ({ initial = false } = {}) => {
    try {
      if (initial) {
        setLoading(true);
        setError('');
        loadingMoreRef.current = false;
      }
      const params = { limit: 20 };
      if (!initial && nextBeforeRef.current) params.before = nextBeforeRef.current;
      const url = endpoints.notifications.list(params);
      const res = await apiClient.get(url);
      if (res.data?.success) {
        const list = res.data.data || [];
        setItems((prev) => {
          const next = initial ? list : [...prev, ...list];
          recalcUnread(next);
          return next;
        });
        nextBeforeRef.current = res.data.nextBefore || null;
        setHasMore(!!res.data.nextBefore);
      }
    } catch (e) {
      setError(e.response?.data?.error?.message || 'Failed to load notifications');
    } finally {
      if (initial) setLoading(false);
      loadingMoreRef.current = false;
    }
  }, [recalcUnread]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    await fetchList({ initial: false });
  }, [hasMore, fetchList]);

  const markRead = useCallback(async (id) => {
    await apiClient.post(endpoints.notifications.markRead(id));
    setItems((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      recalcUnread(next);
      return next;
    });
  }, [recalcUnread]);

  const markAllRead = useCallback(async () => {
    await apiClient.post(endpoints.notifications.readAll);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  // Socket live updates
  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const onCreated = (payload) => {
      setItems((prev) => [payload, ...prev]);
      setUnreadCount((c) => c + 1);
    };
    const onRead = ({ id }) => {
      if (id === 'ALL') {
        setItems((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      } else if (id) {
        setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    };
    s.on(SOCKET_EVENTS.NOTIFICATION_CREATED, onCreated);
    s.on(SOCKET_EVENTS.NOTIFICATION_READ, onRead);
    return () => {
      s.off(SOCKET_EVENTS.NOTIFICATION_CREATED, onCreated);
      s.off(SOCKET_EVENTS.NOTIFICATION_READ, onRead);
    };
  }, []);

  useEffect(() => {
    fetchList({ initial: true });
  }, [fetchList]);

  return { items, loading, error, hasMore, loadMore, markRead, markAllRead, unreadCount, refresh: () => fetchList({ initial: true }) };
}


