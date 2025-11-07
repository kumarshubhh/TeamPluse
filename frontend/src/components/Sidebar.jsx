import { PlusCircle, Bell, User, Home, Search, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useState, useMemo } from 'react';
import Loader from './Loader.jsx';
import { motion } from 'framer-motion';

/**
 * Sidebar Component
 * 
 * Ye component kya karta hai:
 * 1. Navigation links show karta hai (Overview, Notifications, Profile)
 * 2. Rooms list display karta hai (API se fetched)
 * 3. "New" button se create room modal open karta hai
 * 4. Active room highlight karta hai (gradient)
 * 5. Search/filter functionality for rooms
 * 6. Sorted by recent activity (lastMessageAt)
 */
export default function Sidebar({ rooms = [], activeRoomId, onCreateRoom, loading }) {
  const [searchQuery, setSearchQuery] = useState('');

  // Sort rooms by recent activity (lastMessageAt) or createdAt
  const sortedRooms = useMemo(() => {
    return [...rooms].sort((a, b) => {
      const aTime = new Date(a.lastMessageAt || a.createdAt || 0);
      const bTime = new Date(b.lastMessageAt || b.createdAt || 0);
      return bTime - aTime; // Most recent first
    });
  }, [rooms]);

  // Filter rooms based on search query
  const filteredRooms = useMemo(() => {
    if (!searchQuery.trim()) return sortedRooms;
    const query = searchQuery.toLowerCase().trim();
    return sortedRooms.filter((room) => room.name.toLowerCase().includes(query));
  }, [sortedRooms, searchQuery]);

  return (
    <aside className="hidden md:flex md:flex-col w-72 border-r border-white/5 glass h-full">
      {/* Header with Search */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-neutral-300">Rooms</span>
          <button
            onClick={onCreateRoom}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg hover:opacity-95 transition gradient-accent soft-glow text-white"
            title="Create New Room"
          >
            <PlusCircle size={14} /> New
          </button>
        </div>
        
        {/* Search Input */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search rooms..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 pl-9 pr-8 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[rgba(143,148,251,0.45)] placeholder:text-neutral-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10 transition"
              title="Clear search"
            >
              <X size={14} className="text-neutral-400" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
        {/* Navigation Links */}
        <div className="px-2 py-2 space-y-1">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `w-full inline-flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                isActive ? 'gradient-accent text-white soft-glow' : 'hover:bg-white/5'
              }`
            }
          >
            <Home size={16} /> Overview
          </NavLink>
          <NavLink
            to="/notifications"
            className={({ isActive }) =>
              `w-full inline-flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                isActive ? 'gradient-accent text-white soft-glow' : 'hover:bg-white/5'
              }`
            }
          >
            <Bell size={16} /> Notifications
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `w-full inline-flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                isActive ? 'gradient-accent text-white soft-glow' : 'hover:bg-white/5'
              }`
            }
          >
            <User size={16} /> Profile
          </NavLink>
        </div>

        {/* Rooms List Section */}
        <div className="px-2 pb-2 pt-2 border-t border-white/5 flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs text-neutral-400 font-medium">
              {searchQuery ? `Found ${filteredRooms.length}` : `${filteredRooms.length} ${filteredRooms.length === 1 ? 'room' : 'rooms'}`}
            </span>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader />
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <div className="text-neutral-500 mb-2">
                {searchQuery ? (
                  <>
                    <Search size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No rooms found</p>
                    <p className="text-xs mt-1">Try a different search term</p>
                  </>
                ) : (
                  <>
                    <Home size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No rooms yet</p>
                    <p className="text-xs mt-1">Create your first room to get started</p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-1 overflow-y-auto flex-1">
              {filteredRooms.map((r, index) => {
                const roomId = r._id || r.id;
                return (
                  <motion.div
                    key={roomId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                  >
                    <NavLink
                      to={`/rooms/${roomId}`}
                      className={({ isActive }) =>
                        `w-full inline-block text-left px-3 py-2 rounded-lg transition group ${
                          isActive 
                            ? 'gradient-accent text-white soft-glow' 
                            : 'hover:bg-white/5'
                        }`
                      }
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">{r.name}</div>
                          <div className="text-xs text-neutral-400 mt-0.5">
                            {r.members?.length || 0} {r.members?.length === 1 ? 'member' : 'members'}
                            {r.lastMessageAt && (
                              <span className="ml-2">
                                • {new Date(r.lastMessageAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </NavLink>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}


