'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  branch_code: string;
  account_holder: string;
  account_type: string;
}

export default function ProviderBankSettings() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states for linking new bank account
  const [bankName, setBankName] = useState('Capitec Bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [branchCode, setBranchCode] = useState('470010');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountType, setAccountType] = useState('Savings');
  const [successMsg, setSuccessMsg] = useState('');

  const router = useRouter();

  useEffect(() => {
    fetchBankDetails();
  }, []);

  const fetchBankDetails = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    const { data, error } = await supabase
      .from('provider_bank_accounts')
      .select('*')
      .eq('provider_id', session.user.id);

    if (data) setBankAccounts(data as BankAccount[]);
    setLoading(false);
  };

  const handleLinkBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    if (accountNumber.length < 7) {
      alert('Please enter a valid South African bank account number.');
      return;
    }

    const { error } = await supabase.from('provider_bank_accounts').insert([
      {
        provider_id: session.user.id,
        bank_name: bankName,
        account_number: accountNumber,
        branch_code: branchCode,
        account_holder: accountHolder,
        account_type: accountType,
      }
    ]);

    if (error) {
      alert(`Error linking bank: ${error.message}`);
    } else {
      setSuccessMsg('Bank account linked successfully for real-world payouts! 🏦');
      setAccountNumber('');
      setAccountHolder('');
      fetchBankDetails();
    }
  };

  return (
    <main style={{ padding: '40px', fontFamily: '-apple-system, sans-serif', maxWidth: '750px', margin: '0 auto', backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
        <div>
          <span style={{ backgroundColor: '#DCFCE7', color: '#166534', fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px' }}>
            Thola FICA Payout Gateway 💸
          </span>
          <h1 style={{ color: '#0F172A', margin: '8px 0 0 0', fontSize: '24px', fontWeight: 'bold' }}>Linked Bank Accounts</h1>
        </div>
        <div>
          <Link href="/dashboard" style={{ fontSize: '13px', color: '#2563EB', textDecoration: 'none', fontWeight: 'bold', background: '#FFF', border: '1px solid #CBD5E1', padding: '8px 14px', borderRadius: '6px' }}>
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {successMsg && (
        <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534', padding: '12px', borderRadius: '8px', fontSize: '14px', marginBottom: '20px', fontWeight: 'bold' }}>
          {successMsg}
        </div>
      )}

      {/* Linked Accounts List */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', color: '#1E293B', marginBottom: '12px', fontWeight: 'bold' }}>Active Payout Destinations</h3>
        {loading ? (
          <p style={{ color: '#64748B', fontSize: '14px' }}>Loading bank profiles...</p>
        ) : bankAccounts.length === 0 ? (
          <div style={{ backgroundColor: '#FFF', padding: '24px', borderRadius: '12px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
            <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>No bank account linked yet. Add one below to receive automated payouts.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {bankAccounts.map((acc) => (
              <div key={acc.id} style={{ backgroundColor: '#FFF', padding: '20px', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#0F172A', fontWeight: 'bold' }}>{acc.bank_name} ({acc.account_type})</h4>
                  <p style={{ margin: 0, fontSize: '14px', color: '#475569' }}>Holder: {acc.account_holder} | Acc: *****{acc.account_number.slice(-4)}</p>
                </div>
                <span style={{ backgroundColor: '#DCFCE7', color: '#166534', fontSize: '12px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '20px' }}>
                  Primary Payout Account ✓
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Link New Bank Form */}
      <div style={{ backgroundColor: '#FFF', padding: '28px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#0F172A', fontWeight: 'bold' }}>Link South African Bank Account</h3>
        <p style={{ color: '#64748B', fontSize: '13px', marginBottom: '20px' }}>Funds from completed FixPay escrow jobs clear directly into this account via real-time clearing (RTC).</p>

        <form onSubmit={handleLinkBank} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>Select Bank</label>
              <select 
                value={bankName}
                onChange={(e) => {
                  setBankName(e.target.value);
                  if (e.target.value.includes('Capitec')) setBranchCode('470010');
                  else if (e.target.value.includes('FNB')) setBranchCode('250655');
                  else if (e.target.value.includes('Standard')) setBranchCode('051001');
                  else if (e.target.value.includes('Absa')) setBranchCode('632005');
                  else setBranchCode('200000');
                }}
                style={{ width: '100%', padding: '10px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '14px', backgroundColor: '#FFF', boxSizing: 'border-box' }}
              >
                <option value="Capitec Bank">Capitec Bank</option>
                <option value="First National Bank (FNB)">First National Bank (FNB)</option>
                <option value="Standard Bank">Standard Bank</option>
                <option value="Absa Bank">Absa Bank</option>
                <option value="Nedbank">Nedbank</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>Account Type</label>
              <select 
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '14px', backgroundColor: '#FFF', boxSizing: 'border-box' }}
              >
                <option value="Savings">Savings Account</option>
                <option value="Cheque">Cheque / Current Account</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>Account Holder Full Name (Must match SA ID)</label>
            <input 
              type="text" 
              placeholder="e.g. Sibusiso Mthethwa"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>Bank Account Number</label>
              <input 
                type="text" 
                placeholder="Enter account number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>Branch Code</label>
              <input 
                type="text" 
                value={branchCode}
                onChange={(e) => setBranchCode(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '14px', backgroundColor: '#F1F5F9', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <button 
            type="submit"
            style={{ backgroundColor: '#16A34A', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', marginTop: '6px' }}
          >
            Verify & Link Bank Account for Payouts 🏦
          </button>

        </form>
      </div>

    </main>
  );
}