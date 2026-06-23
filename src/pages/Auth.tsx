import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { LogIn, UserPlus, Mail, Lock, User as UserIcon, Loader2, Droplets } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const navigate = useNavigate();
  const { localSignIn } = useAuth();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Add subtle parallax effect on mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 20 - 10,
        y: (e.clientY / window.innerHeight) * 20 - 10,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const localResult = await localSignIn(email, password);
        if (localResult.success) {
          toast.success('Welcome! Login successful.');
          navigate('/');
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast.error(localResult.error || error.message);
          return;
        }
        toast.success('Welcome! Login successful.');
        navigate('/');
      } else {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { data: { full_name: fullName } }
        });
        
        if (error) throw error;

        if (data.user) {
          const { error: dbError } = await supabase.from('users').insert({
            id: data.user.id,
            name: fullName,
            email: email,
            role: 'admin'
          });
          
          if (dbError) console.error('Error creating user profile:', dbError);
        }

        toast.success('Registration successful! Please check your email for verification.');
        setIsLogin(true);
      }
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-950">
      {/* Animated Mesh Gradient Background */}
      <div className="absolute inset-0 z-0 opacity-70 mix-blend-screen">
        <div 
          className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-600/40 blur-[100px] animate-pulse" 
          style={{ transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`, transition: 'transform 0.2s ease-out' }}
        />
        <div 
          className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-indigo-600/30 blur-[120px] animate-pulse delay-700" 
          style={{ transform: `translate(${-mousePosition.x}px, ${-mousePosition.y}px)`, transition: 'transform 0.2s ease-out' }}
        />
        <div 
          className="absolute top-[20%] right-[20%] w-[40vw] h-[40vw] rounded-full bg-teal-500/20 blur-[90px] animate-pulse delay-1000" 
        />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      
      {/* Glassmorphic Card */}
      <div className="relative z-10 w-full max-w-md px-6 animate-in zoom-in-95 fade-in duration-1000 ease-out">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
          
          {/* Header */}
          <div className="px-8 pt-10 pb-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-teal-400 mb-6 shadow-lg shadow-blue-500/30">
              <Droplets className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
              {isLogin ? 'Welcome Back' : 'Join KWSC'}
            </h1>
            <p className="text-slate-300 text-sm font-medium">
              {isLogin 
                ? 'Sign in to access your financial dashboard' 
                : 'Create an administrator account to get started'}
            </p>
          </div>

          {/* Form */}
          <div className="px-8 pb-10">
            <form onSubmit={handleAuth} className="space-y-5">
              
              {!isLogin && (
                <div className="space-y-1.5 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="relative group">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-teal-400 transition-colors" />
                    <Input 
                      id="name" 
                      placeholder="Full Name" 
                      className="pl-12 h-14 bg-white/5 border-white/10 text-white placeholder:text-slate-400 focus-visible:ring-teal-400/50 focus-visible:border-teal-400/50 rounded-xl transition-all" 
                      required={!isLogin}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-teal-400 transition-colors" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="Email Address" 
                    className="pl-12 h-14 bg-white/5 border-white/10 text-white placeholder:text-slate-400 focus-visible:ring-teal-400/50 focus-visible:border-teal-400/50 rounded-xl transition-all" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-teal-400 transition-colors" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Password"
                    className="pl-12 h-14 bg-white/5 border-white/10 text-white placeholder:text-slate-400 focus-visible:ring-teal-400/50 focus-visible:border-teal-400/50 rounded-xl transition-all" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {isLogin && (
                  <div className="flex justify-end pt-1">
                    <button type="button" className="text-xs text-slate-400 hover:text-teal-400 transition-colors">
                      Forgot Password?
                    </button>
                  </div>
                )}
              </div>

              <Button 
                className="w-full h-14 mt-4 bg-gradient-to-r from-blue-500 to-teal-400 hover:from-blue-600 hover:to-teal-500 text-white text-base font-bold rounded-xl shadow-lg shadow-blue-500/25 border-0 transition-all hover:scale-[1.02] active:scale-[0.98]" 
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : isLogin ? (
                  <LogIn className="w-5 h-5 mr-2" />
                ) : (
                  <UserPlus className="w-5 h-5 mr-2" />
                )}
                {isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-slate-400">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                <button 
                  type="button" 
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setFullName('');
                    setPassword('');
                  }}
                  className="font-semibold text-teal-400 hover:text-teal-300 transition-colors underline-offset-4 hover:underline"
                >
                  {isLogin ? 'Register' : 'Sign In'}
                </button>
              </p>
            </div>
          </div>
          
        </div>
        
        {/* Footer Text */}
        <div className="text-center mt-6">
          <p className="text-xs text-slate-500">
            Karachi Water & Sewerage Corporation
          </p>
        </div>
      </div>
    </div>
  );
}
