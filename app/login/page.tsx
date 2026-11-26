'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ResponsiveAuthKYC() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [skill, setSkill] = useState('Plumber (geysers, leaks)');
  const [location, setLocation] = useState('');
  const [saIdNumber, setSaIdNumber] = useState('');
  
  const [idFile, setIdFile] = useState<File | null>(null);
  const [workFile, setWorkFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    if (isSignUp) {
      if (!saIdNumber || saIdNumber.length !== 13) {
        setErrorMessage('Please enter a valid 13-digit SA ID number.');
        setLoading(false);
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) {
        setErrorMessage(authError.message);
        setLoading(false);
        return;
      }

      if (authData.user) {
        await supabase.from('user_roles').insert([{
          id: authData.user.id,
          role: 'provider',
          business_name: businessName,
          skill: skill,
          location: location,
          sa_id_number: saIdNumber,
          verification_status: 'Verified Escrow Pro'
        }]);

        await supabase.from('profiles').insert([{
          business_name: businessName,
          skill: skill,
          location: location,
          verification_status: 'Verified Escrow Pro'
        }]);

        alert('Business verified successfully! You can now sign in.');
        setIsSignUp(false);
      }
    } else {
      const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setErrorMessage(error.message);
      } else if (authData.user) {
        router.push('/dashboard');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200/80 px-4 sm:px-10 py-3.5 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-700 text-white font-black rounded-xl flex items-center justify-center text-base shadow-sm">
            T
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-extrabold text-slate-900 leading-tight">Thola</h1>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full inline-block">
              Secure escrow active
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
          <Link href="/" className="hover:text-slate-900">Find help</Link>
          <Link href="/customer" className="hover:text-slate-900">My jobs</Link>
          <Link href="/dashboard" className="bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl">
            Provider dashboard
          </Link>
        </div>
      </header>

      {/* Responsive Body */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-10">
        
        {/* Desktop Split Layout (Matches Page 11 for Sign in) */}
        {!isSignUp ? (
          <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
            
            {/* Left Hero Brand Panel (Matches Page 11) */}
            <div className="hidden md:flex md:col-span-5 bg-indigo-700 text-white p-10 flex-col justify-between relative overflow-hidden">
              <div className="w-12 h-12 bg-white text-indigo-700 font-black rounded-2xl flex items-center justify-center text-xl shadow-md">
                T
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tight leading-tight mb-2">
                  Trusted help, paid safely.
                </h2>
                <p className="text-indigo-100 text-xs font-medium leading-relaxed">
                  Escrow-protected jobs for verified South African professionals.
                </p>
              </div>
              <div className="text-[10px] text-indigo-200">
                Thola Enterprise Trust Engine © 2026
              </div>
            </div>

            {/* Right Form Panel (Matches Page 3 & 11) */}
            <div className="md:col-span-7 p-8 sm:p-12 flex flex-col justify-center">
              <div className="mb-6">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full inline-block mb-2">
                  Trust & KYC
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Welcome back</h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Sign in to your provider account</p>
              </div>

              {errorMessage && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-2xl text-xs mb-4">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email address</label>
                  <input 
                    type="email" 
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-700"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Password</label>
                  <input 
                    type="password" 
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-700"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs sm:text-sm py-4 rounded-2xl shadow-md transition-all cursor-pointer"
                >
                  {loading ? 'Authenticating...' : 'Sign in'}
                </button>
              </form>

              <div className="text-center mt-6">
                <p className="text-xs font-bold text-slate-500">
                  New to Thola?{' '}
                  <button onClick={() => setIsSignUp(true)} className="text-indigo-700 hover:underline cursor-pointer">
                    Create an account
                  </button>
                </p>
              </div>
            </div>

          </div>
        ) : (
          /* Sign Up / Business Verification Screen (Matches Page 2 on Mobile & Page 10 on Desktop) */
          <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-10">
            <div className="mb-6">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full inline-block mb-1.5">
                Trust & KYC
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Verify your business</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Step 1 of 3 · Takes about 3 minutes</p>
              
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-indigo-700 w-1/3 h-full rounded-full" />
              </div>
            </div>

            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-2xl text-xs mb-4">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Account type</label>
                  <select className="w-full bg-white border border-slate-300 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-none cursor-pointer">
                    <option value="provider">Skilled professional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Business name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Sibu Plumbing"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Trade</label>
                  <select 
                    value={skill}
                    onChange={(e) => setSkill(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="Plumber (geysers, leaks)">Plumber (geysers, leaks)</option>
                    <option value="Electrician">Electrician (wiring, trips)</option>
                    <option value="Mobile Mechanic">Mobile Mechanic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Service area / township</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Umlazi"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">SA ID number (13 digits)</label>
                <input 
                  type="text" 
                  maxLength={13}
                  placeholder="Checked for validity"
                  value={saIdNumber}
                  onChange={(e) => setSaIdNumber(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-none"
                />
              </div>

              {/* Upload Pills matching Page 2 & 10 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="block w-full text-center border border-indigo-200 border-dashed bg-indigo-50/40 hover:bg-indigo-50 text-indigo-700 font-bold text-xs py-3.5 rounded-2xl cursor-pointer transition-colors">
                  {idFile ? `✓ ${idFile.name}` : 'Upload SA ID photo or scan'}
                  <input type="file" accept="image/*,.pdf" onChange={(e) => e.target.files && setIdFile(e.target.files[0])} className="hidden" />
                </label>

                <label className="block w-full text-center border border-indigo-200 border-dashed bg-indigo-50/40 hover:bg-indigo-50 text-indigo-700 font-bold text-xs py-3.5 rounded-2xl cursor-pointer transition-colors">
                  {workFile ? `✓ ${workFile.name}` : 'Upload proof of past work'}
                  <input type="file" accept="image/*" onChange={(e) => e.target.files && setWorkFile(e.target.files[0])} className="hidden" />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email address</label>
                  <input 
                    type="email" 
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Password</label>
                  <input 
                    type="password" 
                    placeholder="Create password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs sm:text-sm py-4 rounded-2xl shadow-md transition-all cursor-pointer mt-2"
              >
                {loading ? 'Processing...' : 'Continue'}
              </button>
            </form>

            <div className="text-center mt-5">
              <button 
                onClick={() => setIsSignUp(false)}
                className="text-xs font-bold text-slate-600 hover:text-indigo-700 cursor-pointer"
              >
                Already have an account? <span className="text-indigo-700 underline">Sign in</span>
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Mobile-Only Bottom Tab Navigation */}
      <div className="md:hidden sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-8 py-3.5 flex justify-between items-center text-xs font-bold text-slate-400 z-50">
        <Link href="/" className="hover:text-slate-700 flex flex-col items-center gap-0.5">
          <span>Find help</span>
        </Link>
        <Link href="/customer" className="hover:text-slate-700 flex flex-col items-center gap-0.5">
          <span>Jobs</span>
        </Link>
        <Link href="/login" className="text-indigo-700 font-black flex flex-col items-center gap-0.5">
          <span>Profile</span>
        </Link>
      </div>

    </div>
  );
}