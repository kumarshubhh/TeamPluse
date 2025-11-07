import Header from './Header.jsx';
import Sidebar from './Sidebar.jsx';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.jsx';
import { useRooms } from '../hooks/useRooms.js';
import CreateRoomModal from './CreateRoomModal.jsx';
import { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications.js';

/**
 * Layout Component
 * 
 * Ye component kya karta hai:
 * 1. Main layout structure provide karta hai (Header + Sidebar + Main content)
 * 2. useRooms hook se rooms data fetch karta hai
 * 3. Create room modal handle karta hai
 * 4. Current room name detect karta hai (URL se)
 * 5. Logout aur notifications navigation handle karta hai
 */
export default function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { rooms, createRoom, loading: roomsLoading } = useRooms();
  const { unreadCount } = useNotifications();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Current room ID detect karo (URL se)
  const roomIdMatch = location.pathname.match(/\/rooms\/([^/]+)/);
  const activeRoomId = roomIdMatch ? roomIdMatch[1] : null;
  
  // Current room ka name find karo
  const currentRoom = rooms.find((r) => (r._id || r.id) === activeRoomId);
  const roomName = currentRoom?.name || 'Select a room';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleNotificationsClick = () => {
    navigate('/notifications');
  };

  const handleCreateRoom = async (name) => {
    setCreating(true);
    try {
      const newRoom = await createRoom(name);
      // New room me navigate karo
      navigate(`/rooms/${newRoom._id || newRoom.id}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
      <Header roomName={roomName} onToggleRight={handleNotificationsClick} onLogout={handleLogout} unreadCount={unreadCount} />
      <div className="flex-1 grid grid-cols-1 md:grid-cols-[18rem_1fr] gap-0">
        <Sidebar
          rooms={rooms}
          activeRoomId={activeRoomId}
          onCreateRoom={() => setIsCreateModalOpen(true)}
          loading={roomsLoading}
        />
        <main className="relative h-[calc(100vh-64px)] md:h-[calc(100vh-64px)] overflow-hidden">
          <Outlet />
        </main>
      </div>
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateRoom={handleCreateRoom}
        loading={creating}
      />
    </div>
  );
}


