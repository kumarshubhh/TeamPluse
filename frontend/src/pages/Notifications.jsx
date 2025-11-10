import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications.js';
import { Link } from 'react-router-dom';

export default function NotificationsPage() {
  const {
    items,
    loading,
    error,
    hasMore,
    loadMore,
    markRead,
    markAllRead,
    deleteNotification,
  } = useNotifications();
  
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'room_deleted':
        return <Trash2 size={18} className="text-red-400" />;
      case 'invite':
        return <Bell size={18} className="text-emerald-400" />;
      case 'mention':
        return <Bell size={18} className="text-[#8f94fb]" />;
      default:
        return <Bell size={18} className="text-neutral-400" />;
    }
  };

  const getNotificationMessage = (n) => {
    switch (n.type) {
      case 'room_deleted':
        return (
          <>
            A room you were a member of has been <span className="text-red-400 font-medium">deleted</span>.
            {n.roomId && (
              <span className="text-xs text-neutral-500 ml-2">(Room ID: {n.roomId.slice(-8)})</span>
            )}
          </>
        );
      case 'invite':
        return (
          <>
            You were invited to{' '}
            {n.roomId ? (
              <Link to={`/rooms/${n.roomId}`} className="text-[#8f94fb] hover:underline">
                a room
              </Link>
            ) : (
              'a room'
            )}
          </>
        );
      case 'mention':
        return (
          <>
            You were mentioned in{' '}
            {n.roomId ? (
              <Link to={`/rooms/${n.roomId}`} className="text-[#8f94fb] hover:underline">
                a room
              </Link>
            ) : (
              'a message'
            )}
          </>
        );
      default:
        return 'You have a new notification';
    }
  };

  return (
    <div className="h-full p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bell size={18} />
          <h2 className="text-lg font-semibold">Notifications</h2>
        </div>
        <button
          onClick={markAllRead}
          className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition"
        >
          <CheckCheck size={14} /> Read all
        </button>
      </div>
      {error && <div className="text-sm text-red-400 mb-2">{error}</div>}
      <div
        className="space-y-2"
        onScroll={(e) => {
          const el = e.currentTarget;
          if (el.scrollTop + el.clientHeight >= el.scrollHeight - 16 && hasMore) loadMore();
        }}
      >
        {items.length === 0 && !loading && (
          <div className="text-center py-12 text-neutral-400">
            <Bell size={48} className="mx-auto mb-3 opacity-50" />
            <p>No notifications yet.</p>
          </div>
        )}
        {items.map((n) => (
          <div
            key={n.id}
            className={`glass rounded-xl p-3 border ${
              n.read ? 'border-white/10 opacity-70' : n.type === 'room_deleted' ? 'border-red-500/30' : 'border-white/20'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">{getNotificationIcon(n.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm">{getNotificationMessage(n)}</div>
                <div className="text-xs text-neutral-400 mt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  {!n.read && (
                    <button
                      onClick={() => markRead(n.id)}
                      className="text-xs px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition"
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(n.id)}
                    className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-300 transition"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {loading && <div className="text-sm text-neutral-400 text-center py-4">Loading...</div>}
      </div>
    </div>
  );
}


