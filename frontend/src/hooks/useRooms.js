import { useState, useEffect } from 'react';
import apiClient from '../api/client.js';
import endpoints from '../api/endpoints.js';
import { getSocket } from '../socket/index.js';

/**
 * useRooms Hook - Rooms data management
 * 
 * Ye hook kya karta hai:
 * 1. Rooms list ko API se fetch karta hai
 * 2. Create room functionality provide karta hai
 * 3. Loading aur error states handle karta hai
 * 4. Rooms state ko manage karta hai
 */
export function useRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch rooms list from API
  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      // API call: GET /api/rooms
      // apiClient automatically adds Authorization header (Step 1 me setup kiya tha)
      const response = await apiClient.get(endpoints.rooms.list);
      if (response.data.success) {
        // Backend se data format: { success: true, data: [rooms...] }
        setRooms(response.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to fetch rooms');
      console.error('Error fetching rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create new room
  const createRoom = async (name) => {
    try {
      setError(null);
      // API call: POST /api/rooms with { name }
      const response = await apiClient.post(endpoints.rooms.create, { name });
      if (response.data.success) {
        // New room ko list me add karo
        setRooms((prev) => [response.data.data, ...prev]);
        return response.data.data;
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || 'Failed to create room';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // Component mount pe rooms fetch karo
  useEffect(() => {
    fetchRooms();
  }, []);

  // Listen for room events (deletion, joining)
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleRoomDeleted = (payload) => {
      // Remove deleted room from list
      setRooms((prev) => prev.filter((room) => {
        const roomId = room._id || room.id;
        return roomId !== payload.roomId;
      }));
    };

    const handleRoomJoined = async (payload) => {
      // User was auto-added to a room (e.g., via mention)
      // Refresh rooms list to show the new room
      await fetchRooms();
    };

    socket.on('room:deleted', handleRoomDeleted);
    socket.on('room:joined', handleRoomJoined);

    return () => {
      socket.off('room:deleted', handleRoomDeleted);
      socket.off('room:joined', handleRoomJoined);
    };
  }, [fetchRooms]);

  return {
    rooms,        // Rooms array
    loading,      // Loading state
    error,        // Error message (if any)
    fetchRooms,   // Manual refresh function
    createRoom,   // Create room function
  };
}

