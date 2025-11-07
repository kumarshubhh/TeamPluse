import mongoose from 'mongoose';

const readBySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, required: true },
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    readBy: { type: [readBySchema], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

messageSchema.index({ roomId: 1, createdAt: -1 });

export default mongoose.models.Message || mongoose.model('Message', messageSchema);
