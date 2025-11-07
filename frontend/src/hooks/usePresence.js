import { useEffect, useState } from 'react';
import { getSocket } from '../socket/index.js';
import { SOCKET_EVENTS } from '../socket/events.js';

export function usePresence(roomId) {
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    const s = getSocket();
    if (!s || !roomId) return;
    const onList = ({ roomId: r, users }) => {
      if (r !== roomId) return;
      setOnlineUsers(users || []);
    };
    const onOffline = ({ roomId: r, userId }) => {
      if (r !== roomId) return;
      setOnlineUsers((prev) => prev.filter((u) => u.id !== userId));
    };
    const onOnline = ({ roomId: r, userId }) => {
      if (r !== roomId) return;
      setOnlineUsers((prev) => (prev.find((u) => u.id === userId) ? prev : [...prev, { id: userId }]));
    };
    s.on('presence:list', onList);
    s.on('presence:offline', onOffline);
    s.on('presence:online', onOnline);
    return () => {
      s.off('presence:list', onList);
      s.off('presence:offline', onOffline);
      s.off('presence:online', onOnline);
    };
  }, [roomId]);

  return { onlineUsers };
}


