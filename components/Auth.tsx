
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Logo } from './Logo';

interface AuthProps {
  recoveryMode?: boolean;
  onCompleteRecovery?: () => void;
}

export const Auth: React.FC<AuthProps> = ({ recoveryMode = false, onCompleteRecovery }) => {
  const [isLogin, setIsLogin] = useState(!recoveryMode);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (recoveryMode) {
      setIsLogin(false);
      setIsForgot(false);
      setMessage("Account verified! ✨ Please set a new secure password for your journey.");
    }
  }, [recoveryMode]);

  const getPasswordStrength = (pass: string) => {
    if (pass.length === 0) return { label: '', color: 'bg-gray-200', width: '0%' };
    if (pass.length < 6) return { label: 'Weak', color: 'bg-red-500', width: '33%' };
    if (pass.length < 10) return { label: 'Good', color: 'bg-orange-500', width: '66%' };
    return { label: 'Strong', color: 'bg-green-500', width: '100%' };
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      if (recoveryMode) {
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) throw updateError;
        setMessage("Success! Password updated. You can now sign in to your dashboard.");
        setTimeout(() => onCompleteRecovery?.(), 2000);
      } else if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      } else {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        setMessage("Welcome! Please check your Gmail. Look for an email from us to confirm your account! 💌");
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your Gmail address first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (resetError) throw resetError;
      setMessage("Success! We've sent a secure link to your Gmail. Look for 'Password Reset' from our team! 🦉");
      setIsForgot(false);
    } catch (err: any) {
      setError("I couldn't send the reset link. Is the email correct?");
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(password);

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-6 animate-fade-in overflow-y-auto no-scrollbar">
      <div className="max-w-sm w-full space-y-8 py-10">
        
        <div className="flex justify-center mb-6">
          <Logo size={100} showText dark={document.documentElement.classList.contains('dark')} />
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
            {recoveryMode ? 'Reset Access' : isForgot ? 'Help is here' : isLogin ? 'Sign in' : 'Join the Flow'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            {recoveryMode ? 'Set a fresh, strong password.' : isForgot ? 'We will send a reset link to your Gmail.' : isLogin ? 'Ready to crush your goals?' : 'Start your level-up journey.'}
          </p>
        </div>

        {isForgot ? (
          <form onSubmit={handleForgotPassword} className="space-y-4 animate-pop-out">
            <div className="space-y-3">
              <input
                type="email"
                placeholder="Your Gmail address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-gray-100 dark:border-white/5 rounded-2xl px-6 py-4 text-gray-800 dark:text-white focus:outline-none focus:ring-4 focus:ring-purple-500/10 transition-all font-bold"
                required
              />
              <p className="text-[10px] text-gray-400 font-bold px-2 uppercase tracking-widest text-center">We use secure cloud-sync via Supabase</p>
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-purple-200 dark:shadow-none active:scale-95"
            >
              {loading ? 'Sending...' : 'Email Reset Link'}
            </button>
            <button onClick={() => setIsForgot(false)} className="w-full text-xs font-black text-gray-400 uppercase tracking-widest text-center hover:text-purple-600 transition-colors">
              Back to Sign In
            </button>
          </form>
        ) : (
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-3">
              <input
                type="email"
                placeholder="Gmail address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-gray-100 dark:border-white/5 rounded-2xl px-6 py-4 text-gray-800 dark:text-white focus:outline-none focus:ring-4 focus:ring-purple-500/10 transition-all font-bold"
                required
                disabled={recoveryMode}
              />

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={recoveryMode ? "New Password" : "Password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-gray-100 dark:border-white/5 rounded-2xl px-6 py-4 text-gray-800 dark:text-white focus:outline-none focus:ring-4 focus:ring-purple-500/10 transition-all font-bold pr-12"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-purple-500 transition-colors"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>

              {!isLogin && password.length > 0 && (
                <div className="px-2 space-y-2 animate-pop-out">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <span>Security</span>
                    <span style={{ color: strength.color.replace('bg-', '') }}>{strength.label}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${strength.color} transition-all duration-500`} style={{ width: strength.width }}></div>
                  </div>
                </div>
              )}
            </div>

            <button 
              type="submit"
              disabled={loading}
              className={`w-full bg-[#1e1b4b] dark:bg-purple-600 hover:scale-[1.02] active:scale-95 text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 ${loading ? 'opacity-70' : ''}`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span>{recoveryMode ? 'Update Password' : isLogin ? 'Sign in' : 'Create Account'}</span>
              )}
            </button>

            {!recoveryMode && isLogin && (
              <div className="text-center pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsForgot(true)}
                  className="text-xs font-black text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 uppercase tracking-widest transition-all"
                >
                  Forgot your password?
                </button>
              </div>
            )}
          </form>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/20 animate-shake">
            <p className="text-red-600 dark:text-red-400 text-xs font-bold text-center">
              ⚠️ {error}
            </p>
          </div>
        )}

        {message && (
          <div className="p-5 rounded-3xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/20 animate-pop-out shadow-sm shadow-green-100">
            <p className="text-green-600 dark:text-green-400 text-xs font-bold text-center leading-relaxed">
              ✨ {message}
            </p>
          </div>
        )}

        {!recoveryMode && (
          <div className="pt-10 space-y-6">
            <div className="relative flex items-center justify-center">
               <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100 dark:border-white/5"></div></div>
               <span className="relative px-4 bg-white dark:bg-slate-900 text-[10px] font-black text-gray-300 uppercase tracking-widest">or</span>
            </div>
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setIsForgot(false);
                setError(null);
                setMessage(null);
                setPassword('');
              }}
              className="w-full bg-white dark:bg-slate-900 border-2 border-gray-100 dark:border-white/5 text-gray-700 dark:text-gray-200 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-slate-800 transition-all shadow-soft active:scale-95"
            >
              {isLogin ? 'Create Account' : 'Sign in instead'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
