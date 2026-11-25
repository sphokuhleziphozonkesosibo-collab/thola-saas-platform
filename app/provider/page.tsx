'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase'; // Import our cloud bridge

export default function ProviderPage() {
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');
  const [skill, setSkill] = useState('Electrician');
  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // This runs when Thabo clicks "Save Profile" and writes to the cloud database
  const handleSaveToCloud = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!businessName || !location) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    setLoading(true);

    try {
      // Real database write query to Supabase 'profiles' table
      const { error } = await supabase
        .from('profiles')
        .insert([
          { 
            business_name: businessName, 
            skill: skill, 
            location: location 
          }
        ]);

      if (error) {
        // If the table doesn't exist yet in Supabase, catch it gracefully
        console.error('Database Error:', error.message);
        setErrorMessage(`Cloud error: ${error.message}. Make sure your 'profiles' table is created in Supabase.`);
      } else {
        setIsSaved(true);
      }
    } catch (err: any) {
      setErrorMessage('An unexpected network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif', maxWidth: '400px', margin: '0 auto' }}>
      <h2 style={{ color: '#1E293B', marginBottom: '8px' }}>Thola: Cloud Provider Setup</h2>
      <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px' }}>
        Live sync with your Supabase PostgreSQL database.
      </p>

      {errorMessage && (
        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '12px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>
          {errorMessage}
        </div>
      )}

      {!isSaved ? (
        <form onSubmit={handleSaveToCloud} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
              Business Name
            </label>
            <input 
              type="text" 
              placeholder="e.g. Thabo Electrical"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '4px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
              Skill Category
            </label>
            <select 
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '4px', backgroundColor: '#FFF' }}
            >
              <option value="Electrician">Electrician</option>
              <option value="Plumber">Plumber</option>
              <option value="Mechanic">Mobile Mechanic</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
              Service Area / Township
            </label>
            <input 
              type="text" 
              placeholder="e.g. Umlazi"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '4px' }}
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            style={{ backgroundColor: '#2563EB', color: 'white', padding: '10px', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {loading ? 'Saving to Cloud Database...' : 'Save Profile to Cloud'}
          </button>
        </form>
      ) : (
        <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ color: '#166534', margin: '0 0 8px 0' }}>Saved to Cloud Database! 🚀</h3>
          <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Business:</strong> {businessName}</p>
          <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Skill:</strong> {skill}</p>
          <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Area:</strong> {location}</p>
          <button 
            onClick={() => setIsSaved(false)}
            style={{ marginTop: '12px', background: 'none', border: 'none', color: '#2563EB', cursor: 'pointer', padding: 0 }}
          >
            Add Another Profile
          </button>
        </div>
      )}
    </div>
  );
}