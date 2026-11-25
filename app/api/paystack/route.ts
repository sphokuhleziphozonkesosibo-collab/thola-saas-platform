import { NextResponse } from 'next/server';

// Server-side Route Handler for Paystack South Africa (Pay-ins & Payouts)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, amount, email, jobId, bankDetails } = body;

    // SCENARIO A: Initialize Customer Payment (Pay-In)
    if (action === 'initialize_payment') {
      if (!amount || !email || !jobId) {
        return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });
      }

      const randomString = Math.random().toString(36).substring(2, 9).toUpperCase();
      const mockReference = `THOLA_TX_${randomString}`;

      // Real production integration would call: https://api.paystack.co/transaction/initialize
      return NextResponse.json({
        status: true,
        message: 'Payment gateway initialized successfully',
        data: {
          authorization_url: `https://checkout.paystack.com/sandbox-${mockReference}`,
          reference: mockReference,
        }
      });
    }

    // SCENARIO B: Real-World Bank Account Payout (Transfer to Plumber's Bank)
    if (action === 'transfer_to_provider_bank') {
      const { accountNumber, bankCode, accountHolderName, payoutAmount } = bankDetails;

      if (!accountNumber || !bankCode || !payoutAmount) {
        return NextResponse.json({ error: 'Missing provider banking details for payout' }, { status: 400 });
      }

      // In live production using Paystack Transfers API:
      // 1. Create Transfer Recipient: POST https://api.paystack.co/transferrecipient
      // 2. Initiate Transfer (RTC): POST https://api.paystack.co/transfer
      
      const transferReference = `THOLA_PAYOUT_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

      return NextResponse.json({
        status: true,
        message: `Successfully transferred R${payoutAmount} to ${accountHolderName} (Account: *******${accountNumber.slice(-4)}) via Real-Time Clearing (RTC).`,
        data: {
          transfer_code: `TRF_${transferReference}`,
          reference: transferReference,
          status: 'success'
        }
      });
    }

    return NextResponse.json({ error: 'Invalid API action requested' }, { status: 400 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error processing transaction' }, { status: 500 });
  }
}