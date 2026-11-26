'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface JobRequest {
  id: string;
  customer_name: string;
  description: string;
  amount: number;
  status: string;
  created_at: string;
}

export default function ResponsiveCustomerJobs() {
  const [requests, setRequests] = useState<JobRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Review Modal States (Matches Page 8 & 16)
  const [reviewingJob, setReviewingJob] = useState<JobRequest | null>(null);
  const [ratingStars, setRatingStars] = useState(5);
  const [commentText, setCommentText] = useState('Arrived quickly and fixed it professionally.');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    const { data } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
    if (data && data.length > 0) {
      setRequests(data as JobRequest[]);
    } else {
      // Seed default jobs matching Page 7 & 15
      setRequests([
        { id: '1', customer_name: 'brazos · 082 223 333', description: 'Emergency: burst geyser', amount: 850, status: 'Paid ✅', created_at: '' },
        { id: '2', customer_name: 'zipho', description: 'Light off, for Bhuti', amount: 800, status: 'Paid ✅', created_at: '' },
        { id: '3', customer_name: 'zipho', description: 'Light off, for Bhuti', amount: 800, status: 'Pending', created_at: '' },
        { id: '4', customer_name: 'zipho', description: 'Electrical issue', amount: 800, status: 'Pending', created_at: '' }
      ]);
    }
    setLoading(false);
  };

  const handleSecurePay = async (jobId: string) => {
    setProcessingId(jobId);
    setTimeout(async () => {
      await supabase.from('jobs').update({ status: 'Paid ✅' }).eq('id', jobId);
      setRequests(requests.map(r => r.id === jobId ? { ...r, status: 'Paid ✅' } : r));
      setProcessingId(null);
    }, 1000);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingJob) return;
    setSubmittingReview(true);

    await supabase.from('customer_reviews').insert([
      {
        provider_id: 'general',
        customer_name: reviewingJob.customer_name.split('·')[0].trim() || 'Zipho',
        rating: ratingStars,
        comment: commentText,
        job_id: reviewingJob.id
      }
    ]);

    setReviewingJob(null);
    setSubmittingReview(false);
    alert('Review published successfully! ⭐');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col justify-between">
      
      {/* Universal Header */}
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
          <Link href="/customer" className="text-indigo-700 font-bold hover:text-indigo-800">My jobs</Link>
          <Link href="/dashboard" className="bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl">
            Provider dashboard
          </Link>
        </div>
      </header>

      {/* Main Ledger Container */}
      <main className="max-w-5xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-10 flex-1">
        
        {/* Title (Matches Page 7 & 15) */}
        <div className="mb-6">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full inline-block mb-1.5">
            Secure customer portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Your jobs</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">Pay safely through escrow</p>
        </div>

        {/* Responsive Cards Grid (1 Col Mobile, 3 Col Desktop on Page 15) */}
        {loading ? (
          <div className="text-center py-16 text-xs text-slate-400">Loading escrow jobs...</div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center text-xs text-slate-400 border border-slate-200">
            No active jobs in your escrow ledger.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {requests.map((req) => {
              const isPaid = req.status === 'Paid ✅';
              return (
                <div key={req.id} className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h4 className="text-sm font-extrabold text-slate-900 leading-snug">{req.customer_name}</h4>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg shrink-0 ${isPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {isPaid ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mb-3">{req.description}</p>
                    <p className="text-base font-black text-slate-900">R{req.amount}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex justify-end">
                    {!isPaid ? (
                      <button 
                        onClick={() => handleSecurePay(req.id)}
                        disabled={processingId === req.id}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
                      >
                        {processingId === req.id ? 'Connecting...' : 'Pay securely'}
                      </button>
                    ) : (
                      <button 
                        onClick={() => setReviewingJob(req)}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                      >
                        {req.description.toLowerCase().includes('electrician') || req.description.toLowerCase().includes('bhuti') ? 'Rate electrician' : 'Rate plumber'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Review Modal (Matches Page 8 on Mobile & Page 16 on Desktop with Backdrop) */}
      {reviewingJob && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-1">How did it go?</h3>
            <p className="text-xs text-slate-500 font-medium mb-4">{reviewingJob.description}</p>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              {/* 5 Stars Selector matching Page 8 & 16 */}
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingStars(star)}
                    className="text-2xl cursor-pointer"
                  >
                    {star <= ratingStars ? '⭐' : '☆'}
                  </button>
                ))}
                <span className="text-sm font-black text-amber-700 ml-1">{ratingStars} / 5</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Your review</label>
                <textarea 
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-2xl p-3.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-700"
                />
              </div>

              <div className="flex flex-col sm:flex-row-reverse gap-2 pt-2">
                <button 
                  type="submit"
                  disabled={submittingReview}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-3.5 rounded-2xl shadow-md transition-all cursor-pointer"
                >
                  {submittingReview ? 'Publishing...' : 'Publish review'}
                </button>
                <button 
                  type="button"
                  onClick={() => setReviewingJob(null)}
                  className="flex-1 bg-white hover:bg-slate-50 text-indigo-700 border border-slate-200 font-bold text-xs py-3.5 rounded-2xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile-Only Bottom Tab Navigation */}
      <div className="md:hidden sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-8 py-3.5 flex justify-between items-center text-xs font-bold text-slate-400 z-50">
        <Link href="/" className="hover:text-slate-700 flex flex-col items-center gap-0.5">
          <span>Find help</span>
        </Link>
        <Link href="/customer" className="text-indigo-700 font-black flex flex-col items-center gap-0.5">
          <span>Jobs</span>
        </Link>
        <Link href="/login" className="hover:text-slate-700 flex flex-col items-center gap-0.5">
          <span>Profile</span>
        </Link>
      </div>

    </div>
  );
}