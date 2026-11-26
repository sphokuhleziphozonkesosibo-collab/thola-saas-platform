'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ProviderProfile } from '@/types';
import Link from 'next/link';

interface PortfolioItem {
  id: string;
  media_url: string;
  caption: string;
}

interface ReviewItem {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export default function EnterpriseMarketplaceDynamicRatings() {
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('All');
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Inspection Modal State
  const [inspectingProvider, setInspectingProvider] = useState<ProviderProfile | null>(null);
  const [portfolioPhotos, setPortfolioPhotos] = useState<PortfolioItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  
  // Booking State
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [problemDesc, setProblemDesc] = useState('');

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setProviders(data as ProviderProfile[]);
    setLoading(false);
  };

  const openProviderProfile = async (provider: ProviderProfile) => {
    setInspectingProvider(provider);
    setRequestSubmitted(false);

    // Fetch portfolio photos and reviews linked to this specific provider's id
    const { data: portData } = await supabase
      .from('provider_portfolio')
      .select('*')
      .eq('provider_id', provider.id);

    const { data: revData } = await supabase
      .from('customer_reviews')
      .select('*')
      .eq('provider_id', provider.id);

    setPortfolioPhotos(portData ? (portData as PortfolioItem[]) : []);
    setReviews(revData ? (revData as ReviewItem[]) : []);
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !inspectingProvider) return;

    const { error } = await supabase.from('jobs').insert([
      {
        customer_name: `${customerName} (${customerPhone})`,
        description: `[EMERGENCY - ${inspectingProvider.business_name}] ${problemDesc}`,
        amount: 850,
        status: 'Pending Approval',
        escrow_status: 'Held in Escrow 🔒',
      }
    ]);

    if (error) alert(`Error: ${error.message}`);
    else setRequestSubmitted(true);
  };

  const filteredProviders = providers.filter((p) => {
    const matchesLocation = p.location.toLowerCase().includes(searchLocation.toLowerCase());
    const matchesSkill = selectedSkill === 'All' || p.skill.toLowerCase() === selectedSkill.toLowerCase();
    return matchesLocation && matchesSkill;
  });

  // Calculate dynamic average star rating and review count
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : '5.0';

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', fontFamily: '-apple-system, sans-serif' }}>
      
      {/* Header */}
      <header style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ backgroundColor: '#16A34A', color: '#FFF', fontWeight: 'bold', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            T
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0F172A', margin: 0 }}>Thola Marketplace</h1>
            <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>Verified Experts, Live Galleries & Dynamic Ratings</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/customer" style={{ fontSize: '13px', color: '#2563EB', textDecoration: 'none', fontWeight: 'bold' }}>Customer Portal</Link>
          <Link href="/dashboard" style={{ fontSize: '13px', backgroundColor: '#2563EB', color: '#FFF', textDecoration: 'none', fontWeight: 'bold', padding: '8px 16px', borderRadius: '6px' }}>Provider Dashboard</Link>
        </div>
      </header>

      <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px' }}>
        
        {!inspectingProvider ? (
          <div>
            {/* Search Box */}
            <div style={{ backgroundColor: '#FFF', padding: '32px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '32px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0F172A', margin: '0 0 8px 0' }}>Find Verified Local Tradesmen with Live Work Galleries</h2>
              <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px' }}>Inspect real-time photos of past work and star ratings before hiring.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
                <input 
                  type="text" 
                  placeholder="Search by Township (e.g. Umlazi)"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  style={{ padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px' }}
                />
                <select 
                  value={selectedSkill}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                  style={{ padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px', backgroundColor: '#FFF' }}
                >
                  <option value="All">All Trades</option>
                  <option value="Plumber">Plumber</option>
                  <option value="Electrician">Electrician</option>
                </select>
              </div>
            </div>

            {/* Provider List */}
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1E293B', marginBottom: '16px' }}>Available Experts ({filteredProviders.length})</h3>
            
            {loading ? (
              <p style={{ color: '#64748B' }}>Loading marketplace database...</p>
            ) : filteredProviders.length === 0 ? (
              <div style={{ backgroundColor: '#FFF', padding: '40px', textAlign: 'center', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <p style={{ color: '#64748B', margin: 0 }}>No providers found matching your search.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {filteredProviders.map((provider) => (
                  <div key={provider.id} style={{ backgroundColor: '#FFF', border: '1px solid #E2E8F0', padding: '24px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 'bold', color: '#0F172A' }}>{provider.business_name}</h4>
                      <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#64748B' }}>🔧 {provider.skill} • 📍 {provider.location}</p>
                      <span style={{ fontSize: '12px', color: '#166534', backgroundColor: '#DCFCE7', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>⭐ Verified Professional</span>
                    </div>
                    <button 
                      onClick={() => openProviderProfile(provider)}
                      style={{ backgroundColor: '#2563EB', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
                    >
                      View Profile & Hire 👁️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Detailed Provider Profile Showcase */
          <div style={{ backgroundColor: '#FFF', border: '1px solid #E2E8F0', padding: '36px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
            <button 
              onClick={() => setInspectingProvider(null)}
              style={{ background: 'none', border: 'none', color: '#2563EB', cursor: 'pointer', marginBottom: '20px', padding: 0, fontSize: '14px', fontWeight: 'bold' }}
            >
              ← Back to Search Directory
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', borderBottom: '1px solid #E2E8F0', paddingBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '26px', fontWeight: 'bold', color: '#0F172A', margin: '0 0 6px 0' }}>{inspectingProvider.business_name}</h2>
                <p style={{ fontSize: '15px', color: '#475569', margin: 0 }}>🔧 {inspectingProvider.skill} &nbsp;•&nbsp; 📍 {inspectingProvider.location}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                {/* Dynamic Average Rating Badge */}
                <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#166534', backgroundColor: '#DCFCE7', padding: '6px 12px', borderRadius: '8px' }}>
                  ⭐ {avgRating} out of 5 ({reviews.length} reviews)
                </span>
              </div>
            </div>

            {/* Portfolio Showcase Grid */}
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1E293B', marginBottom: '12px' }}>📸 Verified Work Gallery</h3>
            {portfolioPhotos.length === 0 ? (
              <div style={{ backgroundColor: '#F8FAFC', padding: '24px', borderRadius: '8px', border: '1px solid #E2E8F0', textAlign: 'center', marginBottom: '32px' }}>
                <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>This provider currently has no available showcase photos uploaded.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '32px' }}>
                {portfolioPhotos.map((photo) => (
                  <div key={photo.id} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #CBD5E1', backgroundColor: '#FFF' }}>
                    <img src={photo.media_url} alt={photo.caption} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                    <p style={{ padding: '8px 10px', margin: 0, fontSize: '12px', color: '#334155', fontWeight: 'bold', backgroundColor: '#F8FAFC' }}>{photo.caption}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Customer Reviews Section */}
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1E293B', marginBottom: '12px' }}>💬 Customer Ratings & Reviews</h3>
            {reviews.length === 0 ? (
              <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '32px' }}>No reviews recorded yet. Be the first to hire and review!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
                {reviews.map((rev) => (
                  <div key={rev.id} style={{ backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '14px', color: '#0F172A' }}>{rev.customer_name}</strong>
                      <span style={{ color: '#B45309', fontSize: '13px' }}>{'⭐'.repeat(rev.rating)}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: '#475569' }}>"{rev.comment}"</p>
                  </div>
                ))}
              </div>
            )}

            {/* Hire / Booking Form */}
            <div style={{ backgroundColor: '#F1F5F9', padding: '24px', borderRadius: '12px', border: '1px solid #CBD5E1' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 'bold', color: '#0F172A' }}>Dispatch Emergency Hire Request</h3>
              
              {!requestSubmitted ? (
                <form onSubmit={handleBooking} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <input 
                    type="text" 
                    placeholder="Your Full Name (e.g. Zipho)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    style={{ padding: '10px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '14px' }}
                  />
                  <input 
                    type="tel" 
                    placeholder="WhatsApp Phone Number"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                    style={{ padding: '10px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '14px' }}
                  />
                  <textarea 
                    rows={3} 
                    placeholder="Describe emergency fault (e.g. Geyser leaking in roof)..."
                    value={problemDesc}
                    onChange={(e) => setProblemDesc(e.target.value)}
                    required
                    style={{ padding: '10px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '14px' }}
                  />
                  <button 
                    type="submit"
                    style={{ backgroundColor: '#16A34A', color: '#FFF', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}
                  >
                    Confirm & Send Emergency Request 🚀
                  </button>
                </form>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <h4 style={{ color: '#166534', margin: '0 0 6px 0' }}>Request Dispatched Successfully! 🎉</h4>
                  <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>{inspectingProvider.business_name} has received your request live in their cloud dashboard.</p>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </main>
  );
}