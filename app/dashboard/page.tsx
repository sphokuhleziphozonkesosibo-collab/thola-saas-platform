'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface JobItem {
  id: string;
  customer_name: string;
  description: string;
  amount: number;
  status: 'Pending Approval' | 'In Progress' | 'Completed (Unpaid Invoice)' | 'Paid ✅';
  callout_fee?: number;
  parts_cost?: number;
  labor_cost?: number;
}

export default function EnterpriseDashboard() {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // New Job Form State
  const [newCustomer, setNewCustomer] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [calloutFee, setCalloutFee] = useState('350');
  const [partsCost, setPartsCost] = useState('400');
  const [laborCost, setLaborCost] = useState('300');
  const [showForm, setShowForm] = useState(false);

  const router = useRouter();

  // Authentication & Supabase v2 Real-Time WebSocket Channel Subscription
  useEffect(() => {
    checkUserAndFetchJobs();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jobs' },
        (payload) => {
          console.log('Real-time database sync event received:', payload);
          fetchJobs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkUserAndFetchJobs = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push('/login');
      return;
    }

    setUserEmail(session.user.email || 'Provider Node');
    await fetchJobs();
    setLoading(false);
  };

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching jobs:', error.message);
    } else if (data) {
      setJobs(data as JobItem[]);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const totalPendingOwed = jobs
    .filter(j => j.status !== 'Paid ✅')
    .reduce((sum, j) => sum + Number(j.amount), 0);

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer || !newDesc) return;

    const callout = parseFloat(calloutFee) || 0;
    const parts = parseFloat(partsCost) || 0;
    const labor = parseFloat(laborCost) || 0;
    const totalAmount = callout + parts + labor;

    const newJobPayload = {
      customer_name: newCustomer,
      description: newDesc,
      amount: totalAmount,
      status: 'Pending Approval' as const,
      callout_fee: callout,
      parts_cost: parts,
      labor_cost: labor,
    };

    const { error } = await supabase.from('jobs').insert([newJobPayload]);

    if (error) {
      alert(`Error saving job: ${error.message}`);
    } else {
      setNewCustomer('');
      setNewDesc('');
      setShowForm(false);
      fetchJobs();
    }
  };

  const advanceJobStatus = async (id: string, currentStatus: string) => {
    let nextStatus: JobItem['status'] = 'In Progress';
    if (currentStatus === 'Pending Approval') nextStatus = 'In Progress';
    else if (currentStatus === 'In Progress') nextStatus = 'Completed (Unpaid Invoice)';
    else if (currentStatus === 'Completed (Unpaid Invoice)') nextStatus = 'Paid ✅';

    const { error } = await supabase
      .from('jobs')
      .update({ status: nextStatus })
      .eq('id', id);

    if (error) {
      alert(`Error updating status: ${error.message}`);
    } else {
      setJobs(jobs.map(job => job.id === id ? { ...job, status: nextStatus } : job));
    }
  };

  return (
    <main style={{ padding: '40px', fontFamily: '-apple-system, sans-serif', maxWidth: '850px', margin: '0 auto', backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
        <div>
          <span style={{ backgroundColor: '#DBEAFE', color: '#1D4ED8', fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px' }}>
            Thola Real-Time WebSocket Engine 🟢
          </span>
          <h1 style={{ color: '#0F172A', margin: '8px 0 0 0', fontSize: '24px', fontWeight: 'bold' }}>Provider Financial Dashboard</h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 4px 0' }}>{userEmail}</p>
          <button 
            onClick={handleLogout}
            style={{ fontSize: '12px', color: '#DC2626', background: 'none', border: '1px solid #FCA5A5', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 4px 0' }}>Total Revenue Settled</p>
          <h2 style={{ fontSize: '28px', color: '#0F172A', margin: 0 }}>R4,500</h2>
          <span style={{ fontSize: '11px', color: '#166534', fontWeight: 'bold' }}>↑ Live Gateway & Cash Sync</span>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 4px 0' }}>Pending Customer Debt</p>
          <h2 style={{ fontSize: '28px', color: '#DC2626', margin: 0 }}>R{totalPendingOwed}</h2>
          <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: 'bold' }}>⚠️ Send WhatsApp Invoice Reminder</span>
        </div>
      </div>

      {/* Action Bar */}
      <div style={{ marginBottom: '24px' }}>
        {!showForm ? (
          <button 
            onClick={() => setShowForm(true)}
            style={{ backgroundColor: '#16A34A', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)' }}
          >
            + Create Itemized Job & Invoice 🧾
          </button>
        ) : (
          <form onSubmit={handleAddJob} style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #CBD5E1', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#0F172A', fontWeight: 'bold' }}>Itemized FixPay Invoice Generator</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>Customer Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Zipho Dlamini"
                  value={newCustomer}
                  onChange={(e) => setNewCustomer(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>Job Summary / Fault</label>
                <input 
                  type="text" 
                  placeholder="e.g. Fixing leaking geyser valve"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px', color: '#475569' }}>Callout Fee (R)</label>
                <input 
                  type="number" 
                  value={calloutFee}
                  onChange={(e) => setCalloutFee(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px', color: '#475569' }}>Parts / Materials (R)</label>
                <input 
                  type="number" 
                  value={partsCost}
                  onChange={(e) => setPartsCost(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px', color: '#475569' }}>Labor (R)</label>
                <input 
                  type="number" 
                  value={laborCost}
                  onChange={(e) => setLaborCost(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button 
                type="submit"
                style={{ backgroundColor: '#2563EB', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
              >
                Save & Broadcast to Cloud
              </button>
              <button 
                type="button"
                onClick={() => setShowForm(false)}
                style={{ backgroundColor: '#E2E8F0', color: '#334155', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Active Jobs Pipeline */}
      <h3 style={{ fontSize: '18px', color: '#1E293B', marginBottom: '16px', fontWeight: 'bold' }}>Active Real-Time Job Pipeline</h3>
      {loading ? (
        <p style={{ color: '#64748B', fontSize: '14px' }}>Connecting to WebSocket data stream...</p>
      ) : jobs.length === 0 ? (
        <p style={{ color: '#64748B', fontSize: '14px' }}>No active jobs found in cloud database.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {jobs.map((job) => (
            <div key={job.id} style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '6px' }}>
                  <h4 style={{ margin: 0, color: '#0F172A', fontSize: '18px', fontWeight: 'bold' }}>{job.customer_name}</h4>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '3px 10px', borderRadius: '20px', backgroundColor: job.status === 'Paid ✅' ? '#DCFCE7' : '#FEF3C7', color: job.status === 'Paid ✅' ? '#166534' : '#B45309' }}>
                    {job.status}
                  </span>
                </div>
                <p style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#475569' }}>{job.description}</p>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#0F172A' }}>Total: R{job.amount}</p>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {job.status !== 'Paid ✅' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                    <button 
                      onClick={() => advanceJobStatus(job.id, job.status)}
                      style={{ backgroundColor: '#2563EB', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      {job.status === 'Pending Approval' && 'Approve Quote'}
                      {job.status === 'In Progress' && 'Mark Job Done (Invoice)'}
                      {job.status === 'Completed (Unpaid Invoice)' && 'Confirm Cash/EFT Payment ✅'}
                    </button>

                    <a
                      href={`https://wa.me/?text=Hi%20${encodeURIComponent(job.customer_name)},%20here%20is%20your%20Thola%20FixPay%20invoice%20for%20("${encodeURIComponent(job.description)}")%20Total:%20R${job.amount}.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '11px', color: '#166534', backgroundColor: '#DCFCE7', padding: '4px 8px', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold' }}
                    >
                      💬 WhatsApp Invoice Reminder
                    </a>
                  </div>
                ) : (
                  <span style={{ fontSize: '14px', color: '#166534', fontWeight: 'bold' }}>Fully Settled 🎉</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </main>
  );
}