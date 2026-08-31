'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    paymentsApi,
    ApiError,
    type Payment,
    type PaymentType,
    type PaymentStatus,
} from '@/lib/api';
import { InvoiceModal } from '@/components/common/InvoiceModal';

// ---------- helpers ----------

const TYPE_LABELS: Record<PaymentType, string> = {
    deposit: 'Application Deposit',
    consultation_fee: 'Consultation Fee',
};

const STATUS_BADGE: Record<PaymentStatus, string> = {
    pending: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
    completed: 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400',
    failed: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400',
};

const STATUS_LABELS: Record<PaymentStatus, string> = {
    pending: 'Pending',
    completed: 'Completed',
    failed: 'Failed',
};

function getId(value: unknown): string | null {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value !== null) {
        const obj = value as Record<string, unknown>;
        if (typeof obj._id === 'string') return obj._id;
        if (typeof obj.id === 'string') return obj.id;
    }
    return null;
}

function formatAmount(amount: number, currency = 'NZD'): string {
    try {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: currency.toUpperCase(),
            minimumFractionDigits: 2,
        }).format(amount);
    } catch {
        return `${currency.toUpperCase()} ${amount.toFixed(2)}`;
    }
}

function formatDate(iso?: string): string {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return '—';
    }
}

// ---------- component ----------

export default function ClientPaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [invoiceOpen, setInvoiceOpen] = useState(false);

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await paymentsApi.history();
            const list = (res as any).data || (res as any).payments || [];
            setPayments(Array.isArray(list) ? list : []);
        } catch (err) {
            setError(
                err instanceof ApiError ? err.message : 'Failed to load payment history'
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const openInvoice = (payment: Payment) => {
        setSelectedPayment(payment);
        setInvoiceOpen(true);
    };

    const closeInvoice = () => {
        setInvoiceOpen(false);
        setSelectedPayment(null);
    };

    // Summary stats
    const completed = payments.filter((p) => p.status === 'completed');
    const totalPaid = completed.reduce((sum, p) => sum + (p.amount || 0), 0);
    const pendingCount = payments.filter((p) => p.status === 'pending').length;
    const failedCount = payments.filter((p) => p.status === 'failed').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">
                        Payments
                    </h1>
                    <p className="text-theme-sm text-gray-500 dark:text-gray-400">
                        View your consultation fees and application deposits
                    </p>
                </div>
                <button
                    type="button"
                    onClick={fetchHistory}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                >
                    Refresh
                </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
                    <p className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                        Total Paid
                    </p>
                    <p className="mt-1 text-xl font-semibold text-gray-800 dark:text-white/90">
                        {formatAmount(totalPaid)}
                    </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
                    <p className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                        Pending
                    </p>
                    <p className="mt-1 text-xl font-semibold text-gray-800 dark:text-white/90">
                        {pendingCount}
                    </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
                    <p className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                        Failed
                    </p>
                    <p className="mt-1 text-xl font-semibold text-gray-800 dark:text-white/90">
                        {failedCount}
                    </p>
                </div>
            </div>

            {/* History */}
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                {loading ? (
                    <div className="flex h-64 items-center justify-center">
                        <div className="inline-flex items-center gap-2 text-gray-500">
                            <span className="size-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                            Loading payments…
                        </div>
                    </div>
                ) : error ? (
                    <div className="p-6">
                        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
                            {error}
                            <button
                                type="button"
                                onClick={fetchHistory}
                                className="ml-3 font-medium underline hover:no-underline"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                ) : payments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-gray-100 dark:bg-white/5">
                            <svg className="size-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                        </div>
                        <h3 className="text-sm font-medium text-gray-800 dark:text-white/90">
                            No payments yet
                        </h3>
                        <p className="mt-1 max-w-sm text-theme-sm text-gray-500 dark:text-gray-400">
                            Consultation fees and application deposits will appear here once you make a payment.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] text-left text-sm">
                            <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-800">
                                <th className="px-5 py-3.5 text-theme-xs font-medium text-gray-500 dark:text-gray-400">Date</th>
                                <th className="px-5 py-3.5 text-theme-xs font-medium text-gray-500 dark:text-gray-400">Type</th>
                                <th className="px-5 py-3.5 text-theme-xs font-medium text-gray-500 dark:text-gray-400">Amount</th>
                                <th className="px-5 py-3.5 text-theme-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                                <th className="px-5 py-3.5 text-theme-xs font-medium text-gray-500 dark:text-gray-400">Reference</th>
                                <th className="px-5 py-3.5 text-theme-xs font-medium text-gray-500 dark:text-gray-400">Invoice</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                            {payments.map((payment) => {
                                const applicationId = getId(payment.applicationId);

                                return (
                                    <tr
                                        key={payment._id}
                                        className="hover:bg-gray-50/80 dark:hover:bg-white/[0.02]"
                                    >
                                        <td className="px-5 py-4 text-gray-700 dark:text-gray-300">
                                            {formatDate(payment.createdAt)}
                                        </td>

                                        <td className="px-5 py-4">
                        <span className="font-medium text-gray-800 dark:text-white/90">
                          {TYPE_LABELS[payment.type] || payment.type}
                        </span>
                                            {applicationId && (
                                                <p className="mt-0.5 text-theme-xs text-gray-500">
                                                    <Link
                                                        href={`/portal/my-applications/${applicationId}`}
                                                        className="hover:text-brand-500 hover:underline"
                                                    >
                                                        View application
                                                    </Link>
                                                </p>
                                            )}
                                        </td>

                                        <td className="px-5 py-4 font-medium text-gray-800 dark:text-white/90">
                                            {formatAmount(payment.amount, payment.currency)}
                                        </td>

                                        <td className="px-5 py-4">
                        <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                STATUS_BADGE[payment.status] || STATUS_BADGE.pending
                            }`}
                        >
                          {STATUS_LABELS[payment.status] || payment.status}
                        </span>
                                        </td>

                                        <td className="px-5 py-4 font-mono text-theme-xs text-gray-500 dark:text-gray-400">
                                            {payment.transactionId ||
                                                payment.gatewayReference ||
                                                payment.invoiceNumber ||
                                                '—'}
                                        </td>

                                        <td className="px-5 py-4">
                                            <button
                                                type="button"
                                                onClick={() => openInvoice(payment)}
                                                className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                                            >
                                                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                View Invoice
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Invoice Modal */}
            <InvoiceModal
                payment={selectedPayment}
                isOpen={invoiceOpen}
                onClose={closeInvoice}
                // Optionally pass client name/email from auth context
                // clientName={user?.profile?.firstName + ' ' + user?.profile?.lastName}
                // clientEmail={user?.email}
            />
        </div>
    );
}