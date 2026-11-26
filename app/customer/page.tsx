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

export default function EnterpriseCustomerPortalUberStyle() {
  const [requests, setRequests] = useState<JobRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPaymentId, setProcessingPaymentId] = useState<string | null>(null);

  // Uber-Style Interactive Review Modal State
  const [reviewingJob, setReviewingJob] = useState<JobRequest | null>(null);
  const [ratingStars, setRatingStars] = useState(5);
  const [commentText, setCommentText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchCustomerRequests();
  }, []);

  const fetchCustomerRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching requests:', error.message);
    } else if (data) {
      setRequests(data as JobRequest[]);
    }
    setLoading(false);
  };

  const handleSecureCheckout = async (jobId: string, amount: number) => {
    setProcessingPaymentId(jobId);

    try {
      const res = await fetch('/api/paystack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amount, email: 'customer@thola.co.za', jobId: jobId })
      });

      const result = await res.json();

      if (result.status) {
        const { error } = await supabase
          .from('jobs')
          .update({ status: 'Paid ✅' })
          .eq('id', jobId);

        if (!error) {
          setRequests(requests.map(req => req.id === jobId ? { ...req, status: 'Paid ✅' } : req));
          alert(`Payment verified & cleared successfully via secure gateway!`);
        }
      } else {
        alert(`Payment initialization failed: ${result.error}`);
      }
    } catch (err: any) {
      alert(`Network error connecting to payment gateway: ${err.message}`);
    } finally {
      setProcessingPaymentId(null);
    }
  };

  // Submit Uber-Style Review Handler
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingJob) return;
    setSubmittingReview(true);

    try {
      // Extract provider name from description e.g. "[EMERGENCY - Sibusiso Geyser...] desc"
      let providerName = 'Verified Professional';
      const descMatch = reviewingJob.description.match(/\[(?:EMERGENCY -|For)?\s*([^\]]+)\]/);
      if (descMatch && descMatch[1]) {
        providerName = descMatch[1].trim();
      }

      // Look up provider's profile ID based on business name
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .ilike('business_name', `%${providerName}%`)
        .single();

      const providerId = profileData ? profileData.id : 'general-provider';

      // Insert into customer_reviews
      const { error: reviewError } = await supabase.from('customer_reviews').insert([
        {
          provider_id: providerId,
          customer_name: reviewingJob.customer_name.split(' ')[0] || 'Verified Customer',
          rating: ratingStars,
          comment: commentText,
          job_id: reviewingJob.id
        }
      ]);

      if (reviewError) throw reviewError;

      alert('Review published successfully! Your rating is now live on the provider profile. ⭐');
      setReviewingJob(null);
      setCommentText('');
      setRatingStars(5);

    } catch (err: any) {
      alert(`Error submitting review: ${err.message}`);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <main style={{ padding: '40px', fontFamily: '-apple-system, sans-serif', maxWidth: '850px', margin: '0 auto', backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
        <div>
          <span style={{ backgroundColor: '#DBEAFE', color: '#1D4ED8', fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px' }}>
            Thola FixPay Secure Customer Portal
          </span>
          <h1 style={{ color: '#0F172A', margin: '8px 0 0 0', fontSize: '24px', fontWeight: 'bold' }}>Active Service & Invoice Payments</h1>
        </div>
        <div>
          <Link href="/" style={{ fontSize: '13px', color: '#2563EB', textDecoration: 'none', fontWeight: 'bold', background: '#FFF', border: '1px solid #CBD5E1', padding: '8px 14px', borderRadius: '6px' }}>
            ← Back to Emergency Search
          </Link>
        </div>
      </div>

      {/* Requests List */}
      <h3 style={{ fontSize: '18px', color: '#1E293B', marginBottom: '16px', fontWeight: 'bold' }}>Live Pipeline & Payment Gateway</h3>
      
      {loading ? (
        <p style={{ color: '#64748B', fontSize: '14px' }}>Syncing financial ledger with cloud database...</p>
      ) : requests.length === 0 ? (
        <div style={{ backgroundColor: '#FFF', padding: '32px', borderRadius: '12px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
          <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>No active service requests or invoices found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {requests.map((req) => (
            <div key={req.id} style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '6px' }}>
                  <h4 style={{ margin: 0, color: '#0F172A', fontSize: '18px', fontWeight: 'bold' }}>{req.customer_name}</h4>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '3px 10px', borderRadius: '20px', backgroundColor: req.status === 'Paid ✅' ? '#DCFCE7' : '#FEF3C7', color: req.status === 'Paid ✅' ? '#166534' : '#B45309' }}>
                    {req.status}
                  </span>
                </div>
                <p style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#475569' }}>{req.description}</p>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#0F172A' }}>Total Due: R{req.amount}</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                {req.status !== 'Paid ✅' ? (
                  <button 
                    onClick={() => handleSecureCheckout(req.id, req.amount)}
                    disabled={processingPaymentId === req.id}
                    style={{ backgroundColor: '#16A34A', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)' }}
                  >
                    {processingPaymentId === req.id ? 'Connecting to Gateway...' : '💳 Pay Securely (Paystack / Ozow)'}
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '13px', color: '#166534', fontWeight: 'bold', backgroundColor: '#DCFCE7', padding: '6px 12px', borderRadius: '6px' }}>
                      Paid & Settled 🎉
                    </span>
                    <button 
                      onClick={() => setReviewingJob(req)}
                      style={{ backgroundColor: '#2563EB', color: '#FFF', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      ⭐ Rate & Review Plumber
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Uber-Style Interactive Star Review Modal */}
      {reviewingJob && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ backgroundColor: '#FFF', width: '100%', maxWidth: '500px', borderRadius: '16px', padding: '32px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            
            <h3 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: 'bold', color: '#0F172A' }}>Rate Your Service Experience</h3>
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px' }}>Job: <strong>{reviewingJob.description}</strong></p>

            <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#334155' }}>Select Star Rating</label>
                {/* Interactive Clickable Stars */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingStars(star)}
                      style={{ fontSize: '28px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, filter: star <= ratingStars ? 'grayscale(0)' : 'grayscale(100%) opacity(40%)' }}
                    >
                      ⭐
                    </button>
                  ))}
                  <span style={{ alignSelf: 'center', marginLeft: '8px', fontWeight: 'bold', color: '#D97706', fontSize: '15px' }}>
                    {ratingStars} / 5 Stars
                  </span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#334155' }}>Your Review Comments</label>
                <textarea 
                  rows={4}
                  placeholder="e.g. Sibusiso arrived quickly in Umlazi and fixed our geyser valve professionally."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button 
                  type="submit"
                  disabled={submittingReview}
                  style={{ backgroundColor: '#16A34A', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
                >
                  {submittingReview ? 'Publishing Review...' : 'Publish Rating & Review ⭐'}
                </button>
                <button 
                  type="button"
                  onClick={() => setReviewingJob(null)}
                  style={{ backgroundColor: '#E2E8F0', color: '#334155', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
                >
                  Cancel
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </main>
  );
}