
import React, { useState } from 'react';
import { AuthMode, PremiumTier } from '../types';
import { TIERS, t } from '../constants';
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authService } from '../services/authService';
import { dbService } from '../services/dbService';

interface Props {
  mode: AuthMode;
  selectedPlan?: PremiumTier;
  onAuthComplete: (email: string, plan: PremiumTier, uid: string) => void;
  onSwitchMode: (mode: AuthMode) => void;
  onBack: () => void;
}

const Auth: React.FC<Props> = ({ mode, selectedPlan, onAuthComplete, onSwitchMode, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [forgotMode, setForgotMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    
    try {
      let userCredential;
      if (mode === 'SIGNUP') {
        userCredential = await authService.signUpWithEmail(email, password, selectedPlan || PremiumTier.BASIC);
        setSuccessMsg(t('auth.accountCreated'));
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (userCredential && userCredential.user) {
             onAuthComplete(email, selectedPlan || PremiumTier.BASIC, userCredential.user.uid);
        }
      } else {
        const user = await authService.signInWithEmail(email, password);
        if (user) {
            const userState = await dbService.loadUserState(user.uid);
            onAuthComplete(email, userState?.tier || PremiumTier.BASIC, user.uid);
        }
      }
    } catch (err: any) {
      console.error(err);
      let msg = t('auth.authFailed');
      if (err.message) msg = err.message;
      setError(msg);
    } finally {
      if (mode === 'LOGIN') setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError(t('auth.enterEmailReset'));
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await authService.resetPassword(email);
      setSuccessMsg(t('auth.resetLinkSent'));
      setForgotMode(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  const planDetails = selectedPlan ? TIERS.find(t => t.id === selectedPlan) : null;

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/20 via-black to-zinc-900/50 pointer-events-none" />
      
      <div className="w-full max-w-md bg-[#121214] border border-white/5 p-8 rounded-3xl relative z-10 shadow-2xl">
        <button onClick={onBack} className="absolute top-8 left-8 text-zinc-500 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>

        <div className="text-center mb-8 mt-4">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-indigo-400">
            <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse" />
          </div>
          <h2 className="text-2xl font-light mb-2">
            {forgotMode ? t('auth.resetPassword') : (mode === 'LOGIN' ? t('auth.welcome') : t('auth.create'))}
          </h2>
          <p className="text-zinc-400 text-sm">
            {forgotMode 
              ? t('auth.enterEmailReset')
              : (mode === 'LOGIN' ? t('auth.loginDesc') : t('auth.signupDesc'))}
          </p>
        </div>

        {mode === 'SIGNUP' && planDetails && !forgotMode && (
          <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center">
            <div>
              <div className="text-xs text-zinc-500 uppercase tracking-wide">{t('auth.selectedPlan')}</div>
              <div className="font-medium text-indigo-300">{planDetails.name}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-white">Free</div>
              <div className="text-xs text-zinc-500">{t('auth.freeTrial')}</div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-sm text-red-400 animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-sm text-emerald-400 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 size={16} />
            {successMsg}
          </div>
        )}

        {!forgotMode ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1 ml-1">{t('auth.email')}</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-black/50 border border-white/10 p-3 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors text-white"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1 ml-1">{t('auth.password')}</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-white/10 p-3 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors text-white"
                placeholder="••••••••"
              />
              {mode === 'LOGIN' && (
                <div className="text-right mt-1">
                  <button 
                    type="button" 
                    onClick={() => setForgotMode(true)}
                    className="text-xs text-zinc-500 hover:text-white transition-colors"
                  >
                    {t('auth.forgotPassword')}
                  </button>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-white text-black font-medium p-3 rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {mode === 'LOGIN' ? t('button.signIn') : t('button.proceed')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1 ml-1">{t('auth.email')}</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-black/50 border border-white/10 p-3 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors text-white"
                placeholder="you@example.com"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-medium p-3 rounded-xl hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {t('auth.sendResetLink')}
            </button>
            <button 
              type="button"
              onClick={() => { setForgotMode(false); setError(null); setSuccessMsg(null); }}
              className="w-full text-zinc-500 text-sm py-2 hover:text-white transition-colors"
            >
              {t('auth.backToLogin')}
            </button>
          </form>
        )}

        {!forgotMode && (
          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-500">
              {mode === 'LOGIN' ? t('auth.noAccount') + " " : t('auth.haveAccount') + " "}
              <button 
                onClick={() => {
                  onSwitchMode(mode === 'LOGIN' ? 'SIGNUP' : 'LOGIN');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="text-white hover:underline underline-offset-4"
              >
                {mode === 'LOGIN' ? t('header.startTrial') : t('button.login')}
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
