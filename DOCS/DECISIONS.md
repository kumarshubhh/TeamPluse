# TeamPulse - Decision Log

This document records the key technical decisions made during the development of TeamPulse, including the rationale behind each decision, alternatives considered, and trade-offs.

## Decision Log Format

Each decision follows this format:
- **Decision**: What was decided
- **Context**: Why the decision was needed
- **Options Considered**: Alternative solutions evaluated
- **Rationale**: Why this option was chosen
- **Trade-offs**: Pros and cons
- **Date**: When the decision was made

---

## 1. Technology Stack: MERN Stack

**Decision**: Use MERN stack (MongoDB, Express.js, React, Node.js) for the application.

**Context**: Need for a full-stack JavaScript solution that supports real-time communication.

**Options Considered**:
1. MERN Stack (MongoDB, Express.js, React, Node.js)
2. MEAN Stack (MongoDB, Express.js, Angular, Node.js)
3. Django + React (Python backend, React frontend)
4. Rails + React (Ruby on Rails backend, React frontend)
5. Next.js Full-Stack (Next.js with API routes)

**Rationale**:
- **Single Language**: JavaScript/TypeScript for both frontend and backend reduces context switching
- **Ecosystem**: Large npm ecosystem with many packages for real-time features
- **Real-time Support**: Node.js is excellent for I/O-intensive applications like chat apps
- **MongoDB**: Document-based database fits well with flexible message and notification structures
- **React**: Component-based architecture, large community, excellent for building interactive UIs
- **Developer Experience**: Hot reload, fast development cycle

**Trade-offs**:
- ✅ Pros: Single language, large ecosystem, fast development
- ❌ Cons: JavaScript can be less type-safe (mitigated with Joi validation), MongoDB requires careful schema design

**Date**: Project Initiation

---

## 2. Database: MongoDB

**Decision**: Use MongoDB as the primary database.

**Context**: Need for a database that handles flexible schema, real-time updates, and scales well.

**Options Considered**:
1. MongoDB (NoSQL, Document-based)
2. PostgreSQL (SQL, Relational)
3. MySQL (SQL, Relational)
4. Redis (In-memory, for caching)

**Rationale**:
- **Flexible Schema**: Messages, notifications, and user data can evolve without migrations
- **Document Structure**: Messages and read receipts fit naturally into document format
- **Array Support**: Native support for arrays (members, mentions, readBy) without joins
- **Horizontal Scaling**: MongoDB sharding for future scalability
- **JSON-like Structure**: Easy integration with JavaScript/Node.js
- **Real-time Friendly**: Change streams for real-time database updates (future enhancement)

**Trade-offs**:
- ✅ Pros: Flexible schema, no joins needed, good for nested data
- ❌ Cons: No ACID transactions across documents (mitigated by careful design), requires indexing strategy

**Date**: Project Initiation

---

## 3. Real-Time Communication: Socket.IO

**Decision**: Use Socket.IO for real-time bidirectional communication.

**Context**: Need for real-time message delivery, typing indicators, and presence updates.

**Options Considered**:
1. Socket.IO (WebSocket with fallbacks)
2. Native WebSocket API
3. Server-Sent Events (SSE)
4. Polling (HTTP requests)
5. GraphQL Subscriptions

**Rationale**:
- **Automatic Fallbacks**: WebSocket → polling fallback for compatibility
- **Room Management**: Built-in room/channel support perfect for chat rooms
- **Event-Based**: Event-driven architecture fits well with React state management
- **Authentication**: Built-in support for JWT in handshake
- **Reconnection**: Automatic reconnection handling
- **Cross-Browser**: Works across all browsers and network conditions

**Trade-offs**:
- ✅ Pros: Reliable, feature-rich, easy to use
- ❌ Cons: Slightly larger bundle size, requires server adapter for multi-server scaling

**Date**: Project Initiation

---

## 4. Authentication: JWT (JSON Web Tokens)

**Decision**: Use JWT for authentication instead of session-based authentication.

**Context**: Need for stateless authentication that works with both REST APIs and WebSocket connections.

**Options Considered**:
1. JWT (Stateless tokens)
2. Session-based (Server-side sessions with cookies)
3. OAuth 2.0 (Third-party authentication)
4. API Keys

**Rationale**:
- **Stateless**: No server-side session storage needed, scales horizontally
- **REST + WebSocket**: Same token works for both REST APIs and Socket.IO
- **Portable**: Token can be validated without database lookup
- **Expiration**: Built-in token expiration for security
- **Mobile-Ready**: Works well with mobile apps (future)
- **Microservices**: Easy to integrate with multiple services

**Trade-offs**:
- ✅ Pros: Stateless, scalable, works with WebSocket
- ❌ Cons: Cannot revoke tokens before expiry (mitigated with short expiration), token size larger than session ID

**Date**: Project Initiation

---

## 5. Frontend State Management: React Context + Custom Hooks

**Decision**: Use React Context API for global state (auth) and custom hooks for feature-specific state.

**Context**: Need for state management without heavy libraries, keeping bundle size small.

**Options Considered**:
1. React Context + Custom Hooks (Current)
2. Redux + Redux Toolkit
3. Zustand
4. Jotai
5. Recoil

**Rationale**:
- **Lightweight**: No additional dependencies for simple use cases
- **Built-in**: Context API is part of React, no learning curve
- **Custom Hooks**: Encapsulate logic and state in reusable hooks
- **Small Bundle**: No external state management library reduces bundle size
- **Simplicity**: For this app's complexity, Context + hooks is sufficient
- **Performance**: React Context is performant for small to medium apps

**Trade-offs**:
- ✅ Pros: Lightweight, simple, no extra dependencies
- ❌ Cons: Context can cause unnecessary re-renders if not optimized (mitigated with careful design), not ideal for very complex state

**Date**: Early Development

---

## 6. Password Hashing: bcryptjs

**Decision**: Use bcryptjs for password hashing.

**Context**: Need to securely store user passwords.

**Options Considered**:
1. bcryptjs (JavaScript implementation)
2. bcrypt (Native C++ bindings)
3. Argon2 (Modern password hashing)
4. scrypt

**Rationale**:
- **Purpose-Built**: Designed specifically for password hashing
- **Slow Hashing**: Intentionally slow to deter brute force attacks
- **Salt Rounds**: Configurable cost factor (10 rounds used)
- **Cross-Platform**: JavaScript implementation works everywhere
- **Industry Standard**: Widely used and trusted

**Trade-offs**:
- ✅ Pros: Secure, purpose-built, widely used
- ❌ Cons: Slower than native bcrypt (acceptable for this use case)

**Date**: Early Development

---

## 7. Input Validation: Joi

**Decision**: Use Joi for request validation.

**Context**: Need to validate and sanitize all user inputs.

**Options Considered**:
1. Joi (Schema-based validation)
2. express-validator (Express middleware)
3. Yup (Schema validation)
4. Zod (TypeScript-first validation)
5. Manual validation

**Rationale**:
- **Schema-Based**: Declarative validation schemas
- **Type Safety**: Validates data types and formats
- **Error Messages**: Clear, customizable error messages
- **Middleware Integration**: Works well with Express middleware
- **Mature**: Stable, well-documented library

**Trade-offs**:
- ✅ Pros: Declarative, type-safe, good error messages
- ❌ Cons: Runtime validation (no compile-time checks), but acceptable for JavaScript

**Date**: Early Development

---

## 8. XSS Prevention: sanitize-html

**Decision**: Use sanitize-html library to sanitize message content.

**Context**: Need to prevent XSS attacks from user-generated content.

**Options Considered**:
1. sanitize-html (Strip all HTML)
2. DOMPurify (Sanitize HTML)
3. xss (XSS filter)
4. Manual regex replacement

**Rationale**:
- **Strict Approach**: Strip all HTML tags (messages are plain text)
- **Simple**: No need to allow any HTML in messages
- **Safe**: Zero-tolerance approach prevents all XSS
- **Performance**: Fast processing

**Trade-offs**:
- ✅ Pros: Very secure, simple, fast
- ❌ Cons: No rich text formatting (can be added later if needed)

**Date**: Early Development

---

## 9. Pagination: Cursor-Based

**Decision**: Use cursor-based pagination instead of offset-based pagination.

**Context**: Need efficient pagination for messages and notifications.

**Options Considered**:
1. Cursor-based (before timestamp)
2. Offset-based (skip/limit)
3. Keyset pagination (using _id)
4. Infinite scroll with virtual scrolling

**Rationale**:
- **Performance**: No need to skip large numbers of documents
- **Consistent**: Works well with chronological data (messages, notifications)
- **Scalable**: Performance doesn't degrade with large datasets
- **Real-time Friendly**: Easy to integrate with real-time updates

**Trade-offs**:
- ✅ Pros: Efficient, scalable, works with real-time
- ❌ Cons: Cannot jump to specific page (acceptable for chat apps)

**Date**: Early Development

---

## 10. Read Receipts: Embedded Array

**Decision**: Store read receipts as embedded array in Message document.

**Context**: Need to track who has read which messages.

**Options Considered**:
1. Embedded array in Message (Current)
2. Separate ReadReceipt collection
3. User-side tracking (client-side only)

**Rationale**:
- **Performance**: Single query to get message with read receipts
- **Atomic Updates**: Update message and read receipts in one operation
- **Simple**: No joins needed
- **Scalable**: For typical chat rooms (10-50 members), array size is manageable

**Trade-offs**:
- ✅ Pros: Fast queries, simple, atomic updates
- ❌ Cons: Array grows with room size (mitigated by room size limits in practice)

**Date**: Early Development

---

## 11. Token Storage: In-Memory (Frontend)

**Decision**: Store JWT token in memory (React state) instead of localStorage.

**Context**: Need secure token storage that doesn't persist across sessions.

**Options Considered**:
1. In-memory (React state) - Current
2. localStorage
3. sessionStorage
4. HttpOnly cookies

**Rationale**:
- **Security**: Token not accessible via JavaScript (XSS protection)
- **Session-Based**: Token cleared on page refresh (forces re-login)
- **No Persistence**: Reduces risk of token theft
- **Simple**: No need for token refresh logic (can be added later)

**Trade-offs**:
- ✅ Pros: More secure, no XSS risk
- ❌ Cons: User must log in on each page refresh (acceptable for this use case)

**Date**: Early Development

---

## 12. Error Handling: Centralized Error Handler

**Decision**: Use centralized error handler middleware in Express.

**Context**: Need consistent error responses across all routes.

**Options Considered**:
1. Centralized error handler (Current)
2. Try-catch in each controller
3. Error handling library (like express-async-errors)
4. Custom error classes

**Rationale**:
- **Consistency**: All errors follow same format
- **DRY Principle**: Don't repeat error handling code
- **Logging**: Centralized logging of all errors
- **Security**: Avoid exposing sensitive error details

**Trade-offs**:
- ✅ Pros: Consistent, maintainable, secure
- ❌ Cons: Requires careful error propagation

**Date**: Early Development

---

## 13. Logging: Pino

**Decision**: Use Pino for structured logging.

**Context**: Need for efficient, structured logging in production.

**Options Considered**:
1. Pino (Fast, structured logging)
2. Winston (Feature-rich)
3. Bunyan (Structured logging)
4. console.log (Simple but not production-ready)

**Rationale**:
- **Performance**: One of the fastest Node.js loggers
- **Structured**: JSON logs for easy parsing
- **Pretty Printing**: Development-friendly output
- **Redaction**: Built-in support for redacting sensitive fields

**Trade-offs**:
- ✅ Pros: Fast, structured, production-ready
- ❌ Cons: Less feature-rich than Winston (but sufficient for this app)

**Date**: Early Development

---

## 14. Styling: Tailwind CSS

**Decision**: Use Tailwind CSS for styling.

**Context**: Need for rapid UI development with consistent design system.

**Options Considered**:
1. Tailwind CSS (Utility-first)
2. CSS Modules
3. Styled Components
4. Material-UI
5. Plain CSS

**Rationale**:
- **Rapid Development**: Utility classes speed up development
- **Consistency**: Design system built-in
- **Small Bundle**: PurgeCSS removes unused styles
- **Flexibility**: Easy to customize
- **Modern**: Widely adopted, good documentation

**Trade-offs**:
- ✅ Pros: Fast development, consistent, small bundle
- ❌ Cons: HTML can become verbose (mitigated with component abstraction)

**Date**: Early Development

---

## 15. Room Deletion: Cascade Delete

**Decision**: When a room is deleted, delete all associated messages and notifications.

**Context**: Need to handle data cleanup when room is deleted.

**Options Considered**:
1. Cascade delete (Current)
2. Soft delete (mark as deleted)
3. Archive (move to archive collection)
4. Keep all data (just remove room)

**Rationale**:
- **Data Integrity**: Ensures no orphaned messages
- **Privacy**: Removes all data when room is deleted
- **Simplicity**: Clear, straightforward approach
- **Storage**: Frees up database space

**Trade-offs**:
- ✅ Pros: Clean data, privacy, simple
- ❌ Cons: Data loss (but intentional for deleted rooms)

**Date**: Mid Development

---

## 16. @Mention: Auto-Add to Room

**Decision**: Automatically add mentioned users to the room if they're not already members.

**Context**: Need to ensure mentioned users can access the room.

**Options Considered**:
1. Auto-add to room (Current)
2. Send notification only
3. Ask for permission first

**Rationale**:
- **User Experience**: Mentioned users can immediately see the message
- **Consistency**: All mentioned users have access to the conversation
- **Simplicity**: No additional permission flow needed

**Trade-offs**:
- ✅ Pros: Better UX, immediate access
- ❌ Cons: Users added to rooms without explicit consent (acceptable for team chat)

**Date**: Mid Development

---

## 17. Message History: Fetch on Room Open

**Decision**: Fetch message history when user opens a room, not on app load.

**Context**: Need efficient loading strategy for messages.

**Options Considered**:
1. Fetch on room open (Current)
2. Pre-fetch all messages on app load
3. Lazy load on scroll
4. Cache messages in Redux

**Rationale**:
- **Performance**: Only load messages for active room
- **Bandwidth**: Reduce initial load time
- **Memory**: Don't keep all messages in memory
- **Real-time**: New messages arrive via Socket.IO anyway

**Trade-offs**:
- ✅ Pros: Fast initial load, efficient memory usage
- ❌ Cons: Slight delay when opening room (acceptable, shows loading state)

**Date**: Mid Development

---

## 18. Read Receipts: Exclude Sender

**Decision**: Sender's own messages are never marked as read by the sender.

**Context**: Need to accurately track who has read messages.

**Options Considered**:
1. Exclude sender (Current)
2. Include sender
3. Mark as read immediately for sender

**Rationale**:
- **Accuracy**: Only tracks reads from other users
- **Consistency**: Matches WhatsApp-style behavior
- **Logic**: Sender already saw the message (they sent it)

**Trade-offs**:
- ✅ Pros: Accurate tracking, intuitive behavior
- ❌ Cons: Sender's read count doesn't include themselves (expected behavior)

**Date**: Mid Development

---

## 19. Socket.IO: Room-Based Channels

**Decision**: Use room-based channels for message broadcasting.

**Context**: Need efficient message delivery to room members only.

**Options Considered**:
1. Room-based channels (Current)
2. Broadcast to all users
3. User-based channels only
4. Hybrid approach

**Rationale**:
- **Efficiency**: Only users in room receive messages
- **Scalability**: Reduces unnecessary message delivery
- **Security**: Users only receive messages from rooms they're members of
- **Built-in**: Socket.IO rooms are perfect for this use case

**Trade-offs**:
- ✅ Pros: Efficient, secure, scalable
- ❌ Cons: Users must join/leave rooms (but this is expected behavior)

**Date**: Mid Development

---

## 20. Database Indexes: Compound Indexes

**Decision**: Use compound indexes for common query patterns.

**Context**: Need efficient queries for messages and notifications.

**Options Considered**:
1. Compound indexes (Current)
2. Single-field indexes only
3. Covering indexes
4. No indexes (rely on _id only)

**Rationale**:
- **Performance**: Compound indexes speed up multi-field queries
- **Pagination**: `{ roomId: 1, createdAt: -1 }` index perfect for message pagination
- **Queries**: Matches actual query patterns
- **MongoDB Best Practice**: Recommended approach

**Trade-offs**:
- ✅ Pros: Fast queries, efficient pagination
- ❌ Cons: Slightly slower writes (acceptable trade-off)

**Date**: Mid Development

---

## Summary of Key Decisions

| Decision | Technology/Approach | Primary Reason |
|----------|-------------------|----------------|
| Stack | MERN | Single language, real-time support |
| Database | MongoDB | Flexible schema, array support |
| Real-time | Socket.IO | Automatic fallbacks, room support |
| Auth | JWT | Stateless, works with WebSocket |
| State | Context + Hooks | Lightweight, sufficient for app |
| Validation | Joi | Schema-based, type-safe |
| XSS Prevention | sanitize-html | Zero-tolerance, secure |
| Pagination | Cursor-based | Efficient, scalable |
| Read Receipts | Embedded array | Fast queries, simple |
| Token Storage | In-memory | Security, no XSS risk |
| Error Handling | Centralized | Consistent, maintainable |
| Logging | Pino | Fast, structured |
| Styling | Tailwind CSS | Rapid development, consistent |
| Room Deletion | Cascade delete | Data integrity, privacy |
| @Mention | Auto-add to room | Better UX, immediate access |

---

## Future Decisions to Consider

### 1. Multi-Server Scaling
**Decision Needed**: How to scale Socket.IO across multiple servers?
**Options**: Redis adapter, Sticky sessions, Message queue
**Status**: Pending

### 2. File Uploads
**Decision Needed**: How to handle file/image uploads?
**Options**: Cloud storage (S3), Local storage, CDN
**Status**: Pending

### 3. Message Search
**Decision Needed**: How to implement full-text search?
**Options**: MongoDB text search, Elasticsearch, Algolia
**Status**: Pending

### 4. Mobile Apps
**Decision Needed**: How to support mobile apps?
**Options**: React Native, Native apps, PWA
**Status**: Pending

### 5. Token Refresh
**Decision Needed**: Should we implement refresh tokens?
**Options**: Yes (refresh token flow), No (current short expiration)
**Status**: Pending

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Author**: TeamPulse Development Team

