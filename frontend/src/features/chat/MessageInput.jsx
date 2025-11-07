import { Smile, Send } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function MessageInput({ onSend, onTypingStart, onTypingStop }) {
  const [value, setValue] = useState('');
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const handleSend = () => {
    const text = value.trim();
    if (!text) return;
    onSend?.(text);
    setValue('');
    // Stop typing when message is sent
    if (isTypingRef.current) {
      onTypingStop?.();
      isTypingRef.current = false;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  };

  const handleInputChange = (e) => {
    setValue(e.target.value);
    
    // Start typing if not already typing
    if (!isTypingRef.current) {
      onTypingStart?.();
      isTypingRef.current = true;
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        onTypingStop?.();
        isTypingRef.current = false;
      }
      typingTimeoutRef.current = null;
    }, 3000);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTypingRef.current) {
        onTypingStop?.();
      }
    };
  }, [onTypingStop]);

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 15 }}
      className="absolute bottom-0 left-0 right-0 glass border-t border-white/5 px-3 py-3 z-10 bg-[#0D0F14]/95 backdrop-blur-sm"
    >
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg hover:bg-white/10 transition" title="Emoji (soon)">
          <Smile size={18} />
        </button>
        <input
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-[rgba(143,148,251,0.45)]"
          placeholder="Write a message..."
          value={value}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button
          className="px-3 py-2 rounded-lg transition inline-flex items-center gap-1 gradient-accent soft-glow hover:opacity-95"
          onClick={handleSend}
          disabled={!value.trim()}
        >
          <Send size={16} /> Send
        </button>
      </div>
    </motion.div>
  );
}
