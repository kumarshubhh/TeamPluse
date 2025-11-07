import { useMemo, useState } from 'react';
import { UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import apiClient from '../api/client.js';
import endpoints from '../api/endpoints.js';

export default function InviteUser({ roomId }) {
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [username, setUsername] = useState('');

  const usernameError = useMemo(() => {
    if (!username.trim()) return '';
    if (username.trim().length < 3) return 'Username must be at least 3 characters';
    if (username.trim().length > 30) return 'Username is too long (max 30 characters)';
    if (!/^[a-z0-9_]+$/i.test(username.trim())) return 'Username can only contain letters, numbers, and underscores';
    return '';
  }, [username]);

  const userIdError = useMemo(() => {
    if (!userId.trim()) return '';
    if (!/^[a-fA-F0-9]{24}$/.test(userId.trim())) return 'User ID must be a 24-character hex string';
    return '';
  }, [userId]);

  const onInvite = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (usernameError || userIdError) {
      setError(usernameError || userIdError);
      return;
    }

    try {
      setLoading(true);
      let targetUserId = userId.trim();
      if (!targetUserId && username.trim()) {
        // lookup by username
        const res = await apiClient.get(`${endpoints.users.status.replace('/status','')}?username=${encodeURIComponent(username.trim())}`);
        if (!res.data?.success) throw new Error('User not found');
        targetUserId = res.data.data.user._id;
      }
      if (!targetUserId) {
        setError('Provide a valid username or user ID');
        return;
      }
      await apiClient.post(endpoints.rooms.invite(roomId), { userId: targetUserId });
      setSuccess('Invitation sent.');
      setUserId('');
      setUsername('');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to invite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute left-0 right-0 bottom-16 p-3 glass border-t border-white/5 z-10">
      <form onSubmit={onInvite} className="flex items-center gap-2">
        <input
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[rgba(143,148,251,0.45)]"
          placeholder="Invite by username (preferred)"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value.toLowerCase());
            if (error) setError('');
          }}
          onBlur={() => {
            if (usernameError) setError(usernameError);
          }}
          disabled={loading}
        />
        <span className="text-xs text-neutral-400">or</span>
        <input
          className="w-64 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[rgba(143,148,251,0.45)]"
          placeholder="User ID (ObjectId)"
          value={userId}
          onChange={(e) => {
            setUserId(e.target.value.trim());
            if (error) setError('');
          }}
          onBlur={() => {
            if (userIdError) setError(userIdError);
          }}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || (!!usernameError && !!username.trim()) || (!!userIdError && !!userId.trim())}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg gradient-accent soft-glow text-white text-sm hover:opacity-95 disabled:opacity-50"
        >
          <UserPlus size={16} /> Invite
        </button>
      </form>
      {error && (
        <div className="text-xs text-red-400 mt-2 flex items-center gap-1">
          <AlertCircle size={12} />
          {error}
        </div>
      )}
      {success && (
        <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
          <CheckCircle2 size={12} />
          {success}
        </div>
      )}
    </div>
  );
}


