# TeamPulse - Database Schema Diagram

## Overview

TeamPulse uses MongoDB as its database, with Mongoose as the ODM (Object Document Mapper). The database consists of 4 main collections: `users`, `rooms`, `messages`, and `notifications`.

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         DATABASE SCHEMA                         │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│    User      │
├──────────────┤
│ _id (PK)     │◄──────┐
│ name         │       │
│ username (U) │       │
│ email (U)    │       │
│ passwordHash │       │
│ status       │       │
│ createdAt    │       │
│ updatedAt    │       │
└──────────────┘       │
       │               │
       │               │
       │ 1:N           │ N:1
       │ creates       │ createdBy
       │               │
       ▼               │
┌──────────────┐       │
│    Room      │       │
├──────────────┤       │
│ _id (PK)     │       │
│ name         │       │
│ members []   │◄──────┤ N:M (many-to-many)
│ createdBy (FK)◄──────┘
│ lastMessageAt│
│ createdAt    │
│ updatedAt    │
└──────────────┘
       │
       │ 1:N
       │ contains
       │
       ▼
┌──────────────┐
│   Message    │
├──────────────┤
│ _id (PK)     │
│ roomId (FK)  │◄──────┐
│ senderId (FK)│◄──────┤ N:1
│ content      │       │
│ mentions []  │◄──────┤ N:M (mentions)
│ readBy []    │       │
│   - userId   │       │
│   - at       │       │
│ createdAt    │       │
└──────────────┘       │
       │               │
       │ 1:N           │
       │ referenced in │
       │               │
       ▼               │
┌──────────────┐       │
│ Notification │       │
├──────────────┤       │
│ _id (PK)     │       │
│ userId (FK)  │◄──────┤
│ type         │       │
│ roomId (FK)  │◄──────┘
│ fromUserId (FK)◄─────┘
│ messageId (FK)◄──────┘
│ read         │
│ createdAt    │
└──────────────┘
```

**Legend:**
- `(PK)` = Primary Key
- `(FK)` = Foreign Key (Reference)
- `(U)` = Unique Index
- `[]` = Array Field
- `N:M` = Many-to-Many Relationship
- `1:N` = One-to-Many Relationship
- `N:1` = Many-to-One Relationship

---

## Collection Details

### 1. Users Collection

**Collection Name:** `users`

**Description:** Stores user account information and authentication data.

#### Fields

| Field | Type | Required | Unique | Indexed | Description |
|-------|------|----------|--------|---------|-------------|
| `_id` | ObjectId | Yes | Yes | Yes | Primary key, auto-generated |
| `name` | String | No | No | No | User's full name |
| `username` | String | Yes | Yes | Yes | Unique username (alphanumeric, lowercase) |
| `email` | String | Yes | Yes | Yes | User's email address (lowercase) |
| `passwordHash` | String | Yes | No | No | Bcrypt hashed password (never returned in API) |
| `status` | String | No | No | No | User's online status: `'online'` or `'offline'` |
| `createdAt` | Date | Auto | No | No | Document creation timestamp |
| `updatedAt` | Date | Auto | No | No | Document last update timestamp |

#### Indexes

```javascript
// Unique indexes
{ username: 1 }        // Unique username lookup
{ email: 1 }           // Unique email lookup

// Regular indexes
// (username and email already indexed via unique constraint)
```

#### Sample Document

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "name": "Alice Johnson",
  "username": "alice",
  "email": "alice@example.com",
  "passwordHash": "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
  "status": "online",
  "createdAt": ISODate("2024-01-15T10:30:00Z"),
  "updatedAt": ISODate("2024-01-15T10:30:00Z")
}
```

#### Relationships

- **One-to-Many**: A user can create multiple rooms (`createdBy`)
- **Many-to-Many**: A user can be a member of multiple rooms (`members` array)
- **One-to-Many**: A user can send multiple messages (`senderId`)
- **One-to-Many**: A user can receive multiple notifications (`userId`)

---

### 2. Rooms Collection

**Collection Name:** `rooms`

**Description:** Stores chat room information, members, and metadata.

#### Fields

| Field | Type | Required | Unique | Indexed | Description |
|-------|------|----------|--------|---------|-------------|
| `_id` | ObjectId | Yes | Yes | Yes | Primary key, auto-generated |
| `name` | String | Yes | No | Yes | Room name (2-80 characters) |
| `members` | Array[ObjectId] | Yes | No | Yes | Array of user IDs who are room members (multikey index) |
| `createdBy` | ObjectId | Yes | No | No | Reference to User who created the room |
| `lastMessageAt` | Date | No | No | Yes | Timestamp of the last message in the room (for sorting) |
| `createdAt` | Date | Auto | No | No | Document creation timestamp |
| `updatedAt` | Date | Auto | No | No | Document last update timestamp |

#### Indexes

```javascript
// Multikey index (for array field)
{ members: 1 }              // Efficient member lookup

// Regular indexes
{ name: 1 }                 // Room name lookup
{ lastMessageAt: -1 }       // Sort rooms by recent activity (descending)
```

#### Sample Document

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439012"),
  "name": "General Discussion",
  "members": [
    ObjectId("507f1f77bcf86cd799439011"),
    ObjectId("507f1f77bcf86cd799439013"),
    ObjectId("507f1f77bcf86cd799439014")
  ],
  "createdBy": ObjectId("507f1f77bcf86cd799439011"),
  "lastMessageAt": ISODate("2024-01-15T12:45:00Z"),
  "createdAt": ISODate("2024-01-15T10:00:00Z"),
  "updatedAt": ISODate("2024-01-15T12:45:00Z")
}
```

#### Relationships

- **Many-to-One**: Multiple rooms can be created by one user (`createdBy`)
- **Many-to-Many**: Multiple users can be members of multiple rooms (`members` array)
- **One-to-Many**: A room can contain multiple messages (`roomId`)
- **One-to-Many**: A room can be referenced in multiple notifications (`roomId`)

---

### 3. Messages Collection

**Collection Name:** `messages`

**Description:** Stores chat messages, read receipts, and mentions.

#### Fields

| Field | Type | Required | Unique | Indexed | Description |
|-------|------|----------|--------|---------|-------------|
| `_id` | ObjectId | Yes | Yes | Yes | Primary key, auto-generated |
| `roomId` | ObjectId | Yes | No | Yes | Reference to Room where message was sent |
| `senderId` | ObjectId | Yes | No | Yes | Reference to User who sent the message |
| `content` | String | Yes | No | No | Message content (HTML sanitized, XSS protected) |
| `mentions` | Array[ObjectId] | No | No | No | Array of user IDs mentioned in the message (@mentions) |
| `readBy` | Array[Object] | No | No | No | Array of read receipts with structure: `{ userId: ObjectId, at: Date }` |
| `createdAt` | Date | Auto | No | Yes | Message creation timestamp (used in compound index) |

#### Indexes

```javascript
// Compound index (for pagination)
{ roomId: 1, createdAt: -1 }  // Efficient message history pagination per room

// Regular indexes
{ senderId: 1 }                // Query messages by sender
```

#### Sample Document

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439015"),
  "roomId": ObjectId("507f1f77bcf86cd799439012"),
  "senderId": ObjectId("507f1f77bcf86cd799439011"),
  "content": "Hey @bob, can you review this?",
  "mentions": [
    ObjectId("507f1f77bcf86cd799439013")
  ],
  "readBy": [
    {
      "userId": ObjectId("507f1f77bcf86cd799439013"),
      "at": ISODate("2024-01-15T11:00:00Z")
    },
    {
      "userId": ObjectId("507f1f77bcf86cd799439014"),
      "at": ISODate("2024-01-15T11:05:00Z")
    }
  ],
  "createdAt": ISODate("2024-01-15T10:45:00Z")
}
```

#### Relationships

- **Many-to-One**: Multiple messages belong to one room (`roomId`)
- **Many-to-One**: Multiple messages can be sent by one user (`senderId`)
- **Many-to-Many**: A message can mention multiple users (`mentions` array)
- **One-to-Many**: A message can have multiple read receipts (`readBy` array)
- **One-to-Many**: A message can be referenced in multiple notifications (`messageId`)

#### Read Receipts Structure

The `readBy` array contains objects with:
- `userId`: ObjectId reference to User who read the message
- `at`: Date timestamp when the message was read

**Note:** The sender of a message does not mark their own messages as read.

---

### 4. Notifications Collection

**Collection Name:** `notifications`

**Description:** Stores user notifications for mentions, invites, and room deletions.

#### Fields

| Field | Type | Required | Unique | Indexed | Description |
|-------|------|----------|--------|---------|-------------|
| `_id` | ObjectId | Yes | Yes | Yes | Primary key, auto-generated |
| `userId` | ObjectId | Yes | No | Yes | Reference to User who receives the notification |
| `type` | String | Yes | No | No | Notification type: `'mention'`, `'invite'`, or `'room_deleted'` |
| `roomId` | ObjectId | No | No | No | Reference to Room (optional, null for some types) |
| `fromUserId` | ObjectId | No | No | No | Reference to User who triggered the notification |
| `messageId` | ObjectId | No | No | No | Reference to Message (only for 'mention' type) |
| `read` | Boolean | No | No | Yes | Whether the notification has been read (default: false) |
| `createdAt` | Date | Auto | No | Yes | Notification creation timestamp |

#### Indexes

```javascript
// Compound indexes (for efficient queries)
{ userId: 1, createdAt: -1 }  // Get user's notifications, sorted by newest first
{ userId: 1, read: 1 }        // Get unread notifications count per user
```

#### Sample Documents

**Mention Notification:**
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439016"),
  "userId": ObjectId("507f1f77bcf86cd799439013"),
  "type": "mention",
  "roomId": ObjectId("507f1f77bcf86cd799439012"),
  "fromUserId": ObjectId("507f1f77bcf86cd799439011"),
  "messageId": ObjectId("507f1f77bcf86cd799439015"),
  "read": false,
  "createdAt": ISODate("2024-01-15T10:45:00Z")
}
```

**Invite Notification:**
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439017"),
  "userId": ObjectId("507f1f77bcf86cd799439014"),
  "type": "invite",
  "roomId": ObjectId("507f1f77bcf86cd799439012"),
  "fromUserId": ObjectId("507f1f77bcf86cd799439011"),
  "messageId": null,
  "read": true,
  "createdAt": ISODate("2024-01-15T10:30:00Z")
}
```

**Room Deleted Notification:**
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439018"),
  "userId": ObjectId("507f1f77bcf86cd799439013"),
  "type": "room_deleted",
  "roomId": ObjectId("507f1f77bcf86cd799439012"),
  "fromUserId": ObjectId("507f1f77bcf86cd799439011"),
  "messageId": null,
  "read": false,
  "createdAt": ISODate("2024-01-15T13:00:00Z")
}
```

#### Relationships

- **Many-to-One**: Multiple notifications belong to one user (`userId`)
- **Many-to-One**: Multiple notifications can reference one room (`roomId`)
- **Many-to-One**: Multiple notifications can be triggered by one user (`fromUserId`)
- **Many-to-One**: Multiple notifications can reference one message (`messageId`)

---

## Indexes Summary

### Primary Indexes (Unique)

| Collection | Index | Type | Purpose |
|------------|-------|------|---------|
| `users` | `{ username: 1 }` | Unique | Ensure unique usernames |
| `users` | `{ email: 1 }` | Unique | Ensure unique email addresses |

### Secondary Indexes

| Collection | Index | Type | Purpose |
|------------|-------|------|---------|
| `rooms` | `{ members: 1 }` | Multikey | Efficient member lookup |
| `rooms` | `{ name: 1 }` | Regular | Room name search |
| `rooms` | `{ lastMessageAt: -1 }` | Regular | Sort rooms by recent activity |
| `messages` | `{ roomId: 1, createdAt: -1 }` | Compound | Efficient message pagination |
| `messages` | `{ senderId: 1 }` | Regular | Query messages by sender |
| `notifications` | `{ userId: 1, createdAt: -1 }` | Compound | Get user notifications (newest first) |
| `notifications` | `{ userId: 1, read: 1 }` | Compound | Get unread notifications count |

### Index Usage Patterns

1. **User Lookup**: `username` and `email` indexes for authentication
2. **Room Membership**: `members` multikey index for checking if user is in room
3. **Message Pagination**: Compound index `{ roomId: 1, createdAt: -1 }` for efficient cursor-based pagination
4. **Notification Queries**: Compound indexes for fetching user notifications and unread counts
5. **Room Sorting**: `lastMessageAt` index for sorting rooms by activity

---

## Relationships Diagram (Detailed)

```
User (1) ──< creates >── (N) Room
  │                          │
  │                          │
  │ N:M                      │ 1:N
  │ member of                │ contains
  │                          │
  ▼                          ▼
Room (N) ──< members >── (M) User

User (1) ──< sends >── (N) Message
  │
  │ N:M
  │ mentioned in
  │
  ▼
Message (N) ──< mentions >── (M) User

Room (1) ──< contains >── (N) Message

Message (1) ──< referenced in >── (N) Notification

User (1) ──< receives >── (N) Notification

Room (1) ──< referenced in >── (N) Notification

User (1) ──< triggers >── (N) Notification
```

---

## Data Integrity Rules

### 1. Cascade Deletion

When a **room is deleted**:
- All messages in that room are deleted
- All notifications referencing that room are deleted (except `room_deleted` notifications which are kept for reference)
- The room document is deleted

**Note:** Users are never deleted (soft delete could be implemented in future).

### 2. Automatic Actions

- **@Mention**: When a user is @mentioned in a room, they are automatically added to that room if not already a member
- **Room Creation**: The creator is automatically added as a member
- **Read Receipts**: Sender's own messages are never marked as read by the sender

### 3. Validation Rules

- **Username**: Alphanumeric, 3-30 characters, lowercase
- **Email**: Valid email format, lowercase
- **Room Name**: 2-80 characters
- **Message Content**: Non-empty after sanitization
- **Notification Type**: Must be one of: `'mention'`, `'invite'`, `'room_deleted'`

---

## Query Patterns

### Common Queries

1. **Get User's Rooms**:
   ```javascript
   Room.find({ members: userId }).sort({ lastMessageAt: -1 })
   ```

2. **Get Room Messages** (Paginated):
   ```javascript
   Message.find({ roomId, createdAt: { $lt: beforeTimestamp } })
     .sort({ createdAt: -1 })
     .limit(20)
   ```

3. **Get User Notifications** (Paginated):
   ```javascript
   Notification.find({ userId, createdAt: { $lt: beforeTimestamp } })
     .sort({ createdAt: -1 })
     .limit(20)
   ```

4. **Get Unread Notifications Count**:
   ```javascript
   Notification.countDocuments({ userId, read: false })
   ```

5. **Check Room Membership**:
   ```javascript
   Room.findOne({ _id: roomId, members: userId })
   ```

6. **Get Messages with Read Receipts**:
   ```javascript
   Message.find({ roomId }).populate('senderId', 'name username')
   ```

---

## Performance Considerations

### Index Usage

- **Compound indexes** are used for common query patterns (e.g., `{ roomId: 1, createdAt: -1 }`)
- **Multikey indexes** are used for array fields (e.g., `members` array)
- **Descending indexes** are used for recent-first sorting (e.g., `lastMessageAt: -1`)

### Query Optimization

- Use `.lean()` for read-only queries to return plain JavaScript objects (faster)
- Use `.select()` to fetch only required fields
- Use pagination to limit result sets
- Use cursor-based pagination for chronological data

### Storage Optimization

- Embedded documents (e.g., `readBy` array) reduce joins
- Array fields (e.g., `members`, `mentions`) are efficient for small arrays
- Indexes are created on frequently queried fields

---

## Migration Considerations

### Future Enhancements

1. **Message Reactions**: Could add `reactions` array to Message schema
2. **Message Editing**: Could add `editedAt` field and `edited` boolean
3. **Message Threading**: Could add `parentMessageId` field for replies
4. **Room Settings**: Could add `settings` object for room configuration
5. **User Avatar**: Could add `avatarUrl` field to User schema
6. **Message Attachments**: Could add `attachments` array to Message schema

### Backward Compatibility

- New fields should have default values or be optional
- Index changes should be done during maintenance windows
- Schema migrations should be tested in staging first

---

## Sample Data Relationships

```
User (alice) ──creates──> Room (General Discussion)
  │                           │
  │                           │ members: [alice, bob, charlie]
  │                           │
  │ sends                     │ contains
  │                           │
  ▼                           ▼
Message ("Hello @bob") ──references──> Room
  │
  │ mentions: [bob]
  │
  ▼
Notification (mention) ──received by──> User (bob)
  │
  │ references
  │
  ▼
Message ("Hello @bob")
```

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Author**: TeamPulse Development Team

