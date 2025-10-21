'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE = 'https://migrantifly-backend.onrender.com/api';

export default function ConsultationSuccessPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const sessionId = searchParams.get('session_id') || '';
    const consultationId = searchParams.get('consultationId') || '';

    const [status, setStatus] = useState('verifying'); // verifying | success | error
    const [error, setError] = useState('');
    const [receipt, setReceipt] = useState(null); // { email, amount, currency, sessionId, consultationId }

    const hasParams = useMemo(() => !!sessionId && !!consultationId, [sessionId, consultationId]);

    useEffect(() => {
        if (!hasParams) {
            setStatus('error');
            setError('Missing session information. Please contact support if this persists.');
            return;
        }

        let cancelled = false;

        async function verifyAndConfirm() {
            try {
                // 1) Verify the Checkout Session with your backend
                // Expecting a response like:
                // { data: { paid: true, email: '...', amount: 5000, currency: 'usd' } }
                const verifyRes = await fetch(`${API_BASE}/payments/verify-checkout-session`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId }),
                    cache: 'no-store',
                });
                const verifyJson = await verifyRes.json();

                if (!verifyRes.ok) {
                    throw new Error(verifyJson?.message || 'Failed to verify payment.');
                }

                const paid = verifyJson?.data?.paid ?? false;
                const email = verifyJson?.data?.email || '';
                const amount = verifyJson?.data?.amount ?? null; // in smallest currency unit
                const currency = verifyJson?.data?.currency || '';

                if (!paid) {
                    throw new Error('Payment is not completed. If you were charged, please contact support.');
                }

                // 2) Confirm the booking
                // Adjust body fields to match your backend (e.g., { email } or { sessionId }).
                const confirmRes = await fetch(
                    `${API_BASE}/consultation/${encodeURIComponent(consultationId)}/confirm-booking`,
                    {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email }), // or { sessionId } depending on your API
                    }
                );
                const confirmJson = await confirmRes.json();

                if (!confirmRes.ok) {
                    throw new Error(confirmJson?.message || 'Failed to confirm booking.');
                }

                if (!cancelled) {
                    setReceipt({
                        email,
                        amount,
                        currency,
                        sessionId,
                        consultationId,
                    });
                    setStatus('success');
                }
            } catch (e) {
                if (!cancelled) {
                    setError(e?.message || 'Something went wrong finalizing your booking.');
                    setStatus('error');
                }
            }
        }

        verifyAndConfirm();

        return () => {
            cancelled = true;
        };
    }, [hasParams, sessionId, consultationId]);

    const formatAmount = (amount, currency) => {
        if (amount == null) return null;
        try {
            // Stripe amounts are typically in the smallest unit
            const decimals = ['jpy', 'krw'].includes(String(currency).toLowerCase()) ? 0 : 2;
            const value = amount / Math.pow(10, decimals);
            return new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency: currency || 'USD',
            }).format(value);
        } catch {
            return amount;
        }
    };

    return (
        <main className="min-h-[70vh] flex items-center justify-center px-6 py-16 bg-slate-50">
            <div className="w-full max-w-xl bg-white shadow-lg rounded-2xl p-8 border border-slate-200">
                {status === 'verifying' && (
                    <div className="text-center">
                        <div className="mx-auto mb-6 h-12 w-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
                        <h1 className="text-2xl font-semibold text-slate-800">Finalizing your booking…</h1>
                        <p className="mt-2 text-slate-500">
                            We’re verifying your payment and confirming your consultation.
                        </p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="text-center">
                        <div className="mx-auto mb-6 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-green-700 text-2xl">✓</span>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Booking confirmed!</h1>
                        <p className="mt-2 text-slate-600">
                            Thank you. A confirmation email has been sent{receipt?.email ? ` to ${receipt.email}` : ''}.
                        </p>

                        <div className="mt-6 rounded-lg bg-slate-50 border border-slate-200 text-left p-4">
                            <dl className="grid grid-cols-1 gap-3">
                                <div className="flex justify-between">
                                    <dt className="text-slate-500">Consultation ID</dt>
                                    <dd className="font-mono text-slate-800">
                                        {receipt?.consultationId?.slice(-8) || '—'}
                                    </dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-slate-500">Session</dt>
                                    <dd className="font-mono text-slate-800">
                                        {receipt?.sessionId?.slice(0, 12)}…
                                    </dd>
                                </div>
                                {receipt?.amount != null && (
                                    <div className="flex justify-between">
                                        <dt className="text-slate-500">Amount</dt>
                                        <dd className="text-slate-800">
                                            {formatAmount(receipt.amount, receipt.currency)}
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </div>

                        <div className="mt-8 flex gap-3 justify-center">
                            <Link
                                href="/"
                                className="px-5 py-2.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800"
                            >
                                Go to Home
                            </Link>
                            <button
                                onClick={() => router.refresh()}
                                className="px-5 py-2.5 rounded-lg border font-semibold border-slate-300 text-slate-700 hover:bg-slate-100"
                            >
                                Refresh
                            </button>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-center">
                        <div className="mx-auto mb-6 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                            <span className="text-red-700 text-2xl">!</span>
                        </div>
                        <h1 className="text-2xl font-semibold text-slate-900">We couldn’t confirm your booking</h1>
                        <p className="mt-2 text-slate-600">{error}</p>

                        <div className="mt-8 flex gap-3 justify-center">
                            <Link
                                href="/"
                                className="px-5 py-2.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800"
                            >
                                Go to Home
                            </Link>
                            <button
                                onClick={() => router.replace('/contact')}
                                className="px-5 py-2.5 rounded-lg border font-semibold border-slate-300 text-slate-700 hover:bg-slate-100"
                            >
                                Contact Support
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}