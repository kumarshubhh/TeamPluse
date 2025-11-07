# TeamPulse - Real-Time Team Chat & Notifications App

A full-stack real-time team communication application built with the MERN stack (MongoDB, Express.js, React, Node.js) featuring secure messaging, room management, notifications, and live presence indicators.

## 🌟 Features

### Core Features
- **User Authentication**: Secure signup/login with JWT token-based authentication
- **Real-Time Messaging**: Instant messaging within chat rooms using Socket.IO
- **Room Management**: Create, join, and manage chat rooms with member invitations
- **Notifications System**: Real-time notifications for @mentions, room invites, and room deletions
- **Read Receipts**: WhatsApp-style read receipts (single tick, double tick, blue tick)
- **Typing Indicators**: See when someone is typing in real-time
- **Online Status**: Track who's online/offline in each room
- **Message History**: Paginated message history with efficient MongoDB queries
- **User Profile**: Update profile information (name, email)
- **Room Deletion**: Room creators can delete rooms with cascade deletion of messages

### Security Features
- JWT authentication for REST APIs and Socket.IO connections
- Token validation and auto-disconnection on expiry
- Input validation with Joi schemas
- XSS protection with HTML sanitization
- Authorization checks (only room members can access/post messages)
- Rate limiting support
- Secure error handling

### UI/UX Features 
- Modern dark theme with glassmorphism design
- Responsive layout (mobile-friendly)
- Smooth animations with Framer Motion
- Search functionality for rooms
- Real-time updates without page refresh
- Toast notifications for user actions

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js 5.x
- **MongoDB** with Mongoose ODM
- **Socket.IO** for real-time communication
- **JWT** for authentication
- **Joi** for input validation
- **Pino** for structured logging
- **bcryptjs** for password hashing
- **sanitize-html** for XSS prevention

### Frontend
- **React 19** with functional components and hooks
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Axios** for API calls
- **Socket.IO Client** for real-time updates
- **Lucide React** for icons
- **Vite** for build tooling

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **MongoDB** (v6 or higher) - Local or MongoDB Atlas
- **npm** or **yarn** package manager
- **Git** for version control

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd teamPluse
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/TeamPulse
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1h
CORS_ORIGIN=http://localhost:5173
SOCKET_PATH=/socket.io
NODE_ENV=development
```

**Important**: Replace `JWT_SECRET` with a strong, random secret key in production.

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory:

```env
VITE_API_BASE_URL=http://localhost:4000
```

### 4. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# If using local MongoDB
mongod

# Or if using MongoDB as a service (macOS)
brew services start mongodb-community

# Or if using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 5. Seed Database (Optional)

To populate the database with sample data:

```bash
cd backend
npm run seed
```

## 🏃 Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

The backend server will start on `http://localhost:4000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:5173`

### Production Mode

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile

### Users
- `PATCH /api/users/status` - Update user online/offline status
- `PATCH /api/users/profile` - Update user profile (name, email)
- `GET /api/users?username=<username>` - Search user by username

### Rooms
- `POST /api/rooms` - Create a new room
- `GET /api/rooms` - Get all rooms for current user
- `GET /api/rooms/:roomId` - Get room details
- `POST /api/rooms/:roomId/invite` - Invite user to room
- `DELETE /api/rooms/:roomId` - Delete room (creator only)

### Messages
- `GET /api/rooms/:roomId/messages?limit=20&before=<timestamp>` - Get messages (paginated)
- `POST /api/rooms/:roomId/messages` - Send a message
- `POST /api/rooms/:roomId/read-receipts` - Mark messages as read

### Notifications
- `GET /api/notifications?limit=20&before=<timestamp>` - Get notifications (paginated)
- `POST /api/notifications/:id/read` - Mark notification as read
- `POST /api/notifications/read-all` - Mark all notifications as read

### Analytics
- `GET /api/analytics/top-rooms?limit=10` - Get top active rooms

## 🔌 Socket.IO Events

### Client → Server
- `join-room` - Join a room
- `leave-room` - Leave a room
- `new-message` - Send a message
- `message:read` - Mark message as read
- `typing:start` - Start typing indicator
- `typing:stop` - Stop typing indicator

### Server → Client
- `message:created` - New message received
- `message:read` - Message read receipt
- `notification:created` - New notification
- `typing:start` - User started typing
- `typing:stop` - User stopped typing
- `presence:list` - Online users in room
- `presence:offline` - User went offline
- `room:deleted` - Room was deleted
- `room:joined` - User joined room

## 📁 Project Structure

```
teamPluse/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files (DB, env, logger)
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Custom middleware (auth, validation, error)
│   │   ├── models/          # Mongoose models
│   │   ├── routes/          # API routes
│   │   ├── schemas/         # Joi validation schemas
│   │   ├── services/        # Business logic services
│   │   ├── socket/          # Socket.IO handlers
│   │   ├── utils/           # Utility functions
│   │   ├── app.js           # Express app setup
│   │   └── index.js         # Server entry point
│   ├── scripts/             # Utility scripts (seed, etc.)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/             # API client and endpoints
│   │   ├── auth/            # Authentication context
│   │   ├── components/      # Reusable components
│   │   ├── features/        # Feature-based components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Page components
│   │   ├── socket/          # Socket.IO client
│   │   ├── styles/          # Global styles
│   │   ├── utils/           # Utility functions
│   │   ├── App.jsx          # Main app component
│   │   ├── main.jsx         # Entry point
│   │   └── routes.jsx       # Route configuration
│   └── package.json
├── postman/                 # Postman collection
├── DOCS/                    # Documentation files
└── README.md
```

## 🗄️ Database Schema

### Collections

#### User
- `_id`: ObjectId
- `name`: String (required)
- `username`: String (required, unique)
- `email`: String (required, unique)
- `passwordHash`: String (required)
- `status`: String (enum: 'online', 'offline')
- `createdAt`: Date
- `updatedAt`: Date

#### Room
- `_id`: ObjectId
- `name`: String (required)
- `members`: [ObjectId] (references User)
- `createdBy`: ObjectId (references User)
- `lastMessageAt`: Date
- `createdAt`: Date
- `updatedAt`: Date

#### Message
- `_id`: ObjectId
- `roomId`: ObjectId (references Room)
- `senderId`: ObjectId (references User)
- `content`: String (required, sanitized)
- `mentions`: [ObjectId] (references User)
- `readBy`: [{ userId: ObjectId, at: Date }]
- `createdAt`: Date

#### Notification
- `_id`: ObjectId
- `userId`: ObjectId (references User)
- `type`: String (enum: 'mention', 'invite', 'room_deleted')
- `roomId`: ObjectId (references Room)
- `fromUserId`: ObjectId (references User)
- `messageId`: ObjectId (references Message, optional)
- `read`: Boolean (default: false)
- `createdAt`: Date
- `updatedAt`: Date

### Indexes

- **User**: `username` (unique), `email` (unique)
- **Room**: `members` (multikey), `lastMessageAt` (desc)
- **Message**: `{ roomId: 1, createdAt: -1 }` (compound), `senderId`
- **Notification**: `{ userId: 1, createdAt: -1 }`, `{ userId: 1, read: 1 }`

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Token Validation**: Automatic token expiry and validation
- **Input Validation**: Joi schemas for all inputs
- **XSS Protection**: HTML sanitization for message content
- **Authorization**: Room membership checks before access
- **Password Hashing**: bcryptjs with salt rounds
- **Error Handling**: Centralized error handling with secure error messages
- **Rate Limiting**: Support for rate limiting (configurable)
- **CORS**: Configurable CORS origin

## 🧪 Testing

### Manual Testing

1. **Authentication Flow**
   - Signup → Login → Access protected routes
   - Token expiry handling
   - Logout functionality

2. **Room Management**
   - Create room
   - Invite users
   - Delete room (as creator)
   - View room list

3. **Messaging**
   - Send messages
   - Real-time message delivery
   - Read receipts
   - Message history pagination

4. **Notifications**
   - @mention notifications
   - Room invite notifications
   - Room deletion notifications
   - Mark as read

5. **Real-Time Features**
   - Typing indicators
   - Online status
   - Presence updates

### Postman Collection

Import the Postman collection from `postman/TeamPulse.postman_collection.json` for API testing.

## 📝 Environment Variables

### Backend (.env)
```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/TeamPulse
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=1h
CORS_ORIGIN=http://localhost:5173
SOCKET_PATH=/socket.io
NODE_ENV=development
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:4000
```

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check `MONGODB_URI` in backend `.env`
- Verify network connectivity

### CORS Errors
- Check `CORS_ORIGIN` in backend `.env`
- Ensure frontend URL matches CORS origin

### Socket.IO Connection Issues
- Verify `VITE_API_BASE_URL` in frontend `.env`
- Check `SOCKET_PATH` in backend `.env`
- Ensure token is valid and not expired

### Port Already in Use
- Change `PORT` in backend `.env`
- Update `VITE_API_BASE_URL` in frontend `.env` accordingly

## 📚 Additional Documentation

- **Architecture Document**: See `DOCS/ARCHITECTURE.md`
- **Database Schema Diagram**: See `DOCS/DATABASE_SCHEMA.md`
- **Decision Log**: See `DOCS/DECISIONS.md`
- **Walkthrough Document**: See `DOCS/WALKTHROUGH.md`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👨‍💻 Author

TeamPulse Development Team

## 🙏 Acknowledgments

- Socket.IO for real-time communication
- MongoDB for flexible data storage
- React team for the amazing framework
- Tailwind CSS for utility-first styling

---

**Note**: This application is built for learning and demonstration purposes. For production use, ensure proper security measures, error handling, and testing are in place.

