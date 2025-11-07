import { useEffect, useState } from 'react';
import { User, Mail, Calendar, Hash, UserCircle, Edit2, Save, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider.jsx';
import apiClient from '../api/client.js';
import endpoints from '../api/endpoints.js';
import Loader from '../components/Loader.jsx';

/**
 * ProfilePage Component
 * 
 * Ye component kya karta hai:
 * 1. Logged-in user ka info display karta hai (username, email, status)
 * 2. /api/auth/me endpoint se full user details fetch karta hai
 * 3. User stats show karta hai (created date, status)
 * 4. Profile information card me display karta hai
 * 5. User apna profile edit kar sakta hai (name, email)
 */
export default function ProfilePage() {
  const { user: authUser, updateUser } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '' });
  const [editErrors, setEditErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch full user details from /api/auth/me
      const response = await apiClient.get(endpoints.auth.me);
      if (response.data.success) {
        // Backend se full user data mil jayega
        setUser(response.data.data.user);
        // Set initial edit form values
        setEditForm({
          name: response.data.data.user.name || '',
          email: response.data.data.user.email || '',
        });
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load profile');
      // Fallback: use auth context user if API fails
      if (authUser) {
        setUser(authUser);
        setEditForm({
          name: authUser.name || '',
          email: authUser.email || '',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authUser) {
      fetchUserDetails();
    } else {
      setLoading(false);
    }
  }, [authUser]);

  const validateEditForm = () => {
    const errors = {};
    if (editForm.name && editForm.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    if (editForm.name && editForm.name.length > 60) {
      errors.name = 'Name is too long (max 60 characters)';
    }
    if (editForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      errors.email = 'Please enter a valid email address';
    }
    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditErrors({});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditErrors({});
    // Reset form to original values
    if (user) {
      setEditForm({
        name: user.name || '',
        email: user.email || '',
      });
    }
  };

  const handleSave = async () => {
    if (!validateEditForm()) return;

    // Check if anything changed
    const nameChanged = editForm.name !== (user?.name || '');
    const emailChanged = editForm.email !== (user?.email || '');
    
    if (!nameChanged && !emailChanged) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updateData = {};
      if (nameChanged) updateData.name = editForm.name.trim();
      if (emailChanged) updateData.email = editForm.email.trim();

      const response = await apiClient.patch(endpoints.users.profile, updateData);
      if (response.data.success) {
        // Update local state
        setUser(response.data.data.user);
        // Update auth context
        if (updateUser) {
          updateUser(response.data.data.user);
        }
        setIsEditing(false);
        setEditErrors({});
        // Refresh user details to get latest data
        await fetchUserDetails();
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to update profile';
      setError(errorMessage);
      // Set field-specific errors if available
      if (err.response?.data?.error?.details) {
        const fieldErrors = {};
        err.response.data.error.details.forEach((detail) => {
          if (detail.path && detail.path.length > 0) {
            fieldErrors[detail.path[0]] = detail.message;
          }
        });
        setEditErrors(fieldErrors);
      } else if (err.response?.data?.error?.code === 'EMAIL_EXISTS') {
        setEditErrors({ email: 'Email already in use' });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  const displayUser = user || authUser;

  if (!displayUser) {
    return (
      <div className="h-full p-4 flex items-center justify-center">
        <div className="text-center text-neutral-400">
          <p>No user information available</p>
        </div>
      </div>
    );
  }

  const statusColor = displayUser.status === 'online' ? 'bg-green-500' : 'bg-neutral-500';

  return (
    <div className="h-full p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <User size={20} />
          <h2 className="text-xl font-semibold">Profile</h2>
        </div>
        {!isEditing && displayUser && (
          <button
            onClick={handleEdit}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg gradient-accent soft-glow text-white text-sm font-medium hover:opacity-95 transition"
          >
            <Edit2 size={16} />
            Edit Profile
          </button>
        )}
      </div>

      {/* Profile Card */}
      <div className="glass rounded-2xl p-6 border border-white/10 max-w-2xl">
        {/* Avatar & Status */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="h-20 w-20 rounded-full gradient-accent soft-glow flex items-center justify-center text-2xl font-bold">
              {(displayUser.name?.charAt(0) || displayUser.username?.charAt(0) || 'U').toUpperCase()}
            </div>
            <div className={`absolute bottom-0 right-0 h-5 w-5 rounded-full border-2 border-[#0D0F14] ${statusColor}`}></div>
          </div>
          <div>
            <h3 className="text-2xl font-semibold mb-1">{displayUser.name || displayUser.username || 'User'}</h3>
            {displayUser.name && displayUser.username && (
              <p className="text-sm text-neutral-400 mb-1">@{displayUser.username}</p>
            )}
            <div className="flex items-center gap-2 text-sm">
              <span className={`inline-block h-2 w-2 rounded-full ${statusColor}`}></span>
              <span className="text-neutral-400 capitalize">{displayUser.status || 'offline'}</span>
            </div>
          </div>
        </div>

        {/* User Details */}
        <div className="space-y-4">
          {/* Full Name - Editable */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
            <UserCircle size={18} className="text-neutral-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-neutral-400 mb-0.5">Full Name</div>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => {
                      setEditForm({ ...editForm, name: e.target.value });
                      if (editErrors.name) setEditErrors({ ...editErrors, name: '' });
                    }}
                    onBlur={validateEditForm}
                    className={`w-full bg-white/5 border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[rgba(143,148,251,0.45)] ${
                      editErrors.name ? 'border-red-500/50' : 'border-white/10'
                    }`}
                    placeholder="Enter your name"
                  />
                  {editErrors.name && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {editErrors.name}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-sm font-medium">{displayUser.name || 'Not set'}</div>
              )}
            </div>
          </div>

          {/* Username - Not Editable */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
            <Hash size={18} className="text-neutral-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-neutral-400 mb-0.5">Username</div>
              <div className="text-sm font-medium">@{displayUser.username || 'N/A'}</div>
              <p className="text-xs text-neutral-500 mt-1">Username cannot be changed</p>
            </div>
          </div>

          {/* Email - Editable */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
            <Mail size={18} className="text-neutral-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-neutral-400 mb-0.5">Email</div>
              {isEditing ? (
                <div>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => {
                      setEditForm({ ...editForm, email: e.target.value });
                      if (editErrors.email) setEditErrors({ ...editErrors, email: '' });
                    }}
                    onBlur={validateEditForm}
                    className={`w-full bg-white/5 border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[rgba(143,148,251,0.45)] ${
                      editErrors.email ? 'border-red-500/50' : 'border-white/10'
                    }`}
                    placeholder="Enter your email"
                  />
                  {editErrors.email && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {editErrors.email}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-sm font-medium">{displayUser.email || 'N/A'}</div>
              )}
            </div>
          </div>

          {displayUser.createdAt && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
              <Calendar size={18} className="text-neutral-400 mt-0.5" />
              <div>
                <div className="text-xs text-neutral-400 mb-0.5">Member Since</div>
                <div className="text-sm font-medium">
                  {new Date(displayUser.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </div>
          )}

          {displayUser._id && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
              <User size={18} className="text-neutral-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-neutral-400 mb-0.5">User ID</div>
                <div className="text-xs font-mono text-neutral-500 break-all">{displayUser._id}</div>
              </div>
            </div>
          )}
        </div>

        {/* Edit Action Buttons */}
        {isEditing && (
          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/10">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg gradient-accent soft-glow text-white font-medium hover:opacity-95 transition disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-4 py-2 rounded-lg border border-white/10 text-neutral-300 font-medium hover:bg-white/5 transition disabled:opacity-50 inline-flex items-center gap-2"
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
