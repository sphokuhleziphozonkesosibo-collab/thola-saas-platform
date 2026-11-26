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
}

export default function TholaMarketplace() {
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('All');
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Inspector & Modal States
  const [inspectingProvider, setInspectingProvider] = useState<ProviderProfile | null>(null);
  const [portfolioPhotos, setPortfolioPhotos] = useState<PortfolioItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  
  // Booking Form States
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [problemDesc, setProblemDesc] = useState('');
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data && data.length > 0) {
      setProviders(data as ProviderProfile[]);
    } else {
      // Default initial mock if database table is fresh
      setProviders([
        { id: '1', business_name: 'Sibusiso Geyser & Plumbing Works', skill: 'Plumber', location: 'Umlazi' },
        { id: '2', business_name: 'Bhuti', skill: 'Electrician', location: 'Elandskop' }
      ]);
    }
    setLoading(false);
  };

  const openProviderProfile = async (provider: ProviderProfile) => {
    setInspectingProvider(provider);
    setRequestSubmitted(false);

    const [portRes, revRes] = await Promise.all([
      supabase.from('provider_portfolio').select('*').eq('provider_id', provider.id),
      supabase.from('customer_reviews').select('*').eq('provider_id', provider.id)
    ]);

    setPortfolioPhotos(portRes.data ? (portRes.data as PortfolioItem[]) : []);
    setReviews(revRes.data ? (revRes.data as ReviewItem[]) : []);
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !inspectingProvider) return;

    const { error } = await supabase.from('jobs').insert([
      {
        customer_name: `${customerName} · ${customerPhone}`,
        description: `Emergency: ${problemDesc}`,
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col justify-between">
      
      {/* Universal Desktop & Mobile Header (Matches Page 1 & 9) */}
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

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
          <Link href="/" className="text-indigo-700 font-bold hover:text-indigo-800">Find help</Link>
          <Link href="/customer" className="hover:text-slate-900">My jobs</Link>
          <Link href="/dashboard" className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-sm">
            Provider dashboard
          </Link>
        </div>

        {/* Mobile Header Link */}
        <div className="md:hidden">
          <Link href="/login" className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl">
            Provider
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-10 flex-1">
        
        {!inspectingProvider ? (
          <div>
            {/* Hero Search Banner (Matches Page 1 on Mobile & Page 9 on Desktop) */}
            <div className="bg-indigo-700 rounded-3xl p-6 sm:p-10 text-white shadow-xl shadow-indigo-900/10 mb-8 sm:mb-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
                
                {/* Left Text Block */}
                <div className="lg:col-span-7">
                  <span className="bg-amber-400 text-amber-950 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wide inline-block mb-3">
                    South Africa emergency network
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-snug sm:leading-tight mb-2 sm:mb-3">
                    Fast, verified help when things break.
                  </h2>
                  <p className="text-indigo-100/90 text-xs sm:text-sm font-medium leading-relaxed max-w-lg">
                    ID-verified plumbers, electricians and mechanics in your township.
                  </p>
                </div>

                {/* Right Input / Filter Controls */}
                <div className="lg:col-span-5 space-y-3">
                  <input 
                    type="text" 
                    placeholder="Township or area, e.g. Umlazi"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="w-full bg-white text-slate-900 placeholder:text-slate-400 rounded-2xl px-4 py-3.5 text-xs sm:text-sm font-medium focus:outline-none shadow-sm"
                  />
                  <select 
                    value={selectedSkill}
                    onChange={(e) => setSelectedSkill(e.target.value)}
                    className="w-full bg-white text-slate-900 rounded-2xl px-4 py-3.5 text-xs sm:text-sm font-medium focus:outline-none shadow-sm cursor-pointer"
                  >
                    <option value="All">All trades</option>
                    <option value="Plumber">Plumber (geysers, leaks)</option>
                    <option value="Electrician">Electrician (wiring, trips)</option>
                  </select>
                  
                  {/* Desktop 'Find experts' Button from Page 9 */}
                  <button className="w-full hidden sm:block bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm py-3.5 rounded-2xl transition-all shadow-md">
                    Find experts
                  </button>
                </div>

              </div>
            </div>

            {/* Available Experts Heading with Counter */}
            <div className="flex justify-between items-center mb-4 px-1">
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">Available experts</h3>
              <span className="text-xs font-bold bg-indigo-50 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center">
                {filteredProviders.length}
              </span>
            </div>

            {/* Providers Grid (1 Col Mobile, 2 Col Desktop) */}
            {loading ? (
              <div className="text-center py-16 text-xs text-slate-400">Loading verified experts...</div>
            ) : filteredProviders.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center text-xs text-slate-400 border border-slate-200">
                No experts found matching your search.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {filteredProviders.map((provider) => (
                  <div key={provider.id} className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 bg-indigo-50 text-indigo-700 font-black rounded-2xl flex items-center justify-center text-base shrink-0">
                        {provider.business_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug truncate">
                          {provider.business_name}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {provider.skill} · {provider.location}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-1">
                      <span className="text-[11px] font-extrabold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-100/60">
                        Verified Escrow Pro
                      </span>
                      <span className="text-xs font-black text-amber-700">
                        {provider.skill === 'Plumber' ? '4.9' : '4.8'} <span className="text-slate-400 font-medium text-[11px]">rating</span>
                      </span>
                    </div>

                    <button 
                      onClick={() => openProviderProfile(provider)}
                      className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs sm:text-sm py-3.5 rounded-2xl transition-all shadow-md shadow-indigo-900/10 cursor-pointer"
                    >
                      View profile and work gallery
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Profile & Inspection Modal View (Responsive) */
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl max-w-2xl mx-auto">
            <button 
              onClick={() => setInspectingProvider(null)}
              className="text-xs font-bold text-indigo-700 mb-6 inline-block cursor-pointer hover:underline"
            >
              ← Back to available experts
            </button>

            <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">{inspectingProvider.business_name}</h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">{inspectingProvider.skill} · {inspectingProvider.location}</p>
              </div>
              <span className="text-xs font-extrabold bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-200/80">
                ⭐ 4.9 rating
              </span>
            </div>

            {/* Work Gallery */}
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">Work gallery</h3>
            {portfolioPhotos.length === 0 ? (
              <div className="bg-slate-50 p-6 rounded-2xl text-center text-xs text-slate-400 mb-6 border border-slate-200">
                No work photos uploaded yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {portfolioPhotos.map((photo) => (
                  <div key={photo.id} className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                    <img src={photo.media_url} alt={photo.caption} className="w-full h-28 object-cover" />
                    <p className="p-2 text-[10px] font-semibold text-slate-700 truncate">{photo.caption}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Customer Reviews */}
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">Customer reviews</h3>
            {reviews.length === 0 ? (
              <p className="text-xs text-slate-400 mb-6">No customer reviews yet.</p>
            ) : (
              <div className="space-y-3 mb-6">
                {reviews.map((rev) => (
                  <div key={rev.id} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <div className="flex justify-between items-center mb-1">
                      <strong className="text-xs font-bold text-slate-900">{rev.customer_name}</strong>
                      <span className="text-amber-500 text-xs">{'⭐'.repeat(rev.rating)}</span>
                    </div>
                    <p className="text-xs text-slate-600">"{rev.comment}"</p>
                  </div>
                ))}
              </div>
            )}

            {/* Emergency Booking Box */}
            <div className="bg-slate-50 p-5 sm:p-6 rounded-3xl border border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">Dispatch emergency request</h3>
              {!requestSubmitted ? (
                <form onSubmit={handleBooking} className="space-y-3.5">
                  <input 
                    type="text" 
                    placeholder="Your name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none"
                  />
                  <input 
                    type="tel" 
                    placeholder="Phone number, e.g. 082 223 333"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none"
                  />
                  <textarea 
                    rows={3}
                    placeholder="Describe emergency fault, e.g. burst geyser"
                    value={problemDesc}
                    onChange={(e) => setProblemDesc(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none"
                  />
                  <button 
                    type="submit"
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm py-3.5 rounded-2xl shadow-md transition-all cursor-pointer"
                  >
                    Confirm emergency request 🚀
                  </button>
                </form>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm font-bold text-emerald-800 mb-2">Request dispatched successfully!</p>
                  <button 
                    onClick={() => { setInspectingProvider(null); setRequestSubmitted(false); }}
                    className="bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer"
                  >
                    Back to experts
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* Mobile-Only Bottom Tab Navigation (Matches Page 1) */}
      <div className="md:hidden sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-8 py-3.5 flex justify-between items-center text-xs font-bold text-slate-400 z-50">
        <Link href="/" className="text-indigo-700 font-black flex flex-col items-center gap-0.5">
          <span>Find help</span>
        </Link>
        <Link href="/customer" className="hover:text-slate-700 flex flex-col items-center gap-0.5">
          <span>Jobs</span>
        </Link>
        <Link href="/login" className="hover:text-slate-700 flex flex-col items-center gap-0.5">
          <span>Profile</span>
        </Link>
      </div>

    </div>
  );
}