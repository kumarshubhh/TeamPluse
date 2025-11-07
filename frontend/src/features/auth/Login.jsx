import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, LogIn, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login({ onLogin }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    
    // Identifier validation (email or username, min 3 chars)
    if (!identifier.trim()) {
      newErrors.identifier = 'Email or username is required';
    } else if (identifier.trim().length < 3) {
      newErrors.identifier = 'Identifier must be at least 3 characters';
    } else if (identifier.length > 254) {
      newErrors.identifier = 'Identifier is too long (max 254 characters)';
    }
    
    // Password validation (min 8 chars)
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
      await onLogin?.({ identifier, password });
      navigate('/');
    } catch (err) {
      setErrors({ submit: err.message || 'Login failed. Please check your credentials.' });
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
        <h2 className="text-xl font-semibold mb-2">Welcome back</h2>
        <p className="text-sm text-neutral-400 mb-6">Sign in to your account</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.submit && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle size={16} />
              <span>{errors.submit}</span>
            </div>
          )}
          
          <div>
            <label className="block text-sm mb-1.5">Email or Username</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                if (errors.identifier) setErrors({ ...errors, identifier: '' });
              }}
              onBlur={() => validate()}
              className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[rgba(143,148,251,0.45)] ${
                errors.identifier ? 'border-red-500/50' : 'border-white/10'
              }`}
              placeholder="alice@example.com or alice"
            />
            {errors.identifier && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.identifier}
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
          </div>
          
          <button type="submit" disabled={loading} className="w-full gradient-accent soft-glow text-white py-2.5 rounded-xl font-medium hover:opacity-95 transition disabled:opacity-50 inline-flex items-center justify-center gap-2">
            <LogIn size={16} /> {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-sm text-neutral-400 mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-[#8f94fb] hover:underline">Sign up</Link>
        </p>
      </motion.div>
    </div>
  );
}
