"use client";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { buttonClassName } from '@/models/constants';
import { Eye, EyeOff, Check, X, ArrowLeft, Loader2, Sparkles, ShieldCheck, Zap, HeartPulse } from 'lucide-react';
import Image from 'next/image';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [signupStep, setSignupStep] = useState(1);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState(1);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const { signUp, signIn } = useAuth();

  const [validations, setValidations] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  useEffect(() => {
    setValidations({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    });
  }, [password]);

  const isPasswordValid = Object.values(validations).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      if (isSignUp) {
        if (signupStep === 1) {
          if (!isPasswordValid) {
            setMessage({ type: 'error', text: 'Please meet all password requirements.' });
            setLoading(false);
            return;
          }
          const res = await fetch('/api/auth/signup/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });
          const data = await res.json();
          if (res.ok) {
            setMessage({ type: 'success', text: data.message });
            setSignupStep(2);
          } else {
            setMessage({ type: 'error', text: data.error });
          }
        } else {
          await signUp(email, password, fullName, otp);
        }
      } else {
        await signIn(email, password);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Authentication failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      if (resetStep === 1) {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (res.ok) {
          setMessage({ type: 'success', text: data.message });
          setResetStep(2);
        } else {
          setMessage({ type: 'error', text: data.error });
        }
      } else if (resetStep === 2) {
        setResetStep(3);
      } else if (resetStep === 3) {
        if (password !== confirmPassword) {
          setMessage({ type: 'error', text: 'Passwords do not match' });
          setLoading(false);
          return;
        }
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp, newPassword: password }),
        });
        const data = await res.json();
        if (res.ok) {
          setMessage({ type: 'success', text: 'Password reset successfully. You can now sign in.' });
          setTimeout(() => {
            setIsForgotPassword(false);
            setResetStep(1);
            setIsSignUp(false);
            setPassword('');
          }, 2000);
        } else {
          setMessage({ type: 'error', text: data.error });
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  };

  const ValidationItem = ({ isValid, text }: { isValid: boolean, text: string }) => (
    <div className={`flex items-center space-x-2 text-xs ${isValid ? 'text-green-500' : 'text-foreground/40'}`}>
      {isValid ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
      <span>{text}</span>
    </div>
  );

  const perks = [
    { icon: Sparkles, text: "AI-Powered Budgeting", color: "text-blue-400" },
    { icon: ShieldCheck, text: "Military-Grade Security", color: "text-indigo-400" },
    { icon: Zap, text: "Real-time Insight Alerts", color: "text-amber-400" },
    { icon: HeartPulse, text: "Financial Wellness Coaching", color: "text-rose-400" },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* LEFT PANEL - Narrative & Branding (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-950">
        <Image
          src="/auth-hero.png"
          alt="Auth Hero"
          fill
          className="object-cover opacity-60 mix-blend-luminosity grayscale-[30%]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/40 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(37,99,235,0.15),transparent_50%)]" />

        <div className="relative z-10 flex flex-col justify-between w-full p-16">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/20 text-3xl font-semibold text-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.3)] border border-blue-500/30">
              💸
            </span>
            <span className="text-2xl font-black tracking-tight text-white/90">XPENSIFY</span>
          </div>

          <div className="space-y-8">
            <h1 className="text-6xl font-black text-white leading-[1.1] tracking-tighter">
              Reimagine Your <span className="text-blue-500">Wealth.</span>
            </h1>
            <p className="text-xl text-white/60 max-w-lg leading-relaxed font-medium">
              Join thousands of users who are using AI to transform their financial habits and achieve their goals faster than ever.
            </p>

            <div className="grid grid-cols-1 gap-6 pt-12 border-t border-white/10">
              {perks.map((perk, i) => (
                <div key={i} className="flex items-center gap-4 group animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className={`p-3 rounded-xl bg-white/5 border border-white/10 ${perk.color} group-hover:scale-110 transition-all duration-300`}>
                    <perk.icon size={20} />
                  </div>
                  <span className="text-white/80 font-semibold">{perk.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 text-white/40 text-sm font-medium">
            <div className="flex -space-x-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-10 w-10 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center overflow-hidden">
                  <Image src={`https://i.pravatar.cc/150?u=${i}`} alt="user" width={40} height={40} className="grayscale-[50%]" />
                </div>
              ))}
            </div>
            <p>Finley & Ava are waiting to guide you.</p>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - Authentication Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background relative overflow-hidden">
        {/* Subtle background decoration for the form side */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 blur-[120px] -z-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/5 blur-[120px] -z-10" />

        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          {/* Logo only on mobile */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-2xl font-semibold text-blue-400">
                💸
              </span>
              <span className="text-xl font-bold tracking-tight text-foreground/90">XPENSIFY</span>
            </div>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            {!isForgotPassword ? (
              <>
                <h2 className="text-3xl font-black text-foreground tracking-tight">
                  {isSignUp ? (signupStep === 1 ? 'Get Started' : 'Confirm Email') : 'Welcome Back'}
                </h2>
                <p className="text-foreground/50 font-medium">
                  {isSignUp
                    ? (signupStep === 1 ? 'Start your journey to financial freedom' : `We've sent a code to ${email}`)
                    : 'Sign in to access your financial dashboard'}
                </p>
              </>
            ) : (
              <>
                <h2 className="text-3xl font-black text-foreground tracking-tight">Reset Password</h2>
                <p className="text-foreground/50 font-medium">
                  {resetStep === 1 ? 'Enter your email to receive an OTP' :
                    resetStep === 2 ? 'Enter the 6-digit code sent to your email' :
                      'Create a new secure password'}
                </p>
              </>
            )}
          </div>

          {message && (
            <div className={`p-4 rounded-xl text-sm font-semibold animate-in zoom-in-95 duration-300 ${message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
              <div className="flex items-center gap-2">
                {message.type === 'success' ? <Check size={16} /> : <X size={16} />}
                {message.text}
              </div>
            </div>
          )}

          {!isForgotPassword ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {isSignUp ? (
                /* SIGN UP FLOW */
                <div className="space-y-5">
                  {signupStep === 1 ? (
                    <>
                      <div className="space-y-2 group">
                        <Label htmlFor="signup-name" className="text-xs font-bold uppercase tracking-widest text-foreground/60 group-focus-within:text-blue-500 transition-colors">Full Name</Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="John Doe"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="h-12 bg-foreground/[0.02] border-foreground/10 focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-900 transition-all rounded-xl"
                          required
                        />
                      </div>
                      <div className="space-y-2 group">
                        <Label htmlFor="signup-email" className="text-xs font-bold uppercase tracking-widest text-foreground/60 group-focus-within:text-blue-500 transition-colors">Email Address</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="name@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-12 bg-foreground/[0.02] border-foreground/10 focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-900 transition-all rounded-xl"
                          required
                        />
                      </div>
                      <div className="space-y-2 group">
                        <Label htmlFor="signup-password" className="text-xs font-bold uppercase tracking-widest text-foreground/60 group-focus-within:text-blue-500 transition-colors">Password</Label>
                        <div className="relative">
                          <Input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-12 bg-foreground/[0.02] border-foreground/10 focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-900 transition-all rounded-xl pr-12"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-blue-500 transition-colors"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <ValidationItem isValid={validations.length} text="8+ characters" />
                        <ValidationItem isValid={validations.uppercase} text="Uppercase" />
                        <ValidationItem isValid={validations.lowercase} text="Lowercase" />
                        <ValidationItem isValid={validations.number} text="Number" />
                        <ValidationItem isValid={validations.special} text="Special Char" />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-6 animate-in slide-up duration-500 shadow-xl p-6 rounded-3xl bg-blue-600/5 border border-blue-500/10">
                      <div className="space-y-2 text-center group">
                        <Label htmlFor="signup-otp" className="text-xs font-bold uppercase tracking-widest text-blue-500">Verification Code</Label>
                        <Input
                          id="signup-otp"
                          type="text"
                          placeholder="000000"
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          className="h-16 text-center text-4xl tracking-[0.5em] font-black bg-white dark:bg-slate-900 border-blue-500/30 rounded-2xl"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setSignupStep(1)}
                        className="text-sm text-blue-500 hover:text-blue-600 font-bold transition-colors w-full text-center hover:underline"
                      >
                        Back to details
                      </button>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white text-lg font-black rounded-2xl shadow-[0_10px_30px_-10px_rgba(37,99,235,0.5)] transition-all active:scale-95 disabled:opacity-70 mt-4"
                    disabled={loading || (signupStep === 1 && !isPasswordValid)}
                  >
                    {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                    {signupStep === 1 ? 'Create Account' : 'Verify & Continue'}
                  </Button>
                </div>
              ) : (
                /* SIGN IN FLOW */
                <div className="space-y-5">
                  <div className="space-y-2 group">
                    <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-foreground/60 group-focus-within:text-blue-500 transition-colors">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 bg-foreground/[0.02] border-foreground/10 focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-900 transition-all rounded-xl"
                    />
                  </div>

                  <div className="space-y-2 group">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-foreground/60 group-focus-within:text-blue-500 transition-colors">Password</Label>
                      <button
                        type="button"
                        onClick={() => setIsForgotPassword(true)}
                        className="text-xs font-bold text-blue-500 hover:text-blue-600 transition-colors"
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-12 bg-foreground/[0.02] border-foreground/10 focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-900 transition-all rounded-xl pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-blue-500 transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white text-lg font-black rounded-2xl shadow-[0_10px_30px_-10px_rgba(37,99,235,0.5)] transition-all active:scale-95 disabled:opacity-70 mt-4"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Log In'}
                  </Button>
                </div>
              )}
            </form>
          ) : (
            /* FORGOT PASSWORD FLOW */
            <form onSubmit={handleForgotPassword} className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setResetStep(1);
                  setMessage(null);
                }}
                className="flex items-center text-xs font-bold uppercase tracking-widest text-foreground/40 hover:text-blue-500 transition-colors"
              >
                <ArrowLeft className="w-3 h-3 mr-2" /> Back to Sign In
              </button>

              {resetStep === 1 && (
                <div className="space-y-2 group">
                  <Label htmlFor="forgot-email" className="text-xs font-bold uppercase tracking-widest text-foreground/60 group-focus-within:text-blue-500 transition-colors">Email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 bg-foreground/[0.02] border-foreground/10 focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-900 transition-all rounded-xl"
                  />
                </div>
              )}

              {resetStep === 2 && (
                <div className="space-y-4 shadow-xl p-6 rounded-3xl bg-blue-600/5 border border-blue-500/10">
                  <Label htmlFor="otp" className="text-xs font-bold uppercase tracking-widest text-blue-500 block text-center">OTP Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    maxLength={6}
                    className="h-16 text-center text-4xl tracking-[0.5em] font-black bg-white dark:bg-slate-900 border-blue-500/30 rounded-2xl"
                  />
                </div>
              )}

              {resetStep === 3 && (
                <div className="space-y-5">
                  <div className="space-y-2 group">
                    <Label htmlFor="newPassword" className="text-xs font-bold uppercase tracking-widest text-foreground/60 group-focus-within:text-blue-500 transition-colors">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-12 bg-foreground/[0.02] border-foreground/10 focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-900 transition-all rounded-xl pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-blue-500"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 group">
                    <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-widest text-foreground/60 group-focus-within:text-blue-500 transition-colors">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="h-12 bg-foreground/[0.02] border-foreground/10 focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-900 transition-all rounded-xl"
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white text-lg font-black rounded-2xl shadow-[0_10px_30px_-10px_rgba(37,99,235,0.5)] transition-all active:scale-95 disabled:opacity-70 mt-4"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> :
                  resetStep === 1 ? 'Send OTP' :
                    resetStep === 2 ? 'Verify OTP' :
                      'Update Password'}
              </Button>
            </form>
          )}

          {!isForgotPassword && (
            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setSignupStep(1);
                  setMessage(null);
                }}
                className="text-sm font-bold text-foreground/60 hover:text-blue-500 transition-colors"
              >
                {isSignUp
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"}
              </button>
            </div>
          )}

          <div className="pt-8 text-center border-t border-foreground/5">
            <p className="text-[10px] text-foreground/30 uppercase tracking-[0.2em] font-bold">
              Secure Cloud Infrastructure // 256-bit Encryption
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
