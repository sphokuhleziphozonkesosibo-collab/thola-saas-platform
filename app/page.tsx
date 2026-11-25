'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ProviderProfile } from '@/types';
import Link from 'next/link';

interface ServiceItem {
  id: string;
  service_name: string;
  category: string;
  fixed_price: number;
  description: string;
}

export default function EnterpriseEscrowPortal() {
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('All');
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [catalog, setCatalog] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Booking Mode State
  const [bookingMode, setBookingMode] = useState<'catalog' | 'custom'>('catalog');
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [activeProvider, setActiveProvider] = useState<ProviderProfile | null>(null);
  
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customBudget, setCustomBudget] = useState('');
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  useEffect(() => {
    fetchMarketplaceData();
  }, []);

  const fetchMarketplaceData = async () => {
    setLoading(true);
    const [providerRes, catalogRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('service_catalog').select('*')
    ]);

    if (providerRes.data) setProviders(providerRes.data as ProviderProfile[]);
    if (catalogRes.data) setCatalog(catalogRes.data as ServiceItem[]);
    setLoading(false);
  };

  const filteredProviders = providers.filter((p) => {
    const matchesLocation = p.location.toLowerCase().includes(searchLocation.toLowerCase());
    const matchesSkill = selectedSkill === 'All' || p.skill.toLowerCase() === selectedSkill.toLowerCase();
    return matchesLocation && matchesSkill;
  });

  const handleEscrowBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !activeProvider) return;

    let finalAmount = 0;
    let finalDesc = '';
    let pricingType = 'fixed';

    if (bookingMode === 'catalog' && selectedService) {
      finalAmount = selectedService.fixed_price;
      finalDesc = `[Fixed Price Service: ${selectedService.service_name}]`;
      pricingType = 'fixed';
    } else {
      finalAmount = parseFloat(customBudget) || 500;
      finalDesc = `[Custom Emergency Quote] ${customDesc}`;
      pricingType = 'custom_quote';
    }

    const { error } = await supabase.from('jobs').insert([
      {
        customer_name: `${customerName} (${customerPhone})`,
        description: `For ${activeProvider.business_name} - ${finalDesc}`,
        amount: finalAmount,
        status: 'Pending Approval',
        pricing_type: pricingType,
        escrow_status: 'Held in Escrow 🔒',
      }
    ]);

    if (error) {
      alert(`Booking failed: ${error.message}`);
    } else {
      setRequestSubmitted(true);
    }
  };

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', fontFamily: '-apple-system, sans-serif' }}>
      
      {/* Header */}
      <header style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ backgroundColor: '#16A34A', color: '#FFF', fontWeight: 'bold', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            T
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0F172A', margin: 0 }}>Thola FixPay Escrow</h1>
            <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>Protected Local Trades & Guaranteed Payments</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link href="/customer" style={{ fontSize: '13px', color: '#2563EB', textDecoration: 'none', fontWeight: 'bold' }}>
            Customer Portal & Invoices
          </Link>
          <Link href="/dashboard" style={{ fontSize: '13px', backgroundColor: '#2563EB', color: '#FFF', textDecoration: 'none', fontWeight: 'bold', padding: '8px 16px', borderRadius: '6px' }}>
            Provider Dashboard
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px' }}>
        
        {!activeProvider ? (
          <div>
            {/* Search & Fixed Price Hero */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '32px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', marginBottom: '32px' }}>
              <span style={{ backgroundColor: '#DCFCE7', color: '#166534', fontSize: '11px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '20px', textTransform: 'uppercase' }}>
                FixPay Escrow Protection 🔒
              </span>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0F172A', margin: '12px 0 8px 0' }}>
                Book Verified Plumbers & Electricians with Zero Risk
              </h2>
              <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px' }}>
                Funds are securely held in escrow and only released to the tradesman after you confirm the job is fully done.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>📍 Your Township / Area</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Umlazi, Elandskop"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>🔧 Trade Category</label>
                  <select 
                    value={selectedSkill}
                    onChange={(e) => setSelectedSkill(e.target.value)}
                    style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px', backgroundColor: '#FFF', boxSizing: 'border-box' }}
                  >
                    <option value="All">All Trades</option>
                    <option value="Plumber">Plumber</option>
                    <option value="Electrician">Electrician</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Provider Directory */}
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1E293B', marginBottom: '16px' }}>
              Verified Available Experts ({filteredProviders.length})
            </h3>

            {loading ? (
              <p style={{ color: '#64748B' }}>Loading cloud marketplace...</p>
            ) : filteredProviders.length === 0 ? (
              <div style={{ backgroundColor: '#FFF', padding: '40px', textAlign: 'center', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <p style={{ color: '#64748B', margin: 0 }}>No providers found in this area. Try searching "Umlazi" or register via Provider Portal.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {filteredProviders.map((provider) => (
                  <div key={provider.id} style={{ backgroundColor: '#FFF', border: '1px solid #E2E8F0', padding: '24px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 'bold', color: '#0F172A' }}>{provider.business_name}</h4>
                      <p style={{ margin: 0, fontSize: '14px', color: '#64748B' }}>🔧 {provider.skill} • 📍 {provider.location}</p>
                    </div>
                    <button 
                      onClick={() => { setActiveProvider(provider); setRequestSubmitted(false); }}
                      style={{ backgroundColor: '#16A34A', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
                    >
                      Book with Escrow Protection 🛡️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Escrow Booking & Pricing Mode View */
          <div style={{ backgroundColor: '#FFF', border: '1px solid #E2E8F0', padding: '36px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
            <button 
              onClick={() => setActiveProvider(null)}
              style={{ background: 'none', border: 'none', color: '#2563EB', cursor: 'pointer', marginBottom: '20px', padding: 0, fontSize: '14px', fontWeight: 'bold' }}
            >
              ← Back to Expert Directory
            </button>

            <h3 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: 'bold', color: '#0F172A' }}>
              Book {activeProvider.business_name}
            </h3>
            <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '24px' }}>
              Choose a standard fixed-price service or submit a custom emergency quote request.
            </p>

            {!requestSubmitted ? (
              <form onSubmit={handleEscrowBooking} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                
                <div style={{ display: 'flex', gap: '12px', backgroundColor: '#F1F5F9', padding: '6px', borderRadius: '8px' }}>
                  <button 
                    type="button" 
                    onClick={() => setBookingMode('catalog')}
                    style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', backgroundColor: bookingMode === 'catalog' ? '#FFF' : 'transparent', color: bookingMode === 'catalog' ? '#0F172A' : '#64748B', boxShadow: bookingMode === 'catalog' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                  >
                    Standard Fixed-Price Menu 🏷️
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setBookingMode('custom')}
                    style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', backgroundColor: bookingMode === 'custom' ? '#FFF' : 'transparent', color: bookingMode === 'custom' ? '#0F172A' : '#64748B', boxShadow: bookingMode === 'custom' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                  >
                    Custom Emergency Quote ⚡
                  </button>
                </div>

                {bookingMode === 'catalog' ? (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#334155' }}>Select Standard Repair Service</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {catalog.map((item) => (
                        <div 
                          key={item.id} 
                          onClick={() => setSelectedService(item)}
                          style={{ border: selectedService?.id === item.id ? '2px solid #2563EB' : '1px solid #CBD5E1', padding: '14px', borderRadius: '8px', cursor: 'pointer', backgroundColor: selectedService?.id === item.id ? '#EFF6FF' : '#FFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                          <div>
                            <p style={{ margin: '0 0 2px 0', fontWeight: 'bold', color: '#0F172A', fontSize: '15px' }}>{item.service_name}</p>
                            <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>{item.description}</p>
                          </div>
                          <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#166534' }}>R{item.fixed_price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#334155' }}>Describe Emergency Fault</label>
                      <textarea 
                        rows={3}
                        placeholder="e.g. Geyser completely burst in roof..."
                        value={customDesc}
                        onChange={(e) => setCustomDesc(e.target.value)}
                        required
                        style={{ width: '100%', padding: '10px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#334155' }}>Your Maximum Budget (Rands)</label>
                      <input 
                        type="number"
                        placeholder="e.g. 1200"
                        value={customBudget}
                        onChange={(e) => setCustomBudget(e.target.value)}
                        required
                        style={{ width: '100%', padding: '10px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#334155' }}>Your Full Name</label>
                  <input 
                    type="text" 
                    placeholder="Zipho Dlamini"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required 
                    style={{ width: '100%', padding: '10px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#334155' }}>WhatsApp / Phone Number</label>
                  <input 
                    type="tel" 
                    placeholder="082 123 4567"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required 
                    style={{ width: '100%', padding: '10px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} 
                  />
                </div>

                <div style={{ backgroundColor: '#DCFCE7', padding: '14px', borderRadius: '8px', border: '1px solid #BBF7D0', fontSize: '13px', color: '#166534' }}>
                  🔒 <strong>Escrow Guarantee:</strong> Your funds will be locked securely in the Thola FixPay ledger. The plumber is only paid after the job is completed and signed off.
                </div>

                <button 
                  type="submit"
                  style={{ backgroundColor: '#16A34A', color: 'white', padding: '14px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}
                >
                  Lock Funds in Escrow & Dispatch Plumber 🚀
                </button>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px' }}>
                <div style={{ width: '60px', height: '60px', backgroundColor: '#DCFCE7', color: '#166534', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', fontSize: '24px', fontWeight: 'bold' }}>
                  ✓
                </div>
                <h4 style={{ color: '#166534', margin: '0 0 8px 0', fontSize: '20px', fontWeight: 'bold' }}>Funds Secured in FixPay Escrow!</h4>
                <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 0 24px 0' }}>
                  Your service request and escrow allocation have been logged live. {activeProvider.business_name} has been notified to dispatch immediately.
                </p>
                <button 
                  onClick={() => { setActiveProvider(null); setRequestSubmitted(false); }}
                  style={{ backgroundColor: '#2563EB', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
                >
                  Return to Home
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}