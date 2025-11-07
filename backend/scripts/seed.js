import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Room from '../src/models/Room.js';
import Message from '../src/models/Message.js';
import Notification from '../src/models/Notification.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/TeamPulse';

// Sample users data
const sampleUsers = [
  {
    name: 'Alice Johnson',
    username: 'alice',
    email: 'alice@example.com',
    password: 'password123',
    status: 'online',
  },
  {
    name: 'Bob Smith',
    username: 'bob',
    email: 'bob@example.com',
    password: 'password123',
    status: 'online',
  },
  {
    name: 'Charlie Brown',
    username: 'charlie',
    email: 'charlie@example.com',
    password: 'password123',
    status: 'offline',
  },
  {
    name: 'Diana Prince',
    username: 'diana',
    email: 'diana@example.com',
    password: 'password123',
    status: 'online',
  },
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🧹 Cleaning existing data...');
    await User.deleteMany({});
    await Room.deleteMany({});
    await Message.deleteMany({});
    await Notification.deleteMany({});
    console.log('✅ Existing data cleared\n');

    // Create users
    console.log('👥 Creating users...');
    const users = [];
    for (const userData of sampleUsers) {
      const passwordHash = await bcrypt.hash(userData.password, 10);
      const user = await User.create({
        name: userData.name,
        username: userData.username,
        email: userData.email,
        passwordHash,
        status: userData.status,
      });
      users.push(user);
      console.log(`   ✓ Created user: ${user.username} (${user.email})`);
    }
    console.log(`✅ Created ${users.length} users\n`);

    // Create rooms
    console.log('🏠 Creating rooms...');
    const rooms = [];

    // Room 1: General Discussion (all users)
    const room1 = await Room.create({
      name: 'General Discussion',
      members: users.map((u) => u._id),
      createdBy: users[0]._id,
      lastMessageAt: new Date(),
    });
    rooms.push(room1);
    console.log(`   ✓ Created room: ${room1.name} (${room1.members.length} members)`);

    // Room 2: Development Team (alice, bob, charlie)
    const room2 = await Room.create({
      name: 'Development Team',
      members: [users[0]._id, users[1]._id, users[2]._id],
      createdBy: users[0]._id,
      lastMessageAt: new Date(),
    });
    rooms.push(room2);
    console.log(`   ✓ Created room: ${room2.name} (${room2.members.length} members)`);

    // Room 3: Design Team (alice, diana)
    const room3 = await Room.create({
      name: 'Design Team',
      members: [users[0]._id, users[3]._id],
      createdBy: users[3]._id,
      lastMessageAt: new Date(),
    });
    rooms.push(room3);
    console.log(`   ✓ Created room: ${room3.name} (${room3.members.length} members)`);

    console.log(`✅ Created ${rooms.length} rooms\n`);

    // Create messages
    console.log('💬 Creating messages...');
    const messages = [];

    // Messages in Room 1 (General Discussion)
    const room1Messages = [
      {
        roomId: room1._id,
        senderId: users[0]._id,
        content: 'Hello everyone! Welcome to TeamPulse 👋',
        readBy: [{ userId: users[0]._id, at: new Date() }, { userId: users[1]._id, at: new Date() }],
      },
      {
        roomId: room1._id,
        senderId: users[1]._id,
        content: 'Hey @alice! Thanks for creating this room. This looks great!',
        mentions: [users[0]._id],
        readBy: [{ userId: users[1]._id, at: new Date() }],
      },
      {
        roomId: room1._id,
        senderId: users[2]._id,
        content: 'Hey guys! Sorry for the late reply. How is everyone doing?',
        readBy: [],
      },
      {
        roomId: room1._id,
        senderId: users[3]._id,
        content: 'Great to see everyone here! Let\'s make this project awesome! 🚀',
        readBy: [{ userId: users[3]._id, at: new Date() }, { userId: users[0]._id, at: new Date() }],
      },
    ];

    for (const msgData of room1Messages) {
      const msg = await Message.create({
        ...msgData,
        createdAt: new Date(Date.now() - Math.random() * 86400000), // Random time in last 24 hours
      });
      messages.push(msg);
    }

    // Messages in Room 2 (Development Team)
    const room2Messages = [
      {
        roomId: room2._id,
        senderId: users[0]._id,
        content: 'Hey team! Let\'s discuss the backend architecture.',
        readBy: [{ userId: users[0]._id, at: new Date() }],
      },
      {
        roomId: room2._id,
        senderId: users[1]._id,
        content: 'Sure @alice! I think we should use MongoDB for the database.',
        mentions: [users[0]._id],
        readBy: [{ userId: users[1]._id, at: new Date() }],
      },
      {
        roomId: room2._id,
        senderId: users[2]._id,
        content: 'Sounds good! When should we start?',
        readBy: [],
      },
    ];

    for (const msgData of room2Messages) {
      const msg = await Message.create({
        ...msgData,
        createdAt: new Date(Date.now() - Math.random() * 86400000),
      });
      messages.push(msg);
    }

    // Messages in Room 3 (Design Team)
    const room3Messages = [
      {
        roomId: room3._id,
        senderId: users[3]._id,
        content: 'Hey @alice! Let\'s work on the UI design together.',
        mentions: [users[0]._id],
        readBy: [{ userId: users[3]._id, at: new Date() }],
      },
      {
        roomId: room3._id,
        senderId: users[0]._id,
        content: 'Perfect! I love the dark theme we discussed earlier.',
        readBy: [{ userId: users[0]._id, at: new Date() }],
      },
    ];

    for (const msgData of room3Messages) {
      const msg = await Message.create({
        ...msgData,
        createdAt: new Date(Date.now() - Math.random() * 86400000),
      });
      messages.push(msg);
    }

    // Update room lastMessageAt
    for (const room of rooms) {
      const roomMessages = messages.filter((m) => m.roomId.toString() === room._id.toString());
      if (roomMessages.length > 0) {
        const latestMessage = roomMessages.sort((a, b) => b.createdAt - a.createdAt)[0];
        room.lastMessageAt = latestMessage.createdAt;
        await room.save();
      }
    }

    console.log(`✅ Created ${messages.length} messages\n`);

    // Create notifications
    console.log('🔔 Creating notifications...');
    const notifications = [];

    // Mention notification (alice mentioned in room1 by bob)
    const mentionNotif = await Notification.create({
      userId: users[0]._id,
      type: 'mention',
      roomId: room1._id,
      fromUserId: users[1]._id,
      messageId: messages[1]._id,
      read: false,
    });
    notifications.push(mentionNotif);

    // Invite notification (diana invited to room by alice - simulate)
    // Note: In real app, this would be created when user is invited
    const inviteNotif = await Notification.create({
      userId: users[3]._id,
      type: 'invite',
      roomId: room1._id,
      fromUserId: users[0]._id,
      read: true,
    });
    notifications.push(inviteNotif);

    // Another mention notification (alice mentioned in room2 by bob)
    const mentionNotif2 = await Notification.create({
      userId: users[0]._id,
      type: 'mention',
      roomId: room2._id,
      fromUserId: users[1]._id,
      messageId: messages[5]._id,
      read: false,
    });
    notifications.push(mentionNotif2);

    // Mention notification (alice mentioned in room3 by diana)
    const mentionNotif3 = await Notification.create({
      userId: users[0]._id,
      type: 'mention',
      roomId: room3._id,
      fromUserId: users[3]._id,
      messageId: messages[7]._id,
      read: true,
    });
    notifications.push(mentionNotif3);

    console.log(`✅ Created ${notifications.length} notifications\n`);

    // Summary
    console.log('📊 Seeding Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Users:        ${users.length}`);
    console.log(`   Rooms:        ${rooms.length}`);
    console.log(`   Messages:     ${messages.length}`);
    console.log(`   Notifications: ${notifications.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🔑 Test Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   All users have password: password123');
    console.log('   Users:');
    users.forEach((u) => {
      console.log(`     - ${u.username} (${u.email}) - Status: ${u.status}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the seed function
seedDatabase()
  .then(() => {
    console.log('\n🎉 Seeding process finished!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Seeding process failed:', error);
    process.exit(1);
  });

