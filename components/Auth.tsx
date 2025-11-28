import React, { useState } from 'react';
import { AuthMode, PremiumTier, UserState, ViewMode } from '../types';
import { authService } from '../services/authService';
import { dbService } from '../services/dbService';
import { TIERS, t } from '../constants';

interface AuthProps {
  mode: AuthMode;
  selectedPlan: PremiumTier;
  onAuthComplete: (userState: UserState) => void;
  onSwitchMode: (mode: AuthMode) => void;
  onBack: () => void;
}

const Auth: React.FC<AuthProps> = ({ mode, selectedPlan, onAuthComplete, onSwitchMode, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReset, setShowReset] = useState(false);

  const selectedTier = TIERS.find(t => t.id === selectedPlan) || TIERS[0];
  const isTrial = selectedPlan !== PremiumTier.FREE;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'LOGIN') {
        const user = await authService.signInWithEmail(email, password);
        if (user) {
            const userState = await dbService.loadUserState(user.uid);
            if (userState) onAuthComplete(userState);
        } else {
             // Detta ska inte hända om signInWithEmail är korrekt
             setError(t('auth.authFailed'));
        }
      } else { // SIGNUP
        const result = await authService.signUpWithEmail(email, password, selectedPlan);
        if (result && result.userState) {
          onAuthComplete(result.userState);
        }
      }
    } catch (err: any) {
      setError(err.message || t('auth.authFailed'));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
        const result = await authService.signInWithGoogle(selectedPlan);
        if (result && result.userState) {
            onAuthComplete(result.userState);
        }
    } catch (err: any) {
        setError(err.message || t('auth.authFailed'));
    } finally {
        setIsLoading(false);
    }
  }
  
  const handlePasswordReset = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setIsLoading(true);
      try {
          await authService.resetPassword(email);
          alert(t('auth.resetLinkSent'));
          setShowReset(false);
      } catch (err: any) {
          setError(err.message || t('auth.authFailed'));
      } finally {
          setIsLoading(false);
      }
  }


  if (showReset) {
      return (
          <div className="min-h-screen bg-aura-black text-white flex flex-col items-center justify-center p-6">
              <div className="w-full max-w-sm bg-aura-card p-8 rounded-2xl shadow-xl border border-zinc-800">
                  <button onClick={() => setShowReset(false)} className="text-zinc-500 hover:text-white mb-4 block">{t('auth.backToLogin')}</button>
                  <h2 className="text-3xl font-bold mb-6 text-center">{t('auth.resetPassword')}</h2>
                  <p className="text-zinc-400 text-sm mb-6 text-center">{t('auth.enterEmailReset')}</p>
                  <form onSubmit={handlePasswordReset} className="space-y-4">
                      <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={t('auth.email')}
                          required
                          className="w-full p-3 bg-aura-dark border border-zinc-700 rounded-lg focus:ring-aura-accent focus:border-aura-accent"
                      />
                      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                      <button
                          type="submit"
                          className="w-full bg-aura-accent text-white py-3 rounded-lg font-semibold hover:bg-indigo-600 transition duration-150"
                          disabled={isLoading}
                      >
                          {isLoading ? t('button.processing') : t('auth.sendResetLink')}
                      </button>
                  </form>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-aura-black text-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm bg-aura-card p-8 rounded-2xl shadow-xl border border-zinc-800">
            <button onClick={onBack} className="text-zinc-500 hover:text-white mb-4 block">← {t('button.back')}</button>
            <h2 className="text-3xl font-bold mb-2 text-center">{mode === 'LOGIN' ? t('auth.welcome') : t('auth.create')}</h2>
            <p className="text-zinc-400 text-sm mb-6 text-center">{mode === 'LOGIN' ? t('auth.loginDesc') : t('auth.signupDesc')}</p>

            {mode === 'SIGNUP' && (
                <div className={`p-3 rounded-lg mb-4 text-sm font-medium ${selectedTier.highlight ? 'bg-amber-400/10 text-amber-300 border border-amber-400/20' : 'bg-zinc-700/30 text-zinc-300'}`}>
                    <span className="font-bold">{t('auth.selectedPlan')}: {t(`tier.${selectedTier.id.toLowerCase()}`)}</span>
                    {isTrial && <span className="text-xs block text-zinc-400 mt-1">{t('auth.freeTrial')}</span>}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('auth.email')}
                    required
                    className="w-full p-3 bg-aura-dark border border-zinc-700 rounded-lg focus:ring-aura-accent focus:border-aura-accent"
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth.password')}
                    required
                    className="w-full p-3 bg-aura-dark border border-zinc-700 rounded-lg focus:ring-aura-accent focus:border-aura-accent"
                />
                
                {mode === 'LOGIN' && (
                    <button type="button" onClick={() => setShowReset(true)} className="text-sm text-zinc-500 hover:text-white block w-full text-right">
                        {t('auth.forgotPassword')}
                    </button>
                )}

                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                
                <button
                    type="submit"
                    className="w-full bg-aura-accent text-white py-3 rounded-lg font-semibold hover:bg-indigo-600 transition duration-150"
                    disabled={isLoading}
                >
                    {isLoading ? t('button.processing') : (mode === 'LOGIN' ? t('auth.logIn') : t('auth.create'))}
                </button>
            </form>

            <div className="flex items-center justify-center my-4">
                <span className="text-zinc-600 text-sm">eller</span>
            </div>

            <button
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-2 bg-zinc-700 text-white py-3 rounded-lg font-semibold hover:bg-zinc-600 transition duration-150"
                disabled={isLoading}
            >
                <svg viewBox="0 0 48 48" className="w-5 h-5">
                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.159,7.963,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,19.034-8.036,19.034-20c0-1.341-0.138-2.617-0.381-3.839z"/>
                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.159,7.963,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.331,6.306,14.691z"/>
                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.627-3.37-11.246-8.173l-6.442,4.721C9.619,39.816,16.284,44,24,44z"/>
                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.618,43.843,21.31,43.611,20.083z"/>
                </svg>
                {t('auth.signIn')} med Google
            </button>


            <div className="mt-6 text-center text-sm">
                {mode === 'LOGIN' ? (
                    <p className="text-zinc-500">{t('auth.noAccount')} <button type="button" onClick={() => onSwitchMode('SIGNUP')} className="text-aura-accent hover:text-indigo-400 font-semibold">{t('auth.create')}</button></p>
                ) : (
                    <p className="text-zinc-500">{t('auth.haveAccount')} <button type="button" onClick={() => onSwitchMode('LOGIN')} className="text-aura-accent hover:text-indigo-400 font-semibold">{t('auth.logIn')}</button></p>
                )}
            </div>
        </div>
    </div>
  );
};

export default Auth;