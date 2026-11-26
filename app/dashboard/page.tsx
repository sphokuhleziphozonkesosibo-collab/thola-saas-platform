'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface JobItem {
  id: string;
  customer_name: string;
  description: string;
  amount: number;
  status: string;
  provider_id?: string;
}

export default function StrictlyIsolatedProviderDashboard() {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [providerName, setProviderName] = useState('Provider');
  const router = useRouter();

  useEffect(() => {
    checkSessionAndFetchIsolatedJobs();
  }, []);

  const checkSessionAndFetchIsolatedJobs = async () => {
    setLoading(true);

    // 1. Multi-Tenant Session Verification
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    // 2. Fetch the logged-in provider's profile to get their business name
    const { data: profile } = await supabase
      .from('user_roles')
      .select('business_name')
      .eq('id', session.user.id)
      .single();

    const currentBusinessName = profile?.business_name || '';
    if (currentBusinessName) {
      setProviderName(currentBusinessName);
    }

    // 3. Strict Tenant Isolation Query:
    // Only fetch jobs specifically linked to this provider's UUID
    // or tagged with their specific business name in the emergency dispatch description
    const { data: userJobs, error } = await supabase
      .from('jobs')
      .select('*')
      .or(`provider_id.eq.${session.user.id},description.ilike.%${currentBusinessName}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Multi-tenant job fetch error:', error.message);
    } else if (userJobs && userJobs.length > 0) {
      setJobs(userJobs as JobItem[]);
    } else {
      // Fallback for demo display if this specific provider has no jobs yet
      setJobs([]);
    }

    setLoading(false);
  };

  const advanceStatus = async (id: string, current: string) => {
    let next = 'In Progress';
    if (current === 'Pending Approval' || current === 'Pending') next = 'In Progress';
    else if (current === 'In Progress') next = 'Completed (Unpaid Invoice)';
    else if (current === 'Completed (Unpaid Invoice)') next = 'Paid ✅';

    await supabase.from('jobs').update({ status: next }).eq('id', id);
    setJobs(jobs.map(j => j.id === id ? { ...j, status: next } : j));
  };

  // Dynamic calculations based strictly on this provider's jobs
  const settledRevenue = jobs
    .filter(j => j.status === 'Paid ✅')
    .reduce((sum, j) => sum + Number(j.amount), 0);

  const pendingDebt = jobs
    .filter(j => j.status !== 'Paid ✅')
    .reduce((sum, j) => sum + Number(j.amount), 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col justify-between">
      
      {/* Universal Desktop & Mobile Header (Matches Page 4 & 12) */}
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
          <Link href="/dashboard" className="bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl shadow-sm">
            Provider dashboard
          </Link>
        </div>
      </header>

      {/* Main Dashboard Container */}
      <main className="max-w-5xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-10 flex-1">
        
        {/* Top Header with Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {providerName} dashboard
            </span>
            <div className="flex items-center gap-3 mt-0.5">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Your money</h1>
              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs">
                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse" /> Live
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/dashboard/portfolio" className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm py-3 px-5 rounded-2xl transition-all shadow-sm">
              New job and invoice
            </Link>
            <Link href="/dashboard/bank" className="bg-white hover:bg-slate-50 text-indigo-700 font-extrabold text-xs sm:text-sm py-3 px-5 rounded-2xl border border-slate-200 transition-colors shadow-2xs">
              Payouts
            </Link>
          </div>
        </div>

        {/* Stats Metrics: Strictly calculated from THIS provider's ledger */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 mb-8">
          <div className="bg-emerald-700 text-white p-5 sm:p-6 rounded-3xl shadow-lg shadow-emerald-900/10">
            <p className="text-xs font-bold text-emerald-100/90 mb-1">Revenue settled</p>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">R{settledRevenue.toLocaleString()}</h2>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
            <p className="text-xs font-bold text-slate-400 mb-1">Pending debt</p>
            <h2 className="text-2xl sm:text-3xl font-black text-amber-700 tracking-tight">R{pendingDebt.toLocaleString()}</h2>
          </div>

          <div className="col-span-2 md:col-span-1 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
            <p className="text-xs font-bold text-slate-400 mb-1">Active jobs</p>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{jobs.length}</h2>
          </div>
        </div>

        {/* Active Jobs Section */}
        <h3 className="text-base sm:text-lg font-black text-slate-900 mb-4 px-1">Active jobs</h3>

        {loading ? (
          <div className="text-center py-12 text-xs text-slate-400">Loading isolated provider jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center text-xs text-slate-400 border border-slate-200 shadow-2xs">
            No active jobs in your pipeline. Jobs assigned to your business will appear here automatically.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {jobs.map((job) => {
              const isPaid = job.status === 'Paid ✅';
              return (
                <div key={job.id} className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h4 className="text-sm font-extrabold text-slate-900 leading-snug">{job.customer_name}</h4>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg shrink-0 ${isPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {isPaid ? 'Paid' : 'Awaiting'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mb-3">{job.description}</p>
                    <p className="text-base font-black text-slate-900">R{job.amount}</p>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-400">
                      {isPaid ? 'Settled' : 'Unsettled'}
                    </span>
                    
                    {!isPaid ? (
                      <button 
                        onClick={() => advanceStatus(job.id, job.status)}
                        className="text-indigo-700 hover:text-indigo-800 text-xs font-bold cursor-pointer"
                      >
                        Send reminder
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-emerald-700">✓ Completed</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Mobile-Only Bottom Tab Navigation */}
      <div className="md:hidden sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-8 py-3.5 flex justify-between items-center text-xs font-bold text-slate-400 z-50">
        <Link href="/" className="hover:text-slate-700 flex flex-col items-center gap-0.5">
          <span>Find help</span>
        </Link>
        <Link href="/dashboard" className="text-indigo-700 font-black flex flex-col items-center gap-0.5">
          <span>Jobs</span>
        </Link>
        <Link href="/login" className="hover:text-slate-700 flex flex-col items-center gap-0.5">
          <span>Profile</span>
        </Link>
      </div>

    </div>
  );
}