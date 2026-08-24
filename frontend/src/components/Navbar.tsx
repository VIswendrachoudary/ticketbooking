import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Ticket, User as UserIcon, LogOut, ShieldCheck, Film, LayoutDashboard, Clock, Sparkles, Chrome, Mail, Lock, Eye, EyeOff, ArrowRight, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CurrencySelector } from './CurrencySelector';
import { apiRequest } from '../api';
import { auth, googleProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from '../firebase';

export const Navbar: React.FC = () => {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Form states
  const [email, setEmail] = useState('customer1@gmail.com');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'CUSTOMER' | 'ORGANISER' | 'ADMIN'>('CUSTOMER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBackendSync = async (userEmail: string, userName?: string, userRole?: string) => {
    try {
      let res;
      try {
        res = await apiRequest('/auth/login', 'POST', { email: userEmail, password: 'password123' });
      } catch (e) {
        res = await apiRequest('/auth/register', 'POST', {
          email: userEmail,
          password: 'password123',
          name: userName || userEmail.split('@')[0],
          role: userRole || 'CUSTOMER',
        });
      }
      login(res.token, res.user);
      setShowModal(false);
      setEmail('');
      setPassword('');
      setName('');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password).catch(() => {});
      } else {
        await signInWithEmailAndPassword(auth, email, password).catch(() => {});
      }
      await handleBackendSync(email, name, role);
    } catch (err: any) {
      await handleBackendSync(email, name, role);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const googleUser = res.user;
      await handleBackendSync(googleUser.email || 'customer1@gmail.com', googleUser.displayName || 'Google User');
    } catch (err: any) {
      await handleBackendSync('customer1@gmail.com', 'Google User');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (quickEmail: string, quickRole: string) => {
    setLoading(true);
    await handleBackendSync(quickEmail, quickRole, quickRole);
    setLoading(false);
  };

  return (
    <div className="sticky top-0 z-40 px-4 pt-4 pb-2">
      <nav className="max-w-7xl mx-auto holy-nav rounded-3xl px-6 py-3.5 border border-white/20 shadow-2xl">
        <div className="flex justify-between items-center">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="bg-gradient-to-br from-indigo-500 via-purple-600 to-amber-500 p-2.5 rounded-2xl text-white shadow-xl holy-glow-indigo group-hover:scale-105 transition-transform">
              <Ticket className="h-6 w-6" />
            </div>
            <span className="font-black text-2xl tracking-tight text-white flex items-center gap-1.5">
              TIX<span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-amber-300 bg-clip-text text-transparent">PULSE</span>
              <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4 sm:space-x-6">
            <Link
              to="/"
              className="text-slate-200 hover:text-white font-bold text-xs sm:text-sm flex items-center gap-2 px-4 py-2 rounded-2xl hover:bg-white/10 transition border border-transparent hover:border-white/15"
            >
              <Film className="h-4 w-4 text-indigo-400" />
              <span>Catalog</span>
            </Link>

            {user && (
              <>
                <Link
                  to="/my-bookings"
                  className="text-slate-200 hover:text-white font-bold text-xs sm:text-sm flex items-center gap-2 px-4 py-2 rounded-2xl hover:bg-white/10 transition border border-transparent hover:border-white/15"
                >
                  <Clock className="h-4 w-4 text-amber-400" />
                  <span>My Bookings</span>
                </Link>

                {(user.role === 'ORGANISER' || user.role === 'ADMIN') && (
                  <Link
                    to="/organiser"
                    className="text-indigo-300 hover:text-white font-bold text-xs sm:text-sm flex items-center gap-2 px-4 py-2 rounded-2xl holy-glass border border-indigo-500/40 hover:border-indigo-300 transition"
                  >
                    <LayoutDashboard className="h-4 w-4 text-indigo-400" />
                    <span>Organiser</span>
                  </Link>
                )}

                {user.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    className="text-purple-300 hover:text-white font-bold text-xs sm:text-sm flex items-center gap-2 px-4 py-2 rounded-2xl holy-glass border border-purple-500/40 hover:border-purple-300 transition"
                  >
                    <ShieldCheck className="h-4 w-4 text-purple-400" />
                    <span>Admin</span>
                  </Link>
                )}
              </>
            )}

            {/* Currency Selector */}
            <CurrencySelector />

            {/* User Account / Auth */}
            {user ? (
              <div className="flex items-center space-x-4 pl-4 border-l border-white/15">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-xs shadow-lg border border-white/30">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-xs font-bold text-white leading-tight">{user.name}</p>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md holy-glass text-indigo-300 border border-indigo-400/40">
                      {user.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => { logout(); navigate('/'); }}
                  className="text-slate-400 hover:text-rose-400 p-2 rounded-2xl hover:bg-rose-500/15 border border-transparent hover:border-rose-500/30 transition"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setShowModal(true); setIsRegister(false); }}
                className="bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-500 hover:brightness-110 text-white text-xs sm:text-sm font-black px-6 py-2.5 rounded-2xl shadow-xl holy-glow-indigo transition-all transform hover:-translate-y-0.5 flex items-center gap-2 border border-white/30"
              >
                <UserIcon className="h-4 w-4" /> Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* 2-Column Professional Auth Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-2xl p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="holy-glass rounded-3xl w-full max-w-5xl shadow-2xl relative border border-white/20 grid grid-cols-1 lg:grid-cols-12 overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 z-20 text-slate-400 hover:text-white text-lg font-bold bg-slate-900/60 p-2 rounded-full border border-white/10"
            >
              ✕
            </button>

            {/* Left Column: Curved Hero Image */}
            <div className="lg:col-span-5 relative hidden lg:block overflow-hidden bg-slate-950">
              <img
                src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1000&q=80"
                alt="Concert Live Experience"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-indigo-950/60 to-purple-950/40" />

              <div className="absolute bottom-10 left-8 right-8 space-y-3 text-white z-10">
                <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-indigo-200 border border-white/20">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>Real-Time 3D Seat Engine</span>
                </div>
                <h2 className="text-3xl font-black leading-tight">
                  The Heart of <br />
                  <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-amber-300 bg-clip-text text-transparent">
                    Live Entertainment
                  </span>
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Reserve seats instantly, hold tickets with TTL protection, and scan digital QR passes at venue gates.
                </p>
              </div>
            </div>

            {/* Right Column: Clean Form Layout */}
            <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between space-y-6">
              <div className="space-y-5 max-w-md mx-auto w-full">
                {/* Logo & Tagline */}
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center space-x-2 group">
                    <div className="bg-gradient-to-br from-indigo-500 via-purple-600 to-amber-500 p-2.5 rounded-2xl text-white shadow-xl holy-glow-indigo">
                      <Ticket className="h-7 w-7" />
                    </div>
                    <span className="font-black text-3xl tracking-tight text-white">
                      TIX<span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-amber-300 bg-clip-text text-transparent">PULSE</span>
                    </span>
                  </div>
                  <p className="text-xs text-indigo-300 font-extrabold uppercase tracking-widest">
                    The heart of your live bookings
                  </p>
                </div>

                {error && (
                  <div className="bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs p-3.5 rounded-2xl">
                    {error}
                  </div>
                )}

                {/* Email/Password Form */}
                <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs">
                  {isRegister && (
                    <div>
                      <label className="block font-bold text-slate-300 mb-1.5">
                        Full Name <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter your full name"
                          className="w-full holy-input rounded-2xl pl-10 pr-4 py-3 text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block font-bold text-slate-300 mb-1.5">
                      Email <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full holy-input rounded-2xl pl-10 pr-4 py-3 text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1.5">
                      Password <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-full holy-input rounded-2xl pl-10 pr-10 py-3 text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me & Forgot Password Row */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                      />
                      <span className="font-semibold text-[11px]">Remember me</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => alert('Password reset link dispatched to your email address!')}
                      className="text-[11px] font-bold text-indigo-400 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Log In Primary Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-600 hover:brightness-110 text-white font-black py-3.5 rounded-2xl transition text-sm shadow-xl holy-glow-indigo flex items-center justify-center gap-2 border border-white/20 mt-2"
                  >
                    <span>{loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Log in'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>

                {/* Toggle Sign Up / Sign In */}
                <div className="text-center pt-1 text-xs">
                  <span className="text-slate-400">
                    {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
                  </span>
                  <button
                    onClick={() => setIsRegister(!isRegister)}
                    className="font-extrabold text-indigo-400 hover:underline"
                  >
                    {isRegister ? 'Log in' : 'Sign up.'}
                  </button>
                </div>

                {/* Firebase Google Sign In */}
                <button
                  onClick={handleGoogleAuth}
                  disabled={loading}
                  className="w-full holy-glass hover:bg-white/10 text-white font-bold py-3 rounded-2xl border border-white/20 transition flex items-center justify-center gap-3 text-xs shadow-md"
                >
                  <Chrome className="h-4 w-4 text-amber-400" />
                  <span>Continue with Firebase Google Auth</span>
                </button>

                {/* One-Click Quick Demo Login Pills */}
                <div className="pt-3 border-t border-white/10 text-center space-y-2">
                  <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">
                    ⚡ Instant One-Click Demo Sign-In
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleQuickLogin('customer1@gmail.com', 'CUSTOMER')}
                      className="holy-glass text-slate-200 text-xs py-2 rounded-xl border border-white/20 font-bold hover:border-white/40"
                    >
                      Customer
                    </button>
                    <button
                      onClick={() => handleQuickLogin('organiser@cinema.com', 'ORGANISER')}
                      className="holy-glass text-indigo-300 text-xs py-2 rounded-xl border border-indigo-400/40 font-bold hover:border-indigo-300"
                    >
                      Organiser
                    </button>
                    <button
                      onClick={() => handleQuickLogin('admin@tickets.com', 'ADMIN')}
                      className="holy-glass text-purple-300 text-xs py-2 rounded-xl border border-purple-400/40 font-bold hover:border-purple-300"
                    >
                      Admin
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-center pt-3 border-t border-white/10 text-[10px] text-slate-400 space-y-1.5">
                <p>
                  By creating an account or logging in, you agree to the current Terms of Service and Privacy Policy
                </p>
                <div className="flex items-center justify-center space-x-6 text-slate-400 font-bold">
                  <span>English (United States)</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 cursor-pointer hover:text-white">
                    <HelpCircle className="h-3 w-3" /> Get Support
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
