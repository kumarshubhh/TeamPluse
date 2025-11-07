import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, UserPlus, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Signup({ onSignup }) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    
    // Name validation (2-60 chars)
    if (!name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (name.length > 60) {
      newErrors.name = 'Name is too long (max 60 characters)';
    }
    
    // Username validation (3-30 chars, alphanumeric)
    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (username.length > 30) {
      newErrors.username = 'Username is too long (max 30 characters)';
    } else if (!/^[a-zA-Z0-9]+$/.test(username)) {
      newErrors.username = 'Username can only contain letters and numbers';
    }
    
    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Password validation (8-128 chars)
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (password.length > 128) {
      newErrors.password = 'Password is too long (max 128 characters)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    try {
      await onSignup?.({ name, username, email, password });
      navigate('/');
    } catch (err) {
      setErrors({ submit: err.message || 'Signup failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0D0F14 0%, #1a1d29 100%)' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-8 w-full max-w-md border border-white/10">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="h-10 w-10 rounded-xl gradient-accent soft-glow flex items-center justify-center">
            <Sparkles size={20} className="text-white" />
          </div>
          <h1 className="text-2xl font-semibold">TeamPulse</h1>
        </div>
        <h2 className="text-xl font-semibold mb-2">Create account</h2>
        <p className="text-sm text-neutral-400 mb-6">Get started with TeamPulse</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.submit && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle size={16} />
              <span>{errors.submit}</span>
            </div>
          )}
          
          <div>
            <label className="block text-sm mb-1.5">Full name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              onBlur={() => validate()}
              className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[rgba(143,148,251,0.45)] ${
                errors.name ? 'border-red-500/50' : 'border-white/10'
              }`}
              placeholder="Full Name"
            />
            {errors.name && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.name}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
                if (errors.username) setErrors({ ...errors, username: '' });
              }}
              onBlur={() => validate()}
              className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[rgba(143,148,251,0.45)] ${
                errors.username ? 'border-red-500/50' : 'border-white/10'
              }`}
              placeholder="alice"
            />
            {errors.username && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.username}
              </p>
            )}
            <p className="text-neutral-500 text-xs mt-1">Only letters and numbers allowed</p>
          </div>
          
          <div>
            <label className="block text-sm mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
              onBlur={() => validate()}
              className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[rgba(143,148,251,0.45)] ${
                errors.email ? 'border-red-500/50' : 'border-white/10'
              }`}
              placeholder="alice@example.com"
            />
            {errors.email && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.email}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: '' });
              }}
              onBlur={() => validate()}
              className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[rgba(143,148,251,0.45)] ${
                errors.password ? 'border-red-500/50' : 'border-white/10'
              }`}
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.password}
              </p>
            )}
            <p className="text-neutral-500 text-xs mt-1">Must be at least 8 characters</p>
          </div>
          
          <button type="submit" disabled={loading} className="w-full gradient-accent soft-glow text-white py-2.5 rounded-xl font-medium hover:opacity-95 transition disabled:opacity-50 inline-flex items-center justify-center gap-2">
            <UserPlus size={16} /> {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        <p className="text-center text-sm text-neutral-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[#8f94fb] hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
