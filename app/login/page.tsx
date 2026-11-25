'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function DocumentVerificationGateway() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [skill, setSkill] = useState('Plumber');
  const [location, setLocation] = useState('');
  const [saIdNumber, setSaIdNumber] = useState('');
  const [voucherReference, setVoucherReference] = useState('');
  const [userRole, setUserRole] = useState<'provider' | 'customer'>('provider');
  
  // Document Upload States
  const [idDocumentFile, setIdDocumentFile] = useState<File | null>(null);
  const [workProofFile, setWorkProofFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  // SA ID Luhn & Date Validation Algorithm
  const validateSAID = (idNumber: string) => {
    if (idNumber.length !== 13 || isNaN(Number(idNumber))) return false;
    const mm = parseInt(idNumber.substring(2, 4), 10);
    const dd = parseInt(idNumber.substring(4, 6), 10);
    if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return false;

    let sum = 0;
    let doubleFlag = false;
    for (let i = idNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(idNumber.charAt(i), 10);
      if (doubleFlag) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      doubleFlag = !doubleFlag;
    }
    return sum % 10 === 0;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    if (isSignUp && userRole === 'provider') {
      if (!validateSAID(saIdNumber)) {
        setErrorMessage('KYC Error: Invalid South African ID number structure or failed Luhn checksum.');
        setLoading(false);
        return;
      }
      if (!idDocumentFile) {
        setErrorMessage('Verification Error: Please upload a photo/scan of your SA ID Document.');
        setLoading(false);
        return;
      }
      if (!workProofFile) {
        setErrorMessage('Verification Error: Please upload at least one photo of past work (e.g. fixed geyser).');
        setLoading(false);
        return;
      }
    }

    if (isSignUp) {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) {
        setErrorMessage(authError.message);
        setLoading(false);
        return;
      }

      if (authData.user) {
        // Upload ID Document to Supabase Storage
        let idDocPath = null;
        if (idDocumentFile) {
          const fileExt = idDocumentFile.name.split('.').pop();
          const fileName = `${authData.user.id}-id-doc.${fileExt}`;
          const { error: uploadErr } = await supabase.storage.from('provider-kyc').upload(fileName, idDocumentFile, { upsert: true });
          if (!uploadErr) idDocPath = fileName;
        }

        // Upload Work Proof Document to Supabase Storage
        let workProofPath = null;
        if (workProofFile) {
          const fileExt = workProofFile.name.split('.').pop();
          const fileName = `${authData.user.id}-work-proof.${fileExt}`;
          const { error: uploadErr } = await supabase.storage.from('provider-kyc').upload(fileName, workProofFile, { upsert: true });
          if (!uploadErr) workProofPath = fileName;
        }

        // Save role and KYC metadata
        const rolePayload = {
          id: authData.user.id,
          role: userRole,
          business_name: userRole === 'provider' ? businessName : 'Customer Account',
          skill: userRole === 'provider' ? skill : 'Customer',
          location: userRole === 'provider' ? location : 'General',
          sa_id_number: userRole === 'provider' ? saIdNumber : null,
          voucher_reference: userRole === 'provider' ? voucherReference : null,
          verification_status: 'Documents Pending Admin Review',
        };

        await supabase.from('user_roles').insert([rolePayload]);

        if (userRole === 'provider') {
          await supabase.from('profiles').insert([
            {
              business_name: businessName,
              skill: skill,
              location: location,
              verification_status: 'Documents Pending Admin Review',
            }
          ]);
        }

        alert('Registration complete! ID documents and proof of work uploaded securely.');
        setIsSignUp(false);
      }
    } else {
      const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setErrorMessage(error.message);
      } else if (authData.user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('id', authData.user.id)
          .single();

        if (roleData?.role === 'provider') {
          router.push('/dashboard');
        } else {
          router.push('/');
        }
      }
    }
    setLoading(false);
  };

  return (
    <main style={{ padding: '36px', fontFamily: '-apple-system, sans-serif', maxWidth: '480px', margin: '30px auto', backgroundColor: '#FFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <span style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', fontSize: '11px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '20px', textTransform: 'uppercase' }}>
          Thola Enterprise Trust & KYC
        </span>
        <h1 style={{ color: '#0F172A', fontSize: '20px', margin: '8px 0 4px 0', fontWeight: 'bold' }}>
          {isSignUp ? 'Professional Document Onboarding' : 'Secure Enterprise Sign In'}
        </h1>
        <p style={{ color: '#64748B', fontSize: '13px', margin: 0 }}>
          {isSignUp ? 'Upload SA ID Document & Proof of Past Work' : 'Access your professional node'}
        </p>
      </div>

      {errorMessage && (
        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '10px', borderRadius: '6px', fontSize: '12px', marginBottom: '14px' }}>
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {isSignUp && (
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>Account Type:</label>
            <select 
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as 'provider' | 'customer')}
              style={{ width: '100%', padding: '10px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px', backgroundColor: '#FFF', boxSizing: 'border-box' }}
            >
              <option value="provider">Skilled Professional (Plumber/Electrician)</option>
              <option value="customer">Customer (Looking for Help)</option>
            </select>
          </div>
        )}

        {isSignUp && userRole === 'provider' && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>Business Name</label>
              <input 
                type="text" 
                placeholder="e.g. Sibu Plumbing"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>Trade</label>
              <select 
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px', backgroundColor: '#FFF', boxSizing: 'border-box' }}
              >
                <option value="Plumber">Plumber (Geysers, Leaks)</option>
                <option value="Electrician">Electrician (Wiring)</option>
                <option value="Mobile Mechanic">Mobile Mechanic</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>Service Area / Township</label>
              <input 
                type="text" 
                placeholder="e.g. Umlazi"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#0F172A' }}>
                🇿🇦 SA ID Number (13 Digits)
              </label>
              <input 
                type="text" 
                placeholder="Validated via Luhn algorithm"
                maxLength={13}
                value={saIdNumber}
                onChange={(e) => setSaIdNumber(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px', backgroundColor: '#FFF', boxSizing: 'border-box' }}
              />
            </div>

            {/* Document Upload Fields */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#0F172A' }}>
                  📄 Upload SA ID Document (Photo or Scan)
                </label>
                <input 
                  type="file" 
                  accept="image/*,.pdf"
                  onChange={(e) => e.target.files && setIdDocumentFile(e.target.files[0])}
                  required
                  style={{ fontSize: '13px', width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#0F172A' }}>
                  🛠️ Upload Proof of Past Work (e.g. Fixed Geyser Photo)
                </label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => e.target.files && setWorkProofFile(e.target.files[0])}
                  required
                  style={{ fontSize: '13px', width: '100%' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>Local Reference Name & Phone</label>
              <input 
                type="text" 
                placeholder="e.g. Mr Dlamini - 082 555 1234"
                value={voucherReference}
                onChange={(e) => setVoucherReference(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
          </>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>Email Address</label>
          <input 
            type="email" 
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>Password</label>
          <input 
            type="password" 
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>

        <button 
          type="submit"
          disabled={loading}
          style={{ backgroundColor: '#2563EB', color: 'white', padding: '14px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', marginTop: '4px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}
        >
          {loading ? 'Uploading Documents to Secure Cloud...' : isSignUp ? 'Submit Verified Profile' : 'Sign In'}
        </button>

      </form>

      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <button 
          onClick={() => setIsSignUp(!isSignUp)}
          style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Register"}
        </button>
      </div>

    </main>
  );
}