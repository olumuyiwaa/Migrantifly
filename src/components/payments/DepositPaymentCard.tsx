'use client';

import { useState } from 'react';
import { paymentsApi, ApiError } from '@/lib/api';
import { getStripe } from '@/lib/stripe';

export function DepositPaymentCard({
                                       applicationId,
                                       amount = 500,
                                       onPaid,
                                   }: {
    applicationId: string;
    amount?: number;
    onPaid?: () => void;

}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const startPayment = async () => {
        setLoading(true);
        setError(null);

        try {
            // Backend requires amount === 500
            const res = await paymentsApi.createDepositCheckout({
                applicationId,
                amount: 500,
            });

            const data = (res as any)?.data ?? res;
            const url = data?.url;
            const sessionId = data?.sessionId;

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
                        : 'Failed to initialize deposit checkout';
            setError(message);
            setLoading(false);
        }
    };

    return (
        <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-4 dark:border-brand-500/30 dark:bg-brand-500/10">
            <p className="text-sm font-medium text-brand-800 dark:text-brand-300">
                Deposit required
            </p>
            <p className="mt-1 text-theme-sm text-brand-700 dark:text-brand-400">
                Pay the application deposit ({amount} USD) to proceed to the next stage.
            </p>
            {error && (
                <p className="mt-2 text-sm text-error-600 dark:text-error-400">{error}</p>
            )}
            <button
                type="button"
                onClick={startPayment}
                disabled={loading}
                className="mt-3 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
                {loading ? 'Redirecting to Stripe…' : `Pay deposit (${amount} USD)`}
            </button>
        </div>
    );
}