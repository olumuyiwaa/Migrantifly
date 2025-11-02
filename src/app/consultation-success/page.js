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
    const applicationId = searchParams.get('applicationId') || '';

    const [status, setStatus] = useState('verifying'); // verifying | success | error
    const [error, setError] = useState('');
    const [receipt, setReceipt] = useState(null); // { email, amount, currency, sessionId, consultationId?, applicationId?, invoiceUrl? }

    const isApplicationDeposit = useMemo(
        () => Boolean(applicationId) && !Boolean(consultationId),
        [applicationId, consultationId]
    );

    const hasParams = useMemo(
        () => Boolean(sessionId && (consultationId || applicationId)),
        [sessionId, consultationId, applicationId]
    );

    useEffect(() => {
        if (!hasParams) {
            setStatus('error');
            setError('Missing session information. Please contact support if this persists.');
            return;
        }

        let cancelled = false;

        const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

        async function verifyWithRetries() {
            const maxAttempts = 6;       // ~5 seconds total
            const delayMs = 800;

            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                    const res = await fetch(`${API_BASE}/payments/verify-checkout-session`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sessionId }),
                        cache: 'no-store',
                    });

                    const json = await res.json();
                    if (!res.ok) {
                        throw new Error(json?.message || 'Failed to verify payment.');
                    }

                    const data = json?.data || {};
                    const paid = Boolean(data.paid);
                    const email = data.email || '';
                    const amount = data.amount ?? null;       // smallest unit
                    const currency = data.currency || 'usd';
                    const metaIdFromSession = data.consultationId || null; // backend may return consultationId OR applicationId here
                    const invoiceUrl = data.invoiceUrl || null;

                    // Validate that session metadata matches the URL to avoid mismatches
                    if (metaIdFromSession) {
                        if (!isApplicationDeposit && consultationId && metaIdFromSession !== consultationId) {
                            throw new Error('Consultation mismatch. Please contact support with your receipt.');
                        }
                        if (isApplicationDeposit && applicationId && metaIdFromSession !== applicationId) {
                            throw new Error('Application mismatch. Please contact support with your receipt.');
                        }
                    }

                    if (!paid) {
                        // Not yet marked paid; allow webhook time to complete
                        if (attempt < maxAttempts) {
                            await sleep(delayMs);
                            continue;
                        }
                        throw new Error('Payment not completed yet. If you were charged, please contact support.');
                    }

                    if (!cancelled) {
                        setReceipt({
                            email,
                            amount,
                            currency,
                            sessionId,
                            consultationId: !isApplicationDeposit ? consultationId : null,
                            applicationId: isApplicationDeposit ? applicationId : null,
                            invoiceUrl,
                        });
                        setStatus('success');

                        // For consultation payments, confirm booking after payment.
                        if (!isApplicationDeposit && consultationId && email) {
                            await confirmBookingAfterPayment(consultationId, email);
                        }
                    }
                    return;
                } catch (e) {
                    if (attempt < maxAttempts) {
                        await sleep(delayMs);
                        continue;
                    }
                    if (!cancelled) {
                        setError(e?.message || 'Something went wrong verifying your payment.');
                        setStatus('error');
                    }
                }
            }
        }

        verifyWithRetries();

        return () => {
            cancelled = true;
        };
    }, [hasParams, sessionId, consultationId, applicationId, isApplicationDeposit]);

    const confirmBookingAfterPayment = async (consultationId, email) => {
        try {
            const res = await fetch(`${API_BASE}/consultation/${consultationId}/confirm-booking`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to confirm booking");
            }

            return data.data;
        } catch (err) {
            console.error("Error confirming booking:", err);
            throw err;
        }
    };

    const formatAmount = (amount, currency) => {
        if (amount == null) return null;
        try {
            const code = String(currency || 'USD').toUpperCase();
            const zeroDecimal = [
                'BIF','CLP','DJF','GNF','JPY','KMF','KRW','MGA','PYG','RWF','UGX','VND','VUV','XAF','XOF','XPF'
            ];
            const isZero = zeroDecimal.includes(code);
            const value = isZero ? amount : amount / 100;
            return new Intl.NumberFormat(undefined, { style: 'currency', currency: code }).format(value);
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
                        <h1 className="text-2xl font-semibold text-slate-800">Finalizing your payment…</h1>
                        <p className="mt-2 text-slate-500">
                            We’re verifying your payment and updating your {isApplicationDeposit ? 'application' : 'consultation'}.
                        </p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="text-center">
                        <div className="mx-auto mb-6 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-green-700 text-2xl">✓</span>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            {receipt?.consultationId ? 'Booking confirmed!' : 'Payment successful!'}
                        </h1>
                        <p className="mt-2 text-slate-600">
                            Thank you. A confirmation email will arrive shortly
                            {receipt?.email ? ` at ${receipt.email}` : ''}.
                        </p>

                        <div className="mt-6 rounded-lg bg-slate-50 border border-slate-200 text-left p-4">
                            <dl className="grid grid-cols-1 gap-3">
                                {receipt?.consultationId && (
                                    <div className="flex justify-between">
                                        <dt className="text-slate-500">Consultation ID</dt>
                                        <dd className="font-mono text-slate-800">
                                            {receipt.consultationId.slice(-8)}
                                        </dd>
                                    </div>
                                )}

                                {receipt?.applicationId && (
                                    <div className="flex justify-between">
                                        <dt className="text-slate-500">Application ID</dt>
                                        <dd className="font-mono text-slate-800">
                                            {receipt.applicationId.slice(-8)}
                                        </dd>
                                    </div>
                                )}

                                <div className="flex justify-between">
                                    <dt className="text-slate-500">Session</dt>
                                    <dd className="font-mono text-slate-800">
                                        {receipt?.sessionId?.slice(0, 14)}…
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

                                {receipt?.invoiceUrl && (
                                    <div className="flex justify-between">
                                        <dt className="text-slate-500">Invoice</dt>
                                        <dd className="text-slate-800">
                                            <a
                                                href={receipt.invoiceUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-blue-600 hover:underline"
                                            >
                                                Download invoice
                                            </a>
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </div>

                        <div className="mt-8 flex gap-3 justify-center">
                            <Link
                                href="/portal"
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
                        <h1 className="text-2xl font-semibold text-slate-900">We couldn’t confirm your payment</h1>
                        <p className="mt-2 text-slate-600">{error}</p>

                        <div className="mt-8 flex gap-3 justify-center">
                            <Link
                                href="/portal"
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