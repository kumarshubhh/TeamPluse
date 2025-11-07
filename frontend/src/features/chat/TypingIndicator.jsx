import { motion, AnimatePresence } from 'framer-motion';

export default function TypingIndicator({ users = [] }) {
  if (users.length === 0) return null;

  const displayNames = users.slice(0, 3).join(', '); // Show up to 3 names
  const remainingCount = users.length > 3 ? users.length - 3 : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
        className="absolute bottom-[120px] left-0 right-0 px-4 py-2 text-sm text-neutral-400 flex items-center gap-2 z-10"
      >
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-neutral-500"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
            />
          ))}
        </div>
        <span>
          {displayNames}
          {remainingCount > 0 && ` and ${remainingCount} other${remainingCount > 1 ? 's' : ''}`} typing...
        </span>
      </motion.div>
    </AnimatePresence>
  );
}
