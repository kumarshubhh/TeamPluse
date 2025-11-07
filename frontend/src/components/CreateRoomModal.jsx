import { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * CreateRoomModal Component
 * 
 * Ye component kya karta hai:
 * 1. Modal dialog show karta hai room name input ke liye
 * 2. User se room name leta hai
 * 3. Create button pe API call karta hai
 * 4. Success pe modal close karta hai
 */
export default function CreateRoomModal({ isOpen, onClose, onCreateRoom, loading }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Room name is required');
      return;
    }
    try {
      setError('');
      await onCreateRoom(name.trim());
      setName(''); // Clear input
      onClose();   // Close modal
    } catch (err) {
      setError(err.message || 'Failed to create room');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="glass rounded-2xl p-6 w-full max-w-md border border-white/10"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Create New Room</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1.5">Room Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[rgba(143,148,251,0.45)]"
                placeholder="e.g., General, Dev Team"
                autoFocus
                disabled={loading}
              />
              {error && <p className="text-sm text-red-400 mt-1">{error}</p>}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="flex-1 px-4 py-2 rounded-xl gradient-accent soft-glow text-white hover:opacity-95 transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

