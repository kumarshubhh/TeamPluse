export default function PresencePanel({ users = [] }) {
  return (
    <aside className="hidden lg:flex lg:flex-col w-64 h-full glass border-l border-white/5 px-3 py-4 flex-shrink-0">
      <div className="text-sm font-semibold mb-3 text-neutral-300">Online now</div>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {users.length === 0 ? (
          <div className="text-xs text-neutral-400">No one online</div>
        ) : (
          users.map((u) => (
            <div key={u.id || u._id} className="flex items-center gap-2 text-sm text-neutral-300">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
              <span className="truncate">{u.name || u.username || u.id || u._id}</span>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}


