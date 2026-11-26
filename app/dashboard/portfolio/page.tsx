'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface PortfolioItem {
  id: string;
  media_url: string;
  file_path: string; // Store exact path for reliable deletion
  caption: string;
}

export default function EnterprisePortfolioManagerProduction() {
  const [mediaList, setMediaList] = useState<PortfolioItem[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkUserAndFetchPortfolio();
  }, []);

  const checkUserAndFetchPortfolio = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setUserId(session.user.id);

    const { data } = await supabase
      .from('provider_portfolio')
      .select('*')
      .eq('provider_id', session.user.id)
      .order('created_at', { ascending: false });

    if (data) setMediaList(data as PortfolioItem[]);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !userId) return;
    setUploading(true);

    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}-${Date.now()}.${fileExt}`; // Exact file path in bucket
    
    // 1. Upload file to Supabase Storage using the exact path
    const { error: uploadError } = await supabase.storage
      .from('portfolio-media')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      alert(`Upload failed: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('portfolio-media')
      .getPublicUrl(filePath);

    // 3. Save both public URL AND the exact file path to the database
    const { error: dbError } = await supabase.from('provider_portfolio').insert([
      {
        provider_id: userId,
        media_url: publicUrl,
        file_path: filePath, // Stored explicitly!
        caption: caption || 'Completed Work Showcase',
      }
    ]);

    if (dbError) {
      alert(`Database error: ${dbError.message}`);
    } else {
      setCaption('');
      setFile(null);
      checkUserAndFetchPortfolio();
    }
    setUploading(false);
  };

  // Bulletproof Deletion: Uses the explicitly stored file path
  const handleDelete = async (id: string, filePath: string) => {
    if (!confirm('Permanently delete this photo from cloud storage and database?')) return;

    try {
      // 1. Delete physical file from Supabase storage using the exact path
      const targetPath = filePath || mediaList.find(m => m.id === id)?.file_path;
      
      if (targetPath) {
        const { error: storageError } = await supabase.storage
          .from('portfolio-media')
          .remove([targetPath]);

        if (storageError) {
          console.error('Storage deletion warning:', storageError.message);
        }
      }

      // 2. Delete database record
      const { error: dbError } = await supabase
        .from('provider_portfolio')
        .delete()
        .eq('id', id);

      if (dbError) {
        alert(`Database error: ${dbError.message}`);
        return;
      }

      // 3. Update local UI state instantly
      setMediaList(mediaList.filter(item => item.id !== id));
      alert('Photo deleted permanently from storage and database! 🗑️');

    } catch (err: any) {
      alert(`Deletion error: ${err.message}`);
    }
  };

  return (
    <main style={{ padding: '40px', fontFamily: '-apple-system, sans-serif', maxWidth: '850px', margin: '0 auto', backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
        <div>
          <span style={{ backgroundColor: '#DBEAFE', color: '#1D4ED8', fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px' }}>
            Thola Trust Engine 📸
          </span>
          <h1 style={{ color: '#0F172A', margin: '8px 0 0 0', fontSize: '24px', fontWeight: 'bold' }}>Manage Work Gallery & Showcase</h1>
        </div>
        <div>
          <Link href="/dashboard" style={{ fontSize: '13px', color: '#2563EB', textDecoration: 'none', fontWeight: 'bold', background: '#FFF', border: '1px solid #CBD5E1', padding: '8px 14px', borderRadius: '6px' }}>
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Upload Card */}
      <div style={{ backgroundColor: '#FFF', padding: '28px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '32px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#0F172A', fontWeight: 'bold' }}>Add New Work Photo</h3>
        <p style={{ color: '#64748B', fontSize: '13px', marginBottom: '20px' }}>Upload clear photos of completed geysers, wiring, or installations to build customer trust.</p>
        
        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '16px', alignItems: 'center' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#334155' }}>Select Image</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => e.target.files && setFile(e.target.files[0])}
                required
                style={{ fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#334155' }}>Caption / Title</label>
              <input 
                type="text" 
                placeholder="e.g. 150L Kwikot Geyser Replacement"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={uploading}
            style={{ backgroundColor: '#2563EB', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', marginTop: '6px' }}
          >
            {uploading ? 'Uploading to Public Cloud...' : 'Publish Photo to Profile Showcase 🚀'}
          </button>
        </form>
      </div>

      {/* Gallery Grid */}
      <h3 style={{ fontSize: '18px', color: '#1E293B', marginBottom: '16px', fontWeight: 'bold' }}>Active Showcase Portfolio ({mediaList.length})</h3>
      
      {mediaList.length === 0 ? (
        <div style={{ backgroundColor: '#FFF', padding: '40px', borderRadius: '12px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
          <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>Your portfolio is currently empty. Upload your first work photo above!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          {mediaList.map((item) => (
            <div key={item.id} style={{ backgroundColor: '#FFF', borderRadius: '10px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <img src={item.media_url} alt={item.caption} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                <div style={{ padding: '12px' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#0F172A', fontWeight: 'bold', lineHeight: '1.4' }}>{item.caption}</p>
                </div>
              </div>
              <div style={{ padding: '0 12px 12px 12px' }}>
                <button 
                  onClick={() => handleDelete(item.id, item.file_path)}
                  style={{ width: '100%', backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Delete Photo 🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </main>
  );
}