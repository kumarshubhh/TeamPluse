# TeamPulse - Architecture Document

## 1. System Overview

TeamPulse is a real-time team communication application built using the MERN stack (MongoDB, Express.js, React, Node.js) with Socket.IO for real-time bidirectional communication. The application enables teams to communicate through chat rooms, send messages, receive notifications, and track presence indicators.

### 1.1 Core Components

- **Backend API Server**: RESTful API built with Express.js
- **WebSocket Server**: Real-time communication using Socket.IO
- **Frontend Application**: Single Page Application (SPA) built with React
- **Database**: MongoDB for data persistence
- **Authentication**: JWT-based token authentication

### 1.2 System Architecture Pattern

The application follows a **3-tier architecture**:

```
┌─────────────────┐
│   Frontend      │  React SPA (Client-side)
│   (React)       │
└────────┬────────┘
         │ HTTP/REST + WebSocket
         │
┌────────▼────────┐
│   Backend       │  Express.js API Server
│   (Node.js)     │  + Socket.IO Server
└────────┬────────┘
         │ MongoDB Driver
         │
┌────────▼────────┐
│   Database      │  MongoDB
│   (MongoDB)     │
└─────────────────┘
```

---

## 2. Technology Stack Justification

### 2.1 Backend Technologies

#### Node.js with Express.js
- **Why**: Fast, non-blocking I/O ideal for real-time applications
- **Benefits**: Single language (JavaScript) for full-stack development, large ecosystem
- **Version**: Express 5.x for modern async/await support

#### MongoDB with Mongoose
- **Why**: Flexible schema for evolving data models, excellent for real-time apps
- **Benefits**: 
  - Document-based storage fits chat messages and notifications
  - Horizontal scalability
  - Rich querying capabilities
- **ODM**: Mongoose for schema validation and relationships

#### Socket.IO
- **Why**: Bidirectional real-time communication
- **Benefits**:
  - Automatic fallback mechanisms (WebSocket → polling)
  - Room-based messaging (perfect for chat rooms)
  - Built-in authentication support
  - Event-based architecture

#### JWT (JSON Web Tokens)
- **Why**: Stateless authentication, scalable
- **Benefits**:
  - No server-side session storage
  - Works seamlessly with REST and WebSocket
  - Token expiration for security
  - Portable across services

### 2.2 Frontend Technologies

#### React 19
- **Why**: Component-based UI, large ecosystem, performance
- **Benefits**: Virtual DOM, hooks for state management, component reusability

#### React Router
- **Why**: Client-side routing for SPA
- **Benefits**: Protected routes, dynamic routing, navigation state management

#### Tailwind CSS
- **Why**: Utility-first CSS framework
- **Benefits**: Rapid UI development, consistent design system, small bundle size

#### Axios
- **Why**: HTTP client with interceptors
- **Benefits**: Request/response interceptors for token injection, error handling

#### Socket.IO Client
- **Why**: Real-time communication from browser
- **Benefits**: Automatic reconnection, event-based API, room management

### 2.3 Security & Validation

#### Joi
- **Why**: Schema-based validation
- **Benefits**: Type-safe validation, clear error messages, request sanitization

#### bcryptjs
- **Why**: Password hashing
- **Benefits**: Slow hashing algorithm (deters brute force), salt rounds

#### sanitize-html
- **Why**: XSS prevention
- **Benefits**: Removes malicious HTML, configurable allowlist

#### Helmet
- **Why**: Security headers
- **Benefits**: XSS protection, content security policy, clickjacking prevention

---

## 3. System Architecture Layers

### 3.1 Backend Architecture

```
┌─────────────────────────────────────────────────┐
│              Request Layer                      │
│  (Express Routes + Socket.IO Events)           │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│          Middleware Layer                       │
│  - Authentication (JWT)                         │
│  - Validation (Joi)                             │
│  - Error Handling                               │
│  - Rate Limiting                                │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│          Controller Layer                       │
│  - Business Logic                               │
│  - Request/Response Handling                    │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│          Service Layer                          │
│  - Notification Service                         │
│  - Analytics Service                            │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│          Data Access Layer                      │
│  - Mongoose Models                              │
│  - Database Queries                             │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│          Database Layer                         │
│  - MongoDB                                      │
└─────────────────────────────────────────────────┘
```

### 3.2 Frontend Architecture

```
┌─────────────────────────────────────────────────┐
│              Presentation Layer                 │
│  - React Components (UI)                        │
│  - Pages                                        │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│          State Management Layer                 │
│  - React Context (Auth)                         │
│  - Custom Hooks (useMessages, useRooms)         │
│  - Local Component State                        │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│          API Layer                              │
│  - Axios Client (REST)                          │
│  - Socket.IO Client (WebSocket)                 │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│          Backend API                            │
└─────────────────────────────────────────────────┘
```

---

## 4. Data Flow

### 4.1 Authentication Flow

```
1. User submits credentials (login/signup)
   ↓
2. Backend validates and hashes password
   ↓
3. JWT token generated with user info
   ↓
4. Token returned to frontend
   ↓
5. Frontend stores token in memory
   ↓
6. Token attached to all subsequent requests (Authorization header)
   ↓
7. Socket.IO connects with token in handshake.auth.token
   ↓
8. Backend validates token on every request/connection
```

### 4.2 Message Sending Flow

```
1. User types message and clicks send
   ↓
2. Frontend sends POST /api/rooms/:roomId/messages
   ↓
3. Backend validates:
   - User is authenticated (JWT)
   - User is room member
   - Message content is valid
   ↓
4. Message saved to MongoDB
   ↓
5. Room's lastMessageAt updated
   ↓
6. Mentions detected and notifications created
   ↓
7. Socket.IO emits 'message:created' to room
   ↓
8. All connected clients in room receive message
   ↓
9. Frontend updates UI in real-time
```

### 4.3 Real-Time Updates Flow

```
1. User performs action (send message, join room)
   ↓
2. Backend processes action and updates database
   ↓
3. Socket.IO emits event to relevant rooms/users
   ↓
4. Connected clients receive event
   ↓
5. Frontend hooks (useMessages, useNotifications) update state
   ↓
6. React re-renders components with new data
```

---

## 5. Security Architecture

### 5.1 Authentication & Authorization

#### JWT Authentication
- **Token Structure**: `{ sub: userId, username, name, exp, iat }`
- **Storage**: In-memory (frontend) - not in localStorage for security
- **Validation**: On every REST request and Socket.IO connection
- **Expiration**: Configurable (default: 1 hour)
- **Auto-disconnect**: Socket.IO disconnects on token expiry

#### Authorization Checks
- **Room Access**: Only members can view/send messages
- **Room Deletion**: Only room creator can delete
- **User Actions**: Users can only update their own profile

### 5.2 Input Validation & Sanitization

#### Validation (Joi)
- All request bodies validated with Joi schemas
- Type checking, length limits, format validation
- Clear error messages returned

#### Sanitization
- **XSS Prevention**: `sanitize-html` removes all HTML tags from messages
- **SQL Injection**: Not applicable (NoSQL database)
- **NoSQL Injection**: Mongoose handles parameterized queries

### 5.3 Security Headers (Helmet)
- XSS Protection
- Content Security Policy
- Frame Options (clickjacking protection)
- MIME type sniffing protection

### 5.4 Rate Limiting
- Express Rate Limit middleware
- 300 requests per 15 minutes per IP
- Applied to all routes except health check
- Disabled in development for testing

---

## 6. Real-Time Communication Architecture

### 6.1 Socket.IO Setup

#### Server-Side
```javascript
- Authentication middleware validates JWT token
- User joins personal room: `user:${userId}`
- User joins room channels: `room:${roomId}`
- Event handlers registered per connection
```

#### Client-Side
```javascript
- Socket connects with JWT token
- Automatically joins user's personal room
- Manually joins room channels when viewing room
- Listens for events and updates state
```

### 6.2 Event Types

#### Client → Server
- `join-room`: Join a room channel
- `leave-room`: Leave a room channel
- `new-message`: Send a message
- `message:read`: Mark message as read
- `typing:start`: Start typing indicator
- `typing:stop`: Stop typing indicator

#### Server → Client
- `message:created`: New message in room
- `message:read`: Read receipt update
- `notification:created`: New notification
- `typing:start`: User started typing
- `typing:stop`: User stopped typing
- `presence:list`: Online users in room
- `presence:offline`: User went offline
- `room:deleted`: Room was deleted
- `room:joined`: User joined room

### 6.3 Room-Based Messaging

- Each room has a channel: `room:${roomId}`
- Messages broadcasted to room channel
- Users only receive messages from rooms they're members of
- Presence updates scoped to room channels

---

## 7. API Design

### 7.1 RESTful Principles

- **Resources**: `/api/rooms`, `/api/rooms/:id/messages`
- **HTTP Methods**: GET (read), POST (create), PATCH (update), DELETE (delete)
- **Status Codes**: 200 (success), 201 (created), 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 500 (error)

### 7.2 Response Format

#### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

#### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": [ ... ] // Optional validation errors
  }
}
```

### 7.3 Pagination

- **Cursor-based pagination** using `before` timestamp
- Format: `?limit=20&before=2024-01-01T00:00:00Z`
- Returns `nextBefore` cursor for next page
- Efficient for chronological data (messages, notifications)

---

## 8. Database Design

### 8.1 Collections

#### User
- Stores user account information
- Indexes: `username` (unique), `email` (unique)
- Password stored as hash (never returned in API)

#### Room
- Stores room information and members
- Indexes: `members` (multikey), `lastMessageAt` (desc)
- Cascade deletion: When room deleted, messages and notifications deleted

#### Message
- Stores chat messages
- Indexes: `{ roomId: 1, createdAt: -1 }` (compound), `senderId`
- Read receipts stored in `readBy` array
- Mentions stored in `mentions` array

#### Notification
- Stores user notifications
- Indexes: `{ userId: 1, createdAt: -1 }`, `{ userId: 1, read: 1 }`
- Types: `mention`, `invite`, `room_deleted`

### 8.2 Data Relationships

```
User ──< creates >── Room
User ──< member of >── Room (many-to-many)
User ──< sends >── Message
User ──< receives >── Notification
Room ──< contains >── Message
Room ──< referenced in >── Notification
Message ──< referenced in >── Notification
```

### 8.3 Indexing Strategy

- **Compound indexes** for common query patterns
- **Multikey indexes** for array fields (members)
- **Descending indexes** for recent-first sorting
- **Unique indexes** for data integrity (username, email)

---

## 9. Frontend Architecture

### 9.1 Component Structure

```
App
├── AuthProvider (Context)
│   └── RouterProvider
│       ├── LoginPage (Public)
│       ├── SignupPage (Public)
│       └── ProtectedRoute
│           └── Layout
│               ├── Header
│               ├── Sidebar
│               └── Outlet
│                   ├── RoomsPage
│                   ├── RoomPage
│                   ├── NotificationsPage
│                   └── ProfilePage
```

### 9.2 State Management

#### Context API
- `AuthProvider`: Global authentication state (token, user)

#### Custom Hooks
- `useMessages`: Message state and operations
- `useRooms`: Room state and operations
- `useNotifications`: Notification state and operations
- `usePresence`: Online status tracking
- `useRoomDetails`: Room details fetching

#### Local State
- Component-level state for UI interactions
- Form state, modals, loading states

### 9.3 API Integration

#### REST API Client (Axios)
- Base URL from environment variable
- Request interceptor: Adds JWT token to headers
- Response interceptor: Handles 401 (logout)
- Centralized error handling

#### Socket.IO Client
- Connects on app initialization (if authenticated)
- Joins rooms when viewing
- Listens for events and updates state
- Automatic reconnection on disconnect

---

## 10. Error Handling

### 10.1 Backend Error Handling

#### Centralized Error Handler
- Catches all unhandled errors
- Returns consistent error format
- Logs errors with Pino logger
- Avoids exposing sensitive information

#### Error Types
- **Validation Errors**: 400 with details
- **Authentication Errors**: 401
- **Authorization Errors**: 403
- **Not Found Errors**: 404
- **Server Errors**: 500

### 10.2 Frontend Error Handling

#### API Errors
- Caught in axios interceptor
- Displayed to user via UI
- 401 errors trigger automatic logout

#### Socket Errors
- Connection errors handled gracefully
- Automatic reconnection attempts
- Error events logged for debugging

---

## 11. Performance Considerations

### 11.1 Database Optimization

- **Indexes**: Proper indexing on frequently queried fields
- **Pagination**: Cursor-based pagination for large datasets
- **Lean Queries**: Using `.lean()` for read-only queries
- **Selective Fields**: Only fetching required fields

### 11.2 Frontend Optimization

- **Code Splitting**: React Router lazy loading (future enhancement)
- **Memoization**: React.memo, useMemo, useCallback
- **Virtual Scrolling**: For large message lists (future enhancement)
- **Debouncing**: Typing indicators debounced

### 11.3 Real-Time Optimization

- **Room-Based Channels**: Only users in room receive messages
- **Event Filtering**: Clients filter events by roomId
- **Connection Pooling**: Socket.IO connection reuse

---

## 12. Scalability Considerations

### 12.1 Horizontal Scaling

- **Stateless Backend**: JWT allows multiple server instances
- **MongoDB Replica Set**: Database replication
- **Socket.IO Adapter**: Redis adapter for multi-server Socket.IO (future)

### 12.2 Database Scaling

- **Sharding**: MongoDB sharding for large datasets (future)
- **Read Replicas**: Read from replicas for read-heavy workloads
- **Connection Pooling**: Mongoose connection pool management

### 12.3 Caching Strategy

- **User Sessions**: JWT (no server-side storage needed)
- **Room Data**: Could cache frequently accessed rooms (future)
- **User Presence**: In-memory for now, Redis for multi-server (future)

---

## 13. Deployment Architecture

### 13.1 Development Environment

```
Frontend (Vite Dev Server) → Backend (Node.js) → MongoDB (Local/Atlas)
```

### 13.2 Production Environment (Recommended)

```
┌──────────────┐
│   CDN/       │  Static Assets (React Build)
│   Frontend   │
└──────┬───────┘
       │
┌──────▼───────┐
│   Load       │  Nginx/Cloudflare
│   Balancer   │
└──────┬───────┘
       │
   ┌───┴───┐
   │       │
┌──▼───┐ ┌─▼───┐
│ API  │ │ API │  Multiple Node.js Instances
│ Server│ │Server│
└───┬──┘ └─┬───┘
    │      │
    └──┬───┘
       │
┌──────▼───────┐
│   MongoDB    │  MongoDB Atlas / Replica Set
│   Database   │
└──────────────┘
```

### 13.3 Environment Variables

- **Backend**: PORT, MONGODB_URI, JWT_SECRET, CORS_ORIGIN
- **Frontend**: VITE_API_BASE_URL
- **Secrets**: Stored in environment variables, never committed

---

## 14. Monitoring & Logging

### 14.1 Logging

- **Backend**: Pino logger with structured logging
- **Log Levels**: debug, info, warn, error
- **Log Format**: JSON in production, pretty in development
- **Sensitive Data**: Redacted (passwords, tokens)

### 14.2 Monitoring (Future Enhancements)

- **Health Checks**: `/health` endpoint
- **Error Tracking**: Sentry or similar (future)
- **Performance Monitoring**: APM tools (future)
- **Database Monitoring**: MongoDB Atlas monitoring

---

## 15. Conclusion

TeamPulse is architected as a scalable, secure, real-time communication platform. The MERN stack provides a solid foundation, while Socket.IO enables real-time features. The architecture supports horizontal scaling, maintains security best practices, and provides a clean separation of concerns.

### Key Architectural Decisions

1. **JWT for Authentication**: Stateless, scalable, works with REST and WebSocket
2. **MongoDB for Storage**: Flexible schema, excellent for real-time apps
3. **Socket.IO for Real-Time**: Room-based messaging, automatic fallbacks
4. **React for Frontend**: Component-based, large ecosystem, performance
5. **Cursor-Based Pagination**: Efficient for chronological data
6. **Room-Based Channels**: Scalable message broadcasting

### Future Enhancements

- Redis adapter for Socket.IO (multi-server support)
- Message search functionality
- File/image uploads
- Video/audio calls
- Message reactions
- Advanced analytics
- Mobile apps (React Native)

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Author**: TeamPulse Development Team

