import { paymentsApi, ApiError } from '@/lib/api';
import { getStripe } from '@/lib/stripe';

/**
 * Consultation fee → Stripe Checkout (redirect)
 */
export async function payConsultationFee(params: {
    consultationId: string;
    paymentId: string; // backend may generate this; pass what your API expects
    amount: number;
    email: string;
}): Promise<{ error?: string }> {
    try {
        const res = await paymentsApi.createConsultationPayment({
            consultationId: params.consultationId,
            paymentId: params.paymentId,
            amount: params.amount,
            email: params.email,
        });

        const sessionId =
            (res as any).data?.sessionId || (res as any).sessionId;

        if (!sessionId) {
            return { error: 'No checkout session returned from server' };
        }

        const stripe = await getStripe();
        if (!stripe) return { error: 'Stripe failed to load' };

        // Redirect to Stripe Checkout
        const { error } = await stripe.redirectToCheckout({ sessionId });
        if (error) return { error: error.message || 'Checkout redirect failed' };

        return {};
    } catch (err) {
        return {
            error: err instanceof ApiError ? err.message : 'Failed to start consultation payment',
        };
    }
}

/**
 * Application deposit → PaymentIntent (clientSecret)
 * Caller should open a modal with Stripe Elements, or use confirmCardPayment if you collect card yourself.
 * For simplicity below we return clientSecret so UI can handle Elements.
 */
export async function createDepositIntent(params: {
    applicationId: string;
    amount: number;
}): Promise<{ clientSecret?: string; paymentIntentId?: string; error?: string }> {
    try {
        const res = await paymentsApi.createDepositPayment({
            applicationId: params.applicationId,
            amount: params.amount,
        });

        const clientSecret =
            (res as any).data?.clientSecret ||
            (res as any).clientSecret;
        const paymentIntentId =
            (res as any).data?.paymentIntentId ||
            (res as any).paymentIntentId;

        if (!clientSecret) {
            return { error: 'No client secret returned from server' };
        }

        return { clientSecret, paymentIntentId };
    } catch (err) {
        return {
            error: err instanceof ApiError ? err.message : 'Failed to create deposit payment',
        };
    }
}

/**
 * Optional: confirm after Payment Element succeeds
 */
export async function confirmPaymentOnServer(params: {
    paymentId: string;
    paymentIntentId: string;
}) {
    return paymentsApi.confirm({
        paymentId: params.paymentId,
        paymentIntentId: params.paymentIntentId,
    });
}