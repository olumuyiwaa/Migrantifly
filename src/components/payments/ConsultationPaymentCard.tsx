'use client';

import { useState } from 'react';
import { paymentsApi, ApiError, getStoredUser } from '@/lib/api';
import { getStripe } from '@/lib/stripe';

export function ConsultationPaymentCard({
                                            consultationId,
                                            paymentId,
                                            email,
                                            amount = 150,
                                            onPaid,
                                        }: {
    consultationId: string;
    paymentId?: string | null;
    email?: string;
    amount?: number;
    onPaid?: () => void;
}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePay = async () => {
        setLoading(true);
        setError(null);

        try {
            if (!paymentId) {
                setError('No payment record found for this consultation.');
                setLoading(false);
                return;
            }

            const user = getStoredUser();
            const payEmail = email || user?.email || '';

            if (!payEmail) {
                setError('Email is required to start payment.');
                setLoading(false);
                return;
            }

            const res = await paymentsApi.createConsultationPayment({
                consultationId,
                paymentId: String(paymentId),
                amount,
                email: payEmail,
            });

            // Support both { data: { ... } } and flat shapes
            const data = (res as any)?.data ?? res;
            const sessionId = data?.sessionId;
            const url = data?.url;

            if (url) {
                window.location.href = url;
                return;
            }

            if (sessionId) {
                const stripe = await getStripe();
                if (!stripe) throw new Error('Stripe failed to load');
                const { error: stripeError } = await stripe.redirectToCheckout({
                    sessionId,
                });
                if (stripeError) throw new Error(stripeError.message);
                return;
            }

            throw new Error('No checkout session returned');
        } catch (err) {
            const message =
                err instanceof ApiError
                    ? err.message
                    : err instanceof Error
                        ? err.message
                        : 'Failed to start payment';
            setError(message);
            setLoading(false);
        }
    };

    return (
        <div className="rounded-xl border border-warning-200 bg-warning-50 px-4 py-4 dark:border-warning-500/30 dark:bg-warning-500/10">
            <p className="text-sm font-medium text-warning-800 dark:text-warning-300">
                Payment required
            </p>
            <p className="mt-1 text-theme-sm text-warning-700 dark:text-warning-400">
                Pay the consultation fee ({amount} USD) to confirm this booking.
            </p>
            {error && (
                <p className="mt-2 text-sm text-error-600 dark:text-error-400">{error}</p>
            )}
            <button
                type="button"
                onClick={handlePay}
                disabled={loading || !paymentId}
                className="mt-3 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
                {loading ? 'Redirecting to Stripe…' : `Pay ${amount} USD`}
            </button>
        </div>
    );
}