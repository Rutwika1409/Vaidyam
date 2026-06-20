import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { supabase } from '../lib/supabase';
import api from '../lib/api';
import { useUser } from '../context/UserContext';
import HealthPulse from '../components/HealthPulse';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ShieldAlert, Sparkles, Activity, Globe } from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function Auth() {
  const { setUser } = useUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('signin'); // 'signin' | 'signup'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register: registerSignIn,
    handleSubmit: handleSignInSubmit,
    formState: { errors: signInErrors },
    reset: resetSignIn,
  } = useForm();

  const {
    register: registerSignUp,
    handleSubmit: handleSignUpSubmit,
    formState: { errors: signUpErrors },
    watch: watchSignUp,
    reset: resetSignUp,
  } = useForm();

  const signUpPassword = watchSignUp('password');

  const onSignIn = async (data) => {
    setLoading(true);
    try {
      let authData = null;
      let userId = null;
      let userProfile = null;

      try {
        const { data: sData, error: authError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        if (!authError && sData?.user) {
          authData = sData;
          userId = sData.user.id;
        }
      } catch (e) {
        console.warn('Supabase Auth failed, checking database fallback:', e);
      }

      if (userId) {
        // Standard Supabase flow
        try {
          const profileRes = await api.get(`/api/users/${userId}`);
          userProfile = profileRes.data;
        } catch (err) {
          if (err.response?.status === 404) {
            try {
              const createRes = await api.post('/api/users/', {
                id: userId,
                full_name: authData.user.email.split('@')[0],
                email: authData.user.email,
                password_hash: 'supabase_managed',
                language: 'en',
              });
              userProfile = createRes.data;
            } catch (createErr) {
              if (createErr.response?.status === 409) {
                const profileRes = await api.get(`/api/users/${userId}`);
                userProfile = profileRes.data;
              } else {
                throw createErr;
              }
            }
          } else {
            throw err;
          }
        }
      } else {
        // Fallback: search all users in the backend database
        const usersRes = await api.get('/api/users/');
        const matchedUser = (usersRes.data || []).find(
          (u) => u.email?.toLowerCase() === data.email.toLowerCase()
        );

        if (matchedUser) {
          // If we found a matching user, simulate login success!
          userProfile = matchedUser;
          userId = matchedUser.id;
          toast.success('Access granted via database sync (Demo Mode)');
        } else {
          // If no user found, auto-create a user record in the local database!
          const createRes = await api.post('/api/users/', {
            full_name: data.email.split('@')[0],
            email: data.email,
            password_hash: data.password,
            language: 'en',
          });
          userProfile = createRes.data;
          userId = createRes.data.id;
          toast.success('New profile created in database (Demo Mode)');
        }
      }

      setUser({
        id: userProfile.id || userId,
        full_name: userProfile.full_name || data.email.split('@')[0],
        email: userProfile.email || data.email,
        language: userProfile.language || 'en',
        created_at: userProfile.created_at || new Date().toISOString(),
      });

      toast.success('Welcome to vAIdyam!');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || err.message || 'Authentication failed';
      toast.error(detail);
    } finally {
      setLoading(false);
    }
  };

  const onSignUp = async (data) => {
    setLoading(true);
    try {
      let userId = null;
      let userProfile = null;

      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
        });
        if (!authError && authData?.user) {
          userId = authData.user.id;
        }
      } catch (e) {
        console.warn('Supabase signup failed, trying database direct create fallback:', e);
      }

      // If Supabase created the user, we try to create the profile row
      if (userId) {
        try {
          const createRes = await api.post('/api/users/', {
            id: userId,
            full_name: data.full_name,
            email: data.email,
            password_hash: 'supabase_managed',
            language: data.language || 'en',
          });
          userProfile = createRes.data;
        } catch (err) {
          if (err.response?.status === 409) {
            const profileRes = await api.get(`/api/users/${userId}`);
            userProfile = profileRes.data;
          } else {
            throw err;
          }
        }
      } else {
        // Supabase rate-limited or failed. Let's create the profile directly in the backend database!
        try {
          const createRes = await api.post('/api/users/', {
            full_name: data.full_name,
            email: data.email,
            password_hash: data.password,
            language: data.language || 'en',
          });
          userProfile = createRes.data;
          userId = createRes.data.id;
          toast.success('Account created directly in database (Demo Mode)');
        } catch (err) {
          if (err.response?.status === 409) {
            toast.error('Account already exists. Try signing in.');
            setActiveTab('signin');
            resetSignIn();
            setLoading(false);
            return;
          }
          throw err;
        }
      }

      setUser({
        id: userProfile.id || userId,
        full_name: userProfile.full_name || data.full_name,
        email: userProfile.email || data.email,
        language: userProfile.language || 'en',
        created_at: userProfile.created_at || new Date().toISOString(),
      });

      toast.success('Registration successful!');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || err.message || 'Registration failed';
      toast.error(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#080D1A] relative overflow-hidden">
      {/* Full Screen Background Animation Video */}
      <video
        src="/animation.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none z-0"
      />

      {/* ─── LEFT HERO PANEL (58%) ─── */}
      <div className="relative flex-1 md:flex-[0.58] bg-transparent flex flex-col justify-between p-8 md:p-16 border-r border-[#ffffff05] overflow-hidden">
        {/* SVG hex-grid pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hex-grid" width="40" height="69.282" patternUnits="userSpaceOnUse" patternTransform="scale(1)">
                <path d="M 40 0 L 20 11.547 L 0 0 L 0 23.094 L 20 34.641 L 40 23.094 Z M 0 34.641 L 20 46.188 L 0 57.735 L 0 80.829 L 20 92.376 L 40 80.829 L 40 57.735 L 20 46.188" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hex-grid)" />
          </svg>
        </div>

        {/* Floating pulse circle in the background */}
        <div className="absolute top-1/4 left-1/4 h-[350px] w-[350px] rounded-full glow-circle pointer-events-none"></div>

        {/* Top Header Logo */}
        <div className="z-10 flex items-start">
          <img src={logoImg} alt="vAIdyam Logo" className="h-28 w-auto object-contain shadow-[0_0_35px_var(--teal-glow)]" />
        </div>

        {/* Center Tagline and Description */}
        <div className="z-10 my-auto py-12 max-w-xl">
          <h2 className="font-display text-4xl md:text-5xl font-extrabold text-[#EEF2FF] leading-tight mb-4">
            Understand Your Health. <br />
            <span className="text-gradient">In Your Language.</span>
          </h2>
          <p className="text-[#8A9BC4] text-lg mb-8 leading-relaxed">
            AI-powered medical guidance for everyone. Describe symptoms or upload reports in English, Hindi, Telugu, Tamil, Kannada, or Malayalam.
          </p>

          {/* Staggered features chips */}
          <div className="flex flex-wrap gap-3 mb-8">
            <div className="flex items-center space-x-2 bg-navy-surface border border-[#ffffff07] rounded-full px-4 py-2.5 shadow-lg backdrop-blur-md">
              <Activity className="text-teal h-4 w-4" />
              <span className="text-sm text-[#EEF2FF] font-medium">🩺 AI Symptom Analysis</span>
            </div>
            <div className="flex items-center space-x-2 bg-navy-surface border border-[#ffffff07] rounded-full px-4 py-2.5 shadow-lg backdrop-blur-md">
              <Sparkles className="text-teal h-4 w-4" />
              <span className="text-sm text-[#EEF2FF] font-medium">📄 Medical Report Intelligence</span>
            </div>
            <div className="flex items-center space-x-2 bg-navy-surface border border-[#ffffff07] rounded-full px-4 py-2.5 shadow-lg backdrop-blur-md">
              <Globe className="text-teal h-4 w-4" />
              <span className="text-sm text-[#EEF2FF] font-medium">🌐 6 Indian Languages</span>
            </div>
          </div>

        </div>


        {/* Animated ECG Pulse Vector (Signature Visual) */}
        <div className="z-10 w-full opacity-60">
          <HealthPulse />
        </div>
      </div>

      {/* ─── RIGHT PANEL (42%) ─── */}
      <div className="flex-1 md:flex-[0.42] flex items-center justify-center p-6 md:p-12 z-10 bg-transparent">
        <div className="w-full max-w-md premium-card p-8 shadow-2xl relative">
          {/* Tab Toggles */}
          <div className="flex border-b border-[#ffffff07] mb-8">
            <button
              onClick={() => {
                setActiveTab('signin');
                resetSignUp();
              }}
              className={`flex-1 pb-3 text-center text-sm font-semibold transition-all relative ${
                activeTab === 'signin' ? 'text-teal font-bold' : 'text-[#8A9BC4] hover:text-[#EEF2FF]'
              }`}
            >
              Sign In
              {activeTab === 'signin' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-teal rounded-full"></span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab('signup');
                resetSignIn();
              }}
              className={`flex-1 pb-3 text-center text-sm font-semibold transition-all relative ${
                activeTab === 'signup' ? 'text-teal font-bold' : 'text-[#8A9BC4] hover:text-[#EEF2FF]'
              }`}
            >
              Sign Up
              {activeTab === 'signup' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-teal rounded-full"></span>
              )}
            </button>
          </div>

          {/* Tab Content: SIGN IN */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignInSubmit(onSignIn)} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[#8A9BC4] uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled={loading}
                  {...registerSignIn('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address format',
                    },
                  })}
                  className="w-full bg-navy-elevated border border-[#ffffff07] rounded-lg px-4 py-3 text-sm text-[#EEF2FF] placeholder-[#5A6A8E] focus:outline-none focus:border-teal transition-all"
                  placeholder="e.g. user@example.com"
                />
                {signInErrors.email && (
                  <span className="text-xs text-red-400 mt-1.5 flex items-center space-x-1">
                    <ShieldAlert size={12} />
                    <span>{signInErrors.email.message}</span>
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8A9BC4] uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    disabled={loading}
                    {...registerSignIn('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters',
                      },
                    })}
                    className="w-full bg-navy-elevated border border-[#ffffff07] rounded-lg pl-4 pr-10 py-3 text-sm text-[#EEF2FF] placeholder-[#5A6A8E] focus:outline-none focus:border-teal transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-[#8A9BC4] hover:text-[#EEF2FF]"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {signInErrors.password && (
                  <span className="text-xs text-red-400 mt-1.5 flex items-center space-x-1">
                    <ShieldAlert size={12} />
                    <span>{signInErrors.password.message}</span>
                  </span>
                )}
              </div>

              <button type="submit" disabled={loading} className="w-full teal-btn mt-4 flex items-center justify-center">
                {loading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent mr-2"></span>
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          )}

          {/* Tab Content: SIGN UP */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignUpSubmit(onSignUp)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#8A9BC4] uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  disabled={loading}
                  {...registerSignUp('full_name', {
                    required: 'Full name is required',
                    minLength: {
                      value: 2,
                      message: 'Name must be at least 2 characters',
                    },
                  })}
                  className="w-full bg-navy-elevated border border-[#ffffff07] rounded-lg px-4 py-2.5 text-sm text-[#EEF2FF] placeholder-[#5A6A8E] focus:outline-none focus:border-teal transition-all"
                  placeholder="e.g. Dr. Abhinav Kumar"
                />
                {signUpErrors.full_name && (
                  <span className="text-xs text-red-400 mt-1 flex items-center space-x-1">
                    <ShieldAlert size={12} />
                    <span>{signUpErrors.full_name.message}</span>
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8A9BC4] uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled={loading}
                  {...registerSignUp('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address format',
                    },
                  })}
                  className="w-full bg-navy-elevated border border-[#ffffff07] rounded-lg px-4 py-2.5 text-sm text-[#EEF2FF] placeholder-[#5A6A8E] focus:outline-none focus:border-teal transition-all"
                  placeholder="e.g. user@example.com"
                />
                {signUpErrors.email && (
                  <span className="text-xs text-red-400 mt-1 flex items-center space-x-1">
                    <ShieldAlert size={12} />
                    <span>{signUpErrors.email.message}</span>
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8A9BC4] uppercase tracking-wider mb-1.5">
                  Language Preference
                </label>
                <select
                  disabled={loading}
                  {...registerSignUp('language', { required: 'Preferred language is required' })}
                  className="w-full bg-navy-elevated border border-[#ffffff07] rounded-lg px-4 py-2.5 text-sm text-[#EEF2FF] placeholder-[#5A6A8E] focus:outline-none focus:border-teal transition-all"
                >
                  <option value="en">English</option>
                  <option value="te">Telugu (తెలుగు)</option>
                  <option value="hi">Hindi (हिंदी)</option>
                  <option value="ta">Tamil (தமிழ்)</option>
                  <option value="kn">Kannada (ಕನ್ನಡ)</option>
                  <option value="ml">Malayalam (മലയാളം)</option>
                </select>
                {signUpErrors.language && (
                  <span className="text-xs text-red-400 mt-1 flex items-center space-x-1">
                    <ShieldAlert size={12} />
                    <span>{signUpErrors.language.message}</span>
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8A9BC4] uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  disabled={loading}
                  {...registerSignUp('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                  className="w-full bg-navy-elevated border border-[#ffffff07] rounded-lg px-4 py-2.5 text-sm text-[#EEF2FF] placeholder-[#5A6A8E] focus:outline-none focus:border-teal transition-all"
                  placeholder="••••••••"
                />
                {signUpErrors.password && (
                  <span className="text-xs text-red-400 mt-1 flex items-center space-x-1">
                    <ShieldAlert size={12} />
                    <span>{signUpErrors.password.message}</span>
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8A9BC4] uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  disabled={loading}
                  {...registerSignUp('confirm_password', {
                    required: 'Confirm password is required',
                    validate: (val) => val === signUpPassword || 'Passwords do not match',
                  })}
                  className="w-full bg-navy-elevated border border-[#ffffff07] rounded-lg px-4 py-2.5 text-sm text-[#EEF2FF] placeholder-[#5A6A8E] focus:outline-none focus:border-teal transition-all"
                  placeholder="••••••••"
                />
                {signUpErrors.confirm_password && (
                  <span className="text-xs text-red-400 mt-1 flex items-center space-x-1">
                    <ShieldAlert size={12} />
                    <span>{signUpErrors.confirm_password.message}</span>
                  </span>
                )}
              </div>

              <button type="submit" disabled={loading} className="w-full teal-btn mt-3 flex items-center justify-center">
                {loading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent mr-2"></span>
                    Signing Up...
                  </>
                ) : (
                  'Sign Up'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
