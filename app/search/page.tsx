'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ProviderProfile } from '@/types';

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<ProviderProfile | null>(null);
  const [requestSent, setRequestSent] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [description, setDescription] = useState('');

  // Fetch providers from Supabase cloud database on page load
  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching providers:', error.message);
      } else if (data) {
        setProviders(data);
      }
    } catch (err) {
      console.error('Network error fetching providers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter providers based on search input (matching skill or location)
  const filteredProviders = providers.filter((p) => 
    p.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.skill.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.business_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRequestQuote = (provider: ProviderProfile) => {
    setSelectedProvider(provider);
    setRequestSent(false);
  };

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !description || !selectedProvider) return;

    // In a full production loop, this saves a quote request into a 'quotes' table.
    // For now, we simulate a successful dispatch to the provider's board.
    setRequestSent(true);
  };

  return (
    <main style={{ padding: '40px', fontFamily: 'Arial, sans-serif', maxWidth: '700px', margin: '0 auto', backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <span style={{ backgroundColor: '#DBEAFE', color: '#1D4ED8', fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px' }}>
          Thola Marketplace
        </span>
        <h1 style={{ color: '#0F172A', margin: '8px 0 4px 0', fontSize: '24px' }}>Find Local Service Providers</h1>
        <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>
          Real-time sync from Supabase cloud database.
        </p>
      </div>

      {/* Search Input Box */}
      <div style={{ marginBottom: '24px', backgroundColor: '#FFF', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#334155' }}>
          Search by Location or Skill (e.g. Umlazi, Electrician, Plumber)
        </label>
        <input 
          type="text" 
          placeholder="Type to filter providers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', padding: '10px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
        />
      </div>

      {/* Main Content Area */}
      {!selectedProvider ? (
        <div>
          <h3 style={{ fontSize: '16px', color: '#1E293B', marginBottom: '12px' }}>
            Verified Professionals Online ({filteredProviders.length})
          </h3>

          {loading ? (
            <p style={{ color: '#64748B', fontSize: '14px' }}>Loading providers from cloud database...</p>
          ) : filteredProviders.length === 0 ? (
            <div style={{ backgroundColor: '#FFF', padding: '24px', borderRadius: '8px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
              <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>No service providers found matching your search.</p>
              <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>Try registering one at <a href="/provider" style={{ color: '#2563EB' }}>/provider</a> first!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredProviders.map((provider) => (
                <div key={provider.id} style={{ border: '1px solid #E2E8F0', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', color: '#0F172A', fontSize: '16px' }}>{provider.business_name}</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                      🔧 {provider.skill} &nbsp;•&nbsp; 📍 {provider.location}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleRequestQuote(provider)}
                    style={{ backgroundColor: '#2563EB', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
                  >
                    Request Quote
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Request Quote Form View */
        <div style={{ backgroundColor: '#FFF', border: '1px solid #E2E8F0', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <button 
            onClick={() => setSelectedProvider(null)}
            style={{ background: 'none', border: 'none', color: '#2563EB', cursor: 'pointer', marginBottom: '16px', padding: 0, fontSize: '13px', fontWeight: 'bold' }}
          >
            ← Back to Search Results
          </button>

          <h3 style={{ margin: '0 0 4px 0', color: '#0F172A' }}>Request Quote from {selectedProvider.business_name}</h3>
          <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px' }}>
            Specialty: {selectedProvider.skill} | Location: {selectedProvider.location}
          </p>

          {!requestSent ? (
            <form onSubmit={submitRequest} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>Your Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Zipho"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required 
                  style={{ width: '100%', padding: '9px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>Describe the Job & Budget</label>
                <textarea 
                  placeholder="e.g. Fix kitchen plugs, budget R800"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required 
                  rows={3} 
                  style={{ width: '100%', padding: '9px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} 
                />
              </div>
              <button 
                type="submit"
                style={{ backgroundColor: '#16A34A', color: 'white', padding: '11px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
              >
                Send Request via FixPay Protocol ✅
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ width: '40px', height: '40px', backgroundColor: '#DCFCE7', color: '#166534', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', fontSize: '18px', fontWeight: 'bold' }}>
                ✓
              </div>
              <h4 style={{ color: '#166534', margin: '0 0 6px 0', fontSize: '18px' }}>Request Dispatched Successfully!</h4>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5', margin: '0 0 20px 0' }}>
                {selectedProvider.business_name} has received your request. They will generate an automated FixPay quote to initiate your service pipeline.
              </p>
              <button 
                onClick={() => { setSelectedProvider(null); setCustomerName(''); setDescription(''); }}
                style={{ backgroundColor: '#2563EB', color: 'white', border: 'none', padding: '9px 18px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
              >
                Back to Search
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}