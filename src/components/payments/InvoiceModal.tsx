'use client';

import React, { useRef } from 'react';
import { Modal } from '@/components/ui/modal';
import type { Payment } from '@/lib/api';

interface InvoiceModalProps {
    payment: Payment | null;
    isOpen: boolean;
    onClose: () => void;
    clientName?: string;
    clientEmail?: string;
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
            month: 'long',
            day: 'numeric',
        });
    } catch {
        return '—';
    }
}

function formatReference(value?: string | null, maxLength = 16): string {
    if (!value) return '—';
    if (value.startsWith('cs_') || value.startsWith('pi_') || value.startsWith('ch_')) {
        return value.length > maxLength
            ? `${value.slice(0, 8)}…${value.slice(-6)}`
            : value;
    }
    return value.length > maxLength
        ? `${value.slice(0, maxLength)}…`
        : value;
}

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

const TYPE_LABELS: Record<string, string> = {
    deposit: 'Application Deposit',
    consultation_fee: 'Consultation Fee',
};

const STATUS_CONFIG = {
    completed: {
        bg: 'bg-green-50 dark:bg-green-500/10',
        text: 'text-green-700 dark:text-green-400',
        dot: 'bg-green-500',
        label: 'Paid',
    },
    pending: {
        bg: 'bg-yellow-50 dark:bg-yellow-500/10',
        text: 'text-yellow-700 dark:text-yellow-400',
        dot: 'bg-yellow-500',
        label: 'Pending',
    },
    failed: {
        bg: 'bg-red-50 dark:bg-red-500/10',
        text: 'text-red-700 dark:text-red-400',
        dot: 'bg-red-500',
        label: 'Failed',
    },
};

export function InvoiceModal({
                                 payment,
                                 isOpen,
                                 onClose,
                                 clientName = 'Client',
                                 clientEmail,
                             }: InvoiceModalProps) {
    const printRef = useRef<HTMLDivElement>(null);

    if (!payment) return null;

    const invoiceNumber = payment.invoiceNumber ||
        `INV-${payment._id.slice(-8).toUpperCase()}`;

    const statusConfig = STATUS_CONFIG[payment.status] || STATUS_CONFIG.pending;

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Invoice ${invoiceNumber}</title>
                    <style>
                        * { box-sizing: border-box; margin: 0; padding: 0; }
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            color: #111;
                            padding: 40px;
                            max-width: 800px;
                            margin: 0 auto;
                            background: #fff;
                        }
                        .invoice-container {
                            background: white;
                            border-radius: 12px;
                            padding: 40px;
                        }
                        .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
                        .logo { 
                            font-size: 24px; 
                            font-weight: 700; 
                            color: #1a56db;
                            letter-spacing: -0.5px;
                        }
                        .logo-sub { font-size: 13px; color: #666; font-weight: 400; margin-top: 4px; }
                        .invoice-title { font-size: 30px; font-weight: 700; color: #111; }
                        .invoice-meta { text-align: right; color: #666; font-size: 13px; margin-top: 4px; }
                        .parties { 
                            display: grid; 
                            grid-template-columns: 1fr 1fr; 
                            gap: 32px; 
                            margin-bottom: 40px;
                            padding: 20px;
                            background: #f8fafc;
                            border-radius: 8px;
                        }
                        .party h4 { 
                            font-size: 11px; 
                            text-transform: uppercase; 
                            letter-spacing: 0.05em; 
                            color: #888; 
                            margin-bottom: 6px; 
                            font-weight: 600;
                        }
                        .party p { font-size: 14px; line-height: 1.6; }
                        .party .name { font-weight: 600; color: #111; }
                        .status-badge {
                            display: inline-block;
                            padding: 4px 12px;
                            border-radius: 9999px;
                            font-size: 12px;
                            font-weight: 600;
                        }
                        .status-paid { background: #dcfce7; color: #166534; }
                        .status-pending { background: #fef9c3; color: #854d0e; }
                        .status-failed { background: #fee2e2; color: #991b1b; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
                        th { 
                            text-align: left; 
                            font-size: 11px; 
                            text-transform: uppercase; 
                            letter-spacing: 0.05em; 
                            color: #888; 
                            border-bottom: 2px solid #e5e7eb; 
                            padding: 12px 0; 
                            font-weight: 600;
                        }
                        td { padding: 16px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
                        .amount { text-align: right; font-weight: 600; }
                        .totals { 
                            margin-left: auto; 
                            width: 280px;
                            padding: 20px;
                            background: #f8fafc;
                            border-radius: 8px;
                        }
                        .totals-row { 
                            display: flex; 
                            justify-content: space-between; 
                            padding: 6px 0; 
                            font-size: 14px; 
                            color: #444;
                        }
                        .totals-row.grand { 
                            font-size: 20px; 
                            font-weight: 700; 
                            border-top: 2px solid #111; 
                            margin-top: 8px; 
                            padding-top: 12px;
                            color: #111;
                        }
                        .footer { 
                            margin-top: 40px; 
                            padding-top: 20px; 
                            border-top: 1px solid #e5e7eb; 
                            font-size: 12px; 
                            color: #888; 
                            text-align: center; 
                        }
                        .reference { 
                            font-family: 'SF Mono', 'Monaco', monospace; 
                            font-size: 12px; 
                            color: #666; 
                            background: #f1f5f9; 
                            padding: 4px 8px; 
                            border-radius: 4px;
                            display: inline-block;
                        }
                        .divider {
                            width: 60px;
                            height: 3px;
                            background: #1a56db;
                            border-radius: 2px;
                            margin: 8px 0 16px 0;
                        }
                        @media print {
                            body { padding: 20px; background: white; }
                            .parties { background: #f8fafc; }
                            .totals { background: #f8fafc; }
                        }
                    </style>
                </head>
                <body>
                    <div class="invoice-container">
                        ${printContent.innerHTML}
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-[720px] p-0">
            <div className="flex flex-col">
                {/* Toolbar - Modern with gradient accent */}
                <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white px-6 py-4 dark:border-gray-800 dark:from-gray-900/50 dark:to-gray-dark">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
                            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                                Invoice
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                #{invoiceNumber}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-600 hover:shadow-md dark:shadow-brand-500/20"
                        >
                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Print / PDF
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5"
                        >
                            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Invoice content - Enhanced design */}
                <div
                    ref={printRef}
                    className="p-6 sm:p-8 space-y-8"
                >
                    {/* Header with brand */}
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                                Migrantifly
                            </div>
                            <div className="mt-1 h-0.5 w-12 bg-brand-500/30 rounded-full" />
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                Migration &amp; Visa Services
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                                INVOICE
                            </div>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                #{invoiceNumber}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {formatDate(payment.createdAt)}
                            </p>
                        </div>
                    </div>

                    {/* Parties - Card style */}
                    <div className="grid grid-cols-1 gap-4 rounded-xl bg-gray-50 p-5 dark:bg-gray-800/30 sm:grid-cols-2">
                        <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                Bill To
                            </h4>
                            <p className="mt-1.5 text-base font-semibold text-gray-800 dark:text-white/90">
                                {clientName}
                            </p>
                            {clientEmail && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {clientEmail}
                                </p>
                            )}
                        </div>
                        <div className="sm:text-right">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                Status
                            </h4>
                            <div className="mt-1.5 inline-flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${statusConfig.dot}`} />
                                <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                                    {statusConfig.label}
                                </span>
                            </div>
                            {(payment.transactionId || payment.gatewayReference) && (
                                <div className="mt-2">
                                    <span className="text-xs text-gray-400">Reference:</span>
                                    <span className="ml-1.5 font-mono text-xs text-gray-600 dark:text-gray-400">
                                        {formatReference(payment.transactionId || payment.gatewayReference, 20)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Line items - Clean table */}
                    <div>
                        <table className="w-full">
                            <thead>
                            <tr>
                                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                                    Description
                                </th>
                                <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">
                                    Amount
                                </th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr className="border-t border-gray-100 dark:border-gray-800">
                                <td className="py-4">
                                    <p className="font-medium text-gray-800 dark:text-white/90">
                                        {TYPE_LABELS[payment.type] || payment.type}
                                    </p>
                                    {getId(payment.applicationId) && (
                                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                            Application: #{getId(payment.applicationId)?.slice(-8)}
                                        </p>
                                    )}
                                </td>
                                <td className="py-4 text-right font-medium text-gray-800 dark:text-white/90">
                                    {formatAmount(payment.amount, payment.currency)}
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Totals - Card style */}
                    <div className="ml-auto w-full max-w-xs rounded-xl bg-gray-50 p-5 dark:bg-gray-800/30 sm:w-72">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                <span>Subtotal</span>
                                <span>{formatAmount(payment.amount, payment.currency)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                <span>Tax (GST)</span>
                                <span>—</span>
                            </div>
                            <div className="flex justify-between border-t-2 border-gray-200 pt-3 text-lg font-bold text-gray-800 dark:border-gray-700 dark:text-white/90">
                                <span>Total</span>
                                <span>{formatAmount(payment.amount, payment.currency)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer with decorative elements */}
                    <div className="border-t border-gray-100 pt-6 text-center dark:border-gray-800">
                        <div className="mb-3 flex justify-center gap-6 text-xs text-gray-400">
                            <span>Thank you for choosing Migrantifly</span>
                            <span className="hidden sm:inline">•</span>
                            <span>support@migrantifly.com</span>
                        </div>
                        <p className="text-xs text-gray-400">
                            This is a system-generated invoice. For any questions, please contact our support team.
                        </p>
                    </div>
                </div>
            </div>
        </Modal>
    );
}