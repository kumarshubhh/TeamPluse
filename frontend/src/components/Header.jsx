import { Sparkles, Bell, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Header({ roomName = 'General', onToggleRight, onLogout, unreadCount = 0 }) {
  return (
    <div className="glass sticky top-0 z-20 px-4 py-3 flex items-center justify-between border-b border-white/5">
      <div className="flex items-center gap-3">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }} className="h-9 w-9 rounded-xl gradient-accent soft-glow flex items-center justify-center">
          <Sparkles size={18} className="text-white" />
        </motion.div>
        <div>
          <div className="text-sm text-neutral-400">Room</div>
          <h1 className="text-lg font-semibold tracking-tight">{roomName}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="relative p-2 rounded-lg hover:bg-white/10 transition" onClick={onToggleRight} aria-label="Notifications">
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full gradient-accent text-[10px] text-white flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        <button className="p-2 rounded-lg hover:bg-white/10 transition" onClick={onLogout} aria-label="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
}
