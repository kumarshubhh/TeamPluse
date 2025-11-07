import { Link } from 'react-router-dom';
import { useRooms } from '../hooks/useRooms.js';
import Loader from '../components/Loader.jsx';

/**
 * RoomsPage Component
 * 
 * Ye component kya karta hai:
 * 1. useRooms hook se rooms data fetch karta hai (API se)
 * 2. Rooms ko grid layout me display karta hai
 * 3. Har room pe click → /rooms/:roomId pe navigate karta hai
 * 4. Loading state show karta hai
 */
export default function RoomsPage() {
  const { rooms, loading, error } = useRooms();

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-2">{error}</p>
          <button onClick={() => window.location.reload()} className="text-sm text-[#8f94fb] hover:underline">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-4 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-3">Your Rooms</h2>
      {rooms.length === 0 ? (
        <div className="text-center py-12 text-neutral-400">
          <p>No rooms yet. Create one from the sidebar!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rooms.map((r) => (
            <Link
              key={r._id || r.id}
              to={`/rooms/${r._id || r.id}`}
              className="glass rounded-xl p-4 hover:bg-white/10 transition block"
            >
              <div className="text-base font-semibold mb-1">{r.name}</div>
              <div className="text-sm text-neutral-400">
                {r.members?.length || 0} {r.members?.length === 1 ? 'member' : 'members'}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}


