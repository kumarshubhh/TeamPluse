import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lastMessageAt: { type: Date, index: true },
  },
  { timestamps: true }
);

roomSchema.index({ name: 1 });

export default mongoose.models.Room || mongoose.model('Room', roomSchema);
