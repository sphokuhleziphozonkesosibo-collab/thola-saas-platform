'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ProviderProfile } from '@/types';
import Link from 'next/link';

export default function EnterpriseCustomerPortal() {
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('All');
  const [providers, setProviders] = useState<(ProviderProfile & { verification_status?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeProvider, setActiveProvider] = useState<(ProviderProfile & { verification_status?: string }) | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [problemDesc, setProblemDesc] = useState('');
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  useEffect(() => {
    fetchLiveProviders();
  }, []);

  const fetchLiveProviders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database fetch error:', error.message);
    } else if (data) {
      setProviders(data);
    }
    setLoading(false);
  };

  const filteredProviders = providers.filter((p) => {
    const matchesLocation = p.location.toLowerCase().includes(searchLocation.toLowerCase());
    const matchesSkill = selectedSkill === 'All' || p.skill.toLowerCase() === selectedSkill.toLowerCase();
    return matchesLocation && matchesSkill;
  });

  const handleDispatchEmergency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !problemDesc || !activeProvider) return;

    const { error } = await supabase.from('jobs').insert([
      {
        customer_name: `${customerName} (${customerPhone})`,
        description: `[EMERGENCY - ${activeProvider.business_name}] ${problemDesc}`,
        amount: 850,
        status: 'Pending Approval',
        callout_fee: 350,
        parts_cost: 300,
        labor_cost: 200,
        payment_method: 'Cash/EFT'
      }
    ]);

    if (error) {
      alert(`Dispatch failed: ${error.message}`);
    } else {
      setRequestSubmitted(true);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      <header style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ backgroundColor: '#2563EB', color: '#FFF', fontWeight: 'bold', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            T
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0F172A', margin: 0 }}>Thola Platform</h1>
            <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>Verified Local Emergency Services & FixPay</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link href="/dashboard" style={{ fontSize: '13px', color: '#475569', textDecoration: 'none', fontWeight: 600, padding: '8px 12px' }}>
            Provider Portal
          </Link>
          <Link href="/login" style={{ fontSize: '13px', backgroundColor: '#2563EB', color: '#FFF', textDecoration: 'none', fontWeight: 600, padding: '8px 16px', borderRadius: '6px' }}>
            Sign In / Register
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px' }}>
        
        {!activeProvider ? (
          <div>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '32px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', marginBottom: '32px' }}>
              <span style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', fontSize: '11px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                South Africa Emergency Response Network
              </span>
              <h2 style={{ fontSize: '26px', fontWeight: 'bold', color: '#0F172A', margin: '12px 0 8px 0' }}>
                Need fast help with a geyser, burst pipe, or power trip?
              </h2>
              <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px' }}>
                Type your township or area below to search local professionals. Unverified profiles require manual trust checks.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                    📍 Your Township / Area
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Umlazi, Elandskop, KwaMashu"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                    🔧 Required Trade
                  </label>
                  <select 
                    value={selectedSkill}
                    onChange={(e) => setSelectedSkill(e.target.value)}
                    style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px', backgroundColor: '#FFF', boxSizing: 'border-box' }}
                  >
                    <option value="All">All Trades</option>
                    <option value="Plumber">Plumber (Geysers, Leaks)</option>
                    <option value="Electrician">Electrician (Wiring, Trips)</option>
                    <option value="Mobile Mechanic">Mobile Mechanic</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1E293B', margin: 0 }}>
                Registered Local Experts ({filteredProviders.length})
              </h3>
              <span style={{ fontSize: '12px', color: '#B45309', backgroundColor: '#FEF3C7', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                🛡️ Real Human Vetting Active
              </span>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>Loading registered cloud profiles...</div>
            ) : filteredProviders.length === 0 ? (
              <div style={{ backgroundColor: '#FFF', padding: '48px', borderRadius: '12px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                <p style={{ color: '#64748B', fontSize: '15px', margin: '0 0 8px 0' }}>No professionals found matching your location search.</p>
                <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>Try searching for "Umlazi" or register your business via the Provider Portal.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredProviders.map((provider) => {
                  const isVerified = provider.verification_status === 'Verified';
                  return (
                    <div key={provider.id} style={{ backgroundColor: '#FFF', border: '1px solid #E2E8F0', padding: '24px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                      <div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '6px' }}>
                          <h4 style={{ margin: 0, color: '#0F172A', fontSize: '18px', fontWeight: 'bold' }}>{provider.business_name}</h4>
                          
                          {/* Realistic Verification Badge based on Database State */}
                          {isVerified ? (
                            <span style={{ fontSize: '11px', backgroundColor: '#DCFCE7', color: '#166534', padding: '3px 8px', borderRadius: '20px', fontWeight: 'bold' }}>
                              ✓ ID Verified & Vouched
                            </span>
                          ) : (
                            <span style={{ fontSize: '11px', backgroundColor: '#FEF3C7', color: '#B45309', padding: '3px 8px', borderRadius: '20px', fontWeight: 'bold' }}>
                              ⏳ Pending Human ID Check
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: '14px', color: '#475569' }}>
                          🔧 <strong>{provider.skill}</strong> &nbsp;•&nbsp; 📍 <strong>{provider.location}</strong>
                        </p>
                      </div>

                      <button 
                        onClick={() => { setActiveProvider(provider); setRequestSubmitted(false); }}
                        style={{ backgroundColor: '#16A34A', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)' }}
                      >
                        Request Emergency Help 🚀
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div style={{ backgroundColor: '#FFF', border: '1px solid #E2E8F0', padding: '36px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
            <button 
              onClick={() => setActiveProvider(null)}
              style={{ background: 'none', border: 'none', color: '#2563EB', cursor: 'pointer', marginBottom: '20px', padding: 0, fontSize: '14px', fontWeight: 'bold' }}
            >
              ← Back to Available Experts
            </button>

            <h3 style={{ margin: '0 0 6px 0', color: '#0F172A', fontSize: '22px', fontWeight: 'bold' }}>
              Dispatch Emergency Request to {activeProvider.business_name}
            </h3>
            <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '24px' }}>
              Trade: {activeProvider.skill} | Location: {activeProvider.location}
            </p>

            {!requestSubmitted ? (
              <form onSubmit={handleDispatchEmergency} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#334155' }}>Your Full Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Zipho Dlamini"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required 
                    style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#334155' }}>Your WhatsApp / Phone Number</label>
                  <input 
                    type="tel" 
                    placeholder="e.g. 082 123 4567"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required 
                    style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#334155' }}>Describe the Emergency (e.g. Geyser leaking heavily)</label>
                  <textarea 
                    placeholder="Provide your full street address, township, and details of the fault..."
                    value={problemDesc}
                    onChange={(e) => setProblemDesc(e.target.value)}
                    required 
                    rows={4} 
                    style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} 
                  />
                </div>

                <button 
                  type="submit"
                  style={{ backgroundColor: '#2563EB', color: 'white', padding: '14px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' }}
                >
                  Confirm & Send Request to FixPay Dashboard 📲
                </button>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px' }}>
                <div style={{ width: '60px', height: '60px', backgroundColor: '#DCFCE7', color: '#166534', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', fontSize: '24px', fontWeight: 'bold' }}>
                  ✓
                </div>
                <h4 style={{ color: '#166534', margin: '0 0 8px 0', fontSize: '20px', fontWeight: 'bold' }}>Emergency Dispatched Successfully!</h4>
                <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 0 24px 0' }}>
                  {activeProvider.business_name} has received your request live in their cloud pipeline. They will review your emergency and contact you via WhatsApp or phone.
                </p>
                <button 
                  onClick={() => { setActiveProvider(null); setCustomerName(''); setCustomerPhone(''); setProblemDesc(''); }}
                  style={{ backgroundColor: '#2563EB', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
                >
                  Return to Emergency Search
                </button>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}