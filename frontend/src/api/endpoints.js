// API endpoints constants
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://teampluse.onrender.com';

export const endpoints = {
  // Auth
  auth: {
    signup: `${API_BASE}/api/auth/signup`,
    login: `${API_BASE}/api/auth/login`,
    me: `${API_BASE}/api/auth/me`,
  },
  
  // Users
  users: {
    status: `${API_BASE}/api/users/status`,
    profile: `${API_BASE}/api/users/profile`,
  },
  
  // Rooms
  rooms: {
    list: `${API_BASE}/api/rooms`,
    create: `${API_BASE}/api/rooms`,
    details: (roomId) => `${API_BASE}/api/rooms/${roomId}`,
    invite: (roomId) => `${API_BASE}/api/rooms/${roomId}/invite`,
    delete: (roomId) => `${API_BASE}/api/rooms/${roomId}`,
  },
  
  // Messages
  messages: {
    list: (roomId, params = {}) => {
      const query = new URLSearchParams(params).toString();
      return `${API_BASE}/api/rooms/${roomId}/messages${query ? `?${query}` : ''}`;
    },
    send: (roomId) => `${API_BASE}/api/rooms/${roomId}/messages`,
    readReceipts: (roomId) => `${API_BASE}/api/rooms/${roomId}/read-receipts`,
  },
  
  // Notifications
  notifications: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return `${API_BASE}/api/notifications${query ? `?${query}` : ''}`;
    },
    markRead: (id) => `${API_BASE}/api/notifications/${id}/read`,
    readAll: `${API_BASE}/api/notifications/read-all`,
    delete: (id) => `${API_BASE}/api/notifications/${id}`,
  },
  
  // Analytics
  analytics: {
    topRooms: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return `${API_BASE}/api/analytics/top-rooms${query ? `?${query}` : ''}`;
    },
  },
};

export default endpoints;
