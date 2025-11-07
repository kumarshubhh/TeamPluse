import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { Check, CheckCheck } from 'lucide-react';

function MessageTicks({ seenByCount, membersCount, isMine }) {
  if (!isMine) return null; // Ticks only for own messages

  // Exclude sender from total members count (sender doesn't read their own message)
  const otherMembersCount = Math.max(0, membersCount - 1);
  
  // If no other members, show single tick (sent)
  if (otherMembersCount === 0) {
    return <Check size={14} className="text-neutral-500" />;
  }

  // Check if all other members have read the message
  const allOthersHaveRead = seenByCount >= otherMembersCount;
  const someHaveRead = seenByCount > 0;

  if (allOthersHaveRead) {
    return <CheckCheck size={14} className="text-[#8f94fb]" />; // Blue double tick - all read
  } else if (someHaveRead) {
    return <CheckCheck size={14} className="text-neutral-500" />; // Gray double tick - some read
  } else {
    return <Check size={14} className="text-neutral-500" />; // Single gray tick - sent but not read
  }
}

export default function ChatWindow({ messages = [], onLoadMore, hasMore, onScrollBottom, loading, membersCount = 1 }) {
  const scrollRef = useRef(null);
  const isInitialLoad = useRef(true);

  // Scroll to bottom on new messages, but only if user is already near bottom
  useEffect(() => {
    if (scrollRef.current && !isInitialLoad.current) {
      const { scrollHeight, clientHeight, scrollTop } = scrollRef.current;
      // Only scroll if user is within 100px of the bottom
      if (scrollHeight - scrollTop - clientHeight < 100) {
        scrollRef.current.scrollTop = scrollHeight;
      }
    }
    isInitialLoad.current = false;
  }, [messages]);

  // Scroll to bottom on first load
  useEffect(() => {
    if (scrollRef.current && messages.length > 0 && isInitialLoad.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      isInitialLoad.current = false;
    }
  }, [messages.length]);

  const handleScroll = (e) => {
    const el = e.currentTarget;
    // Load more messages when scrolled near the top
    if (el.scrollTop <= 0 && hasMore && !loading) {
      onLoadMore?.();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 pt-4 pb-40 space-y-3" 
        onScroll={handleScroll}
      >
        {loading && hasMore && (
          <div className="flex justify-center py-2">
            <div className="text-neutral-400 text-sm">Loading...</div>
          </div>
        )}
        {messages.map((m) => (
          <motion.div
            key={m.id}
            data-message-id={m.id || m._id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className={`max-w-[78%] rounded-2xl px-4 py-2.5 break-words ${
              m.isMine ? 'ml-auto gradient-accent text-white soft-glow' : 'glass border border-white/10'
            }`}
          >
            <div className="text-[11px] opacity-80 mb-0.5 flex items-center justify-between">
              <span>{m.username} • {new Date(m.createdAt).toLocaleTimeString()}</span>
              {m.isMine && (
                <MessageTicks 
                  seenByCount={m.readBy?.length || 0} 
                  membersCount={membersCount} 
                  isMine={m.isMine} 
                />
              )}
            </div>
            <div className="leading-relaxed whitespace-pre-wrap break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
              {m.content}
            </div>
          </motion.div>
        ))}
      </div>
      {onScrollBottom && (
        <button 
          className="md:hidden fixed bottom-24 right-4 h-12 w-12 rounded-full bg-gradient-to-br from-primary-500 to-accent shadow-lg" 
          onClick={onScrollBottom} 
          aria-label="New message" 
        />
      )}
    </div>
  );
}
