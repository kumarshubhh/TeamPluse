import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChatWindow from '../features/chat/ChatWindow.jsx';
import MessageInput from '../features/chat/MessageInput.jsx';
import TypingIndicator from '../features/chat/TypingIndicator.jsx';
import { useMessages } from '../hooks/useMessages.js';
import { useAuth } from '../auth/AuthProvider.jsx';
import { useRoomSocket } from '../socket/useSocket.js';
import { getSocket } from '../socket/index.js';
import { SOCKET_EVENTS } from '../socket/events.js';
import InviteUser from '../components/InviteUser.jsx';
import PresencePanel from '../components/PresencePanel.jsx';
import { usePresence } from '../hooks/usePresence.js';
import { useRoomDetails } from '../hooks/useRoomDetails.js';
import { useRooms } from '../hooks/useRooms.js';
import Loader from '../components/Loader.jsx';
import apiClient from '../api/client.js';
import endpoints from '../api/endpoints.js';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages, loading, error, hasMore, loadMore, sendMessage, addIncoming, addReadReceipt, markReadUpTo } = useMessages(roomId);
  const { onlineUsers } = usePresence(roomId);
  const { details, loading: roomDetailsLoading, fetchDetails } = useRoomDetails(roomId);
  const { fetchRooms } = useRooms();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const enhancedMessages = messages.map((m) => ({
    ...m,
    isMine: user && (m.senderId === user._id || m.username === user.username),
  }));

  // Wire room socket events
  // Typing users state
  const [typingUsers, setTypingUsers] = useState([]);
  useRoomSocket(roomId, {
    onMessageCreated: (payload) => {
      addIncoming(payload);
    },
    onTypingStart: ({ userId, username, name }) => {
      // Don't show typing indicator for current user
      if (user && (userId === user._id || userId === user.id)) return;
      const displayName = name || username || userId;
      setTypingUsers((prev) => {
        if (prev.includes(displayName)) return prev;
        return [...prev, displayName];
      });
    },
    onTypingStop: ({ userId, username, name }) => {
      // Don't show typing indicator for current user
      if (user && (userId === user._id || userId === user.id)) return;
      const displayName = name || username || userId;
      setTypingUsers((prev) => prev.filter((u) => u !== displayName));
    },
    onMessageRead: (payload) => {
      // Live merge of read receipts into messages state
      addReadReceipt(payload);
    },
  });

  // Mark messages as read when user views them
  const lastMarkedTimestampRef = useRef(null);
  const markReadTimeoutRef = useRef(null);

  // Mark latest message as read when messages update (user is viewing)
  useEffect(() => {
    if (!roomId || loading || messages.length === 0) return;
    
    // Clear previous timeout
    if (markReadTimeoutRef.current) {
      clearTimeout(markReadTimeoutRef.current);
    }
    
    // Mark latest message as read after a short delay (when user is viewing)
    markReadTimeoutRef.current = setTimeout(() => {
      const latestMessage = messages[messages.length - 1];
      if (latestMessage?.createdAt) {
        const timestamp = latestMessage.createdAt;
        // Only mark if this is a new message (not already marked)
        if (timestamp !== lastMarkedTimestampRef.current) {
          // Only mark if the latest message is not sent by current user
          // (users don't mark their own messages as read)
          if (!latestMessage.isMine) {
            markReadUpTo(timestamp);
            lastMarkedTimestampRef.current = timestamp;
          }
        }
      }
    }, 1000); // 1 second delay to ensure user is actually viewing
    
    return () => {
      if (markReadTimeoutRef.current) {
        clearTimeout(markReadTimeoutRef.current);
      }
    };
  }, [messages, loading, roomId, markReadUpTo, user]);

  // Check if current user is the room creator
  const isCreator = details && user && (
    details.createdBy?._id === user._id || 
    details.createdBy === user._id ||
    (typeof details.createdBy === 'object' && details.createdBy?._id?.toString() === user._id?.toString())
  );

  // Handle room deletion
  const handleDeleteRoom = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiClient.delete(endpoints.rooms.delete(roomId));
      // Refresh rooms list
      await fetchRooms();
      // Navigate to home/overview page
      navigate('/');
    } catch (err) {
      setDeleteError(err.response?.data?.error?.message || 'Failed to delete room');
      setDeleting(false);
    }
  };

  // Listen for room deletion socket event
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !roomId) return;

    const handleRoomDeleted = (payload) => {
      if (payload.roomId === roomId) {
        // Room was deleted, navigate away
        fetchRooms();
        navigate('/');
      }
    };

    socket.on('room:deleted', handleRoomDeleted);

    return () => {
      socket.off('room:deleted', handleRoomDeleted);
    };
  }, [roomId, navigate, fetchRooms]);

  if (loading || roomDetailsLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-2">{error}</p>
          <button onClick={() => window.location.reload()} className="text-sm text-[#8f94fb] hover:underline">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const roomMembersCount = details?.members?.length || 1;

  return (
    <>
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => !deleting && setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass p-6 rounded-xl shadow-lg w-full max-w-md border border-white/10 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10 transition disabled:opacity-50"
              >
                <X size={18} />
              </button>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="text-red-400" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Delete Room</h3>
                  <p className="text-sm text-neutral-400">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-sm text-neutral-300 mb-6">
                Are you sure you want to delete <strong>"{details?.name}"</strong>? 
                This will permanently delete the room and all its messages. All members will be notified.
              </p>

              {deleteError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {deleteError}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={handleDeleteRoom}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  {deleting ? 'Deleting...' : 'Delete Room'}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="px-4 py-2 rounded-lg border border-white/10 text-neutral-300 font-medium hover:bg-white/5 transition disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-full flex relative overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {/* Room Header with Delete Button */}
          {isCreator && (
            <div className="glass border-b border-white/5 px-4 py-2 flex items-center justify-end">
              <button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition text-sm font-medium"
                title="Delete Room"
              >
                <Trash2 size={16} />
                Delete Room
              </button>
            </div>
          )}
        <ChatWindow 
          messages={enhancedMessages} 
          hasMore={hasMore} 
          loading={loading} 
          onLoadMore={loadMore} 
          onScrollBottom={() => {}} 
          membersCount={roomMembersCount}
        />
        <TypingIndicator users={typingUsers} />
        <InviteUser roomId={roomId} />
        <MessageInput
          onSend={(t) => sendMessage(t)}
          onTypingStart={() => {
            const s = getSocket();
            if (s && roomId) s.emit(SOCKET_EVENTS.TYPING_START, { roomId });
          }}
          onTypingStop={() => {
            const s = getSocket();
            if (s && roomId) s.emit(SOCKET_EVENTS.TYPING_STOP, { roomId });
          }}
        />
      </div>
      
      {/* Presence Panel - Right Side */}
      <PresencePanel users={onlineUsers} />
      </div>
    </>
  );
}


