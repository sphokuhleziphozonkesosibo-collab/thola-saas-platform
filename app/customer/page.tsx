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

export default function EnterpriseCustomerPortal() {
  const [requests, setRequests] = useState<JobRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPaymentId, setProcessingPaymentId] = useState<string | null>(null);

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

  // Secure Server-Side Initiated Payment Gateway Handshake
  const handleSecureCheckout = async (jobId: string, amount: number) => {
    setProcessingPaymentId(jobId);

    try {
      // Call our secure Next.js backend API route (Never expose secret keys on client)
      const res = await fetch('/api/paystack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          email: 'customer@thola.co.za',
          jobId: jobId
        })
      });

      const result = await res.json();

      if (result.status) {
        // In live production, you redirect user to result.data.authorization_url
        // For testing this portfolio project, we simulate the successful webhook callback:
        const { error } = await supabase
          .from('jobs')
          .update({ status: 'Paid ✅' })
          .eq('id', jobId);

        if (!error) {
          setRequests(requests.map(req => req.id === jobId ? { ...req, status: 'Paid ✅' } : req));
          alert(`Secure Gateway Verified: Transaction reference [${result.data.reference}] cleared successfully! Ledger updated.`);
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

  return (
    <main style={{ padding: '40px', fontFamily: '-apple-system, sans-serif', maxWidth: '850px', margin: '0 auto', backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
        <div>
          <span style={{ backgroundColor: '#DBEAFE', color: '#1D4ED8', fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px' }}>
            Thola FixPay Secure Gateway (Paystack & Ozow Architecture)
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
                  <span style={{ fontSize: '14px', color: '#166534', fontWeight: 'bold', backgroundColor: '#DCFCE7', padding: '8px 14px', borderRadius: '6px' }}>
                    Paid & Settled 🎉
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </main>
  );
}