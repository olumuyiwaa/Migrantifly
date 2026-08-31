'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    paymentsApi,
    ApiError,
    type Payment,
} from '@/lib/api';

// Constants
const PAYMENT_TYPE_LABELS: Record<string, string> = {
    deposit: 'Deposit',
    consultation_fee: 'Consultation Fee',
};

const PAYMENT_STATUS_BADGE: Record<string, string> = {
    pending: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
    completed: 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400',
    failed: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
    pending: 'Pending',
    completed: 'Completed',
    failed: 'Failed',
};

function formatDate(iso?: string): string {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return '—';
    }
}

function formatDateTime(iso?: string): string {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString(undefined, {
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

function formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

// Helper functions for nested data
function getClientDisplayName(transaction: Payment): string {
    if (!transaction.clientId) return 'Unknown Client';
    if (typeof transaction.clientId === 'object') {
        const client = transaction.clientId as any;
        const firstName = client.profile?.firstName || '';
        const lastName = client.profile?.lastName || '';
        const name = [firstName, lastName].filter(Boolean).join(' ');
        return name || client.email || 'Unknown Client';
    }
    if (typeof transaction.clientId === 'string') {
        return `Client ${transaction.clientId.slice(-8)}`;
    }
    return 'Unknown Client';
}

function getClientEmail(transaction: Payment): string {
    if (!transaction.clientId) return '';
    if (typeof transaction.clientId === 'object') {
        return (transaction.clientId as any).email || '';
    }
    return '';
}

function getClientId(transaction: Payment): string {
    if (!transaction.clientId) return 'N/A';
    if (typeof transaction.clientId === 'string') {
        return transaction.clientId;
    }
    if (typeof transaction.clientId === 'object') {
        return (transaction.clientId as any)._id || (transaction.clientId as any).id || 'N/A';
    }
    return 'N/A';
}

function getApplicationInfo(transaction: Payment): { id: string; visaType?: string; inzReference?: string } {
    if (!transaction.applicationId) return { id: 'N/A' };
    if (typeof transaction.applicationId === 'string') {
        return { id: transaction.applicationId };
    }
    if (typeof transaction.applicationId === 'object') {
        const app = transaction.applicationId as any;
        return {
            id: app._id || app.id || 'N/A',
            visaType: app.visaType,
            inzReference: app.inzReference,
        };
    }
    return { id: 'N/A' };
}

function getConsultationId(transaction: Payment): string {
    if (!transaction.consultationId) return 'N/A';
    if (typeof transaction.consultationId === 'string') {
        return transaction.consultationId;
    }
    if (typeof transaction.consultationId === 'object') {
        return (transaction.consultationId as any)._id || (transaction.consultationId as any).id || 'N/A';
    }
    return 'N/A';
}

export default function TransactionManagementPage() {
    const [transactions, setTransactions] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedTransaction, setSelectedTransaction] = useState<Payment | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [stats, setStats] = useState({
        totalAmount: 0,
        completedAmount: 0,
        pendingAmount: 0,
        failedAmount: 0,
        totalCount: 0,
        completedCount: 0,
    });

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await paymentsApi.history();

            let transList: Payment[] = [];
            let totalCount = 0;
            let pages = 1;

            if (res && typeof res === 'object') {
                // Handle the actual response structure: { success: true, data: [...] }
                const responseData = (res as any).data || res;

                if (Array.isArray(responseData)) {
                    transList = responseData;
                    totalCount = responseData.length;
                } else if (Array.isArray(responseData.payments)) {
                    transList = responseData.payments;
                    totalCount = responseData.pagination?.total || transList.length;
                    pages = responseData.pagination?.totalPages || 1;
                } else if (Array.isArray(res)) {
                    transList = res;
                    totalCount = res.length;
                }
            }

            // Apply filters
            let filtered = transList;
            if (statusFilter) {
                filtered = filtered.filter(t => t.status === statusFilter);
            }
            if (typeFilter) {
                filtered = filtered.filter(t => t.type === typeFilter);
            }
            if (searchInput) {
                const search = searchInput.toLowerCase();
                filtered = filtered.filter(t => {
                    const clientId = getClientId(t);
                    const clientName = getClientDisplayName(t).toLowerCase();
                    const appInfo = getApplicationInfo(t);
                    return clientId.toLowerCase().includes(search) ||
                        clientName.includes(search) ||
                        appInfo.id.toLowerCase().includes(search) ||
                        t.transactionId?.toLowerCase().includes(search) ||
                        t.invoiceNumber?.toLowerCase().includes(search);
                });
            }

            setTransactions(filtered);
            setTotal(filtered.length);
            setTotalPages(Math.max(1, Math.ceil(filtered.length / limit)));

            // Calculate stats
            const totalAmount = transList.reduce((sum, t) => sum + t.amount, 0);
            const completedAmount = transList
                .filter(t => t.status === 'completed')
                .reduce((sum, t) => sum + t.amount, 0);
            const pendingAmount = transList
                .filter(t => t.status === 'pending')
                .reduce((sum, t) => sum + t.amount, 0);
            const failedAmount = transList
                .filter(t => t.status === 'failed')
                .reduce((sum, t) => sum + t.amount, 0);

            setStats({
                totalAmount,
                completedAmount,
                pendingAmount,
                failedAmount,
                totalCount: transList.length,
                completedCount: transList.filter(t => t.status === 'completed').length,
            });
        } catch (err) {
            const message = err instanceof ApiError ? err.message : 'Failed to load transactions';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, typeFilter, searchInput, limit]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const maxPages = Math.max(1, totalPages);

    return (
        <div className="space-y-6 p-4 md:p-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">
                        Transaction Management
                    </h1>
                    <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                        View and manage all payment transactions
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="inline-flex items-center rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
                        Total: {stats.totalCount}
                    </span>
                    <span className="inline-flex items-center rounded-lg bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 dark:bg-green-500/15 dark:text-green-400">
                        Completed: {stats.completedCount}
                    </span>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
                    <p className="text-2xl font-semibold text-gray-800 dark:text-white/90">
                        {formatCurrency(stats.totalAmount)}
                    </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
                    <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(stats.completedAmount)}
                    </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
                    <p className="text-2xl font-semibold text-yellow-600 dark:text-yellow-400">
                        {formatCurrency(stats.pendingAmount)}
                    </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Failed</p>
                    <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
                        {formatCurrency(stats.failedAmount)}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <div className="flex-1">
                        <div className="relative">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="search"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search by client, application ID, or invoice..."
                                className="w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pr-3 pl-10 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                            />
                        </div>
                    </div>

                    <div className="w-full md:w-40">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                        >
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="failed">Failed</option>
                        </select>
                    </div>

                    <div className="w-full md:w-40">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                        >
                            <option value="">All Types</option>
                            <option value="deposit">Deposit</option>
                            <option value="consultation_fee">Consultation Fee</option>
                        </select>
                    </div>

                    <button
                        onClick={fetchTransactions}
                        className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
                    {error}
                    <button
                        type="button"
                        onClick={() => setError(null)}
                        className="ml-3 font-medium underline hover:no-underline"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Transactions Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1100px] text-left text-sm">
                        <thead>
                        <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03]">
                            <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Transaction</th>
                            <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Client</th>
                            <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Amount</th>
                            <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Type</th>
                            <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                            <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Date</th>
                            <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                                    <div className="inline-flex items-center gap-2">
                                        <span className="size-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                                        Loading transactions...
                                    </div>
                                </td>
                            </tr>
                        ) : transactions.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                                    No transactions found.
                                </td>
                            </tr>
                        ) : (
                            transactions.map((transaction) => {
                                const clientName = getClientDisplayName(transaction);
                                const clientEmail = getClientEmail(transaction);
                                const appInfo = getApplicationInfo(transaction);
                                const displayAppId = appInfo.id !== 'N/A' ? appInfo.id.slice(-8) : 'N/A';

                                return (
                                    <tr
                                        key={transaction._id}
                                        className="border-b border-gray-100 last:border-0 hover:bg-gray-50 dark:border-gray-800/60 dark:hover:bg-white/[0.02]"
                                    >
                                        <td className="px-4 py-3">
                                            <div>
                                                {transaction.transactionId && (
                                                    <p className="font-medium text-gray-800 dark:text-gray-400 truncate max-w-[150px] font-mono">
                                                        {transaction.transactionId}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-500 dark:text-white/90">
                                                    {transaction.invoiceNumber || '—'}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                    {clientName}
                                                </p>
                                                {clientEmail && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {clientEmail}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                                    ID: {getClientId(transaction).slice(-8)}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-800 dark:text-white/90">
                                            {formatCurrency(transaction.amount, transaction.currency)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                            {PAYMENT_TYPE_LABELS[transaction.type] || transaction.type}
                                            {appInfo.visaType && (
                                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                                    {appInfo.visaType}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${PAYMENT_STATUS_BADGE[transaction.status]}`}>
                                                    {PAYMENT_STATUS_LABELS[transaction.status] || transaction.status}
                                                </span>
                                            {transaction.consultationId && (
                                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                                    Consultation: {getConsultationId(transaction).slice(-8)}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                            {formatDateTime(transaction.createdAt)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => {
                                                    setSelectedTransaction(transaction);
                                                    setShowDetailModal(true);
                                                }}
                                                className="rounded-lg p-1.5 text-brand-500 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
                                                title="View Details"
                                            >
                                                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && maxPages > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-800">
                        <p className="text-theme-sm text-gray-500 dark:text-gray-400">
                            Page {page} of {maxPages}
                            {total > 0 && ` · ${total} total`}
                        </p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                disabled={page <= 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                            >
                                Previous
                            </button>
                            <button
                                type="button"
                                disabled={page >= maxPages}
                                onClick={() => setPage(p => p + 1)}
                                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedTransaction && (
                <TransactionDetailModal
                    transaction={selectedTransaction}
                    onClose={() => {
                        setShowDetailModal(false);
                        setSelectedTransaction(null);
                    }}
                />
            )}
        </div>
    );
}

// Transaction Detail Modal
function TransactionDetailModal({
                                    transaction,
                                    onClose,
                                }: {
    transaction: Payment;
    onClose: () => void;
}) {
    const clientName = getClientDisplayName(transaction);
    const clientEmail = getClientEmail(transaction);
    const clientId = getClientId(transaction);
    const appInfo = getApplicationInfo(transaction);
    const consultationId = getConsultationId(transaction);

    return (
        <div className="fixed inset-0 z-99999 flex items-center justify-center p-4">
            <button
                type="button"
                className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
                aria-label="Close"
                onClick={onClose}
            />
            <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xl dark:border-gray-800 dark:bg-gray-dark">
                <div className="mb-5 flex items-start justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                            Transaction Details
                        </h2>
                        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                            ID: {transaction._id}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5"
                    >
                        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Amount</label>
                            <p className="text-lg font-semibold text-gray-800 dark:text-white/90">
                                {formatCurrency(transaction.amount, transaction.currency)}
                            </p>
                        </div>
                        <div>
                            <label className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Status</label>
                            <p className="text-sm text-gray-800 dark:text-white/90">
                                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${PAYMENT_STATUS_BADGE[transaction.status]}`}>
                                    {PAYMENT_STATUS_LABELS[transaction.status] || transaction.status}
                                </span>
                            </p>
                        </div>
                        <div>
                            <label className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Type</label>
                            <p className="text-sm text-gray-800 dark:text-white/90">
                                {PAYMENT_TYPE_LABELS[transaction.type] || transaction.type}
                            </p>
                        </div>
                        <div>
                            <label className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Client</label>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                {clientName}
                            </p>
                            {clientEmail && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {clientEmail}
                                </p>
                            )}
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                ID: {clientId}
                            </p>
                        </div>
                        {appInfo.id !== 'N/A' && (
                            <div>
                                <label className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Application</label>
                                <p className="text-sm text-gray-800 dark:text-white/90">
                                    ID: {appInfo.id}
                                </p>
                                {appInfo.visaType && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Visa: {appInfo.visaType}
                                    </p>
                                )}
                                {appInfo.inzReference && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        INZ: {appInfo.inzReference}
                                    </p>
                                )}
                            </div>
                        )}
                        {consultationId !== 'N/A' && (
                            <div>
                                <label className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Consultation</label>
                                <p className="text-sm text-gray-800 dark:text-white/90">
                                    ID: {consultationId}
                                </p>
                            </div>
                        )}
                        {transaction.invoiceNumber && (
                            <div>
                                <label className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Invoice Number</label>
                                <p className="text-sm text-gray-800 dark:text-white/90">
                                    {transaction.invoiceNumber}
                                </p>
                            </div>
                        )}
                        {transaction.transactionId && (
                            <div className="col-span-2">
                                <label className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Transaction ID</label>
                                <p className="text-sm text-gray-800 dark:text-white/90 font-mono text-xs break-all">
                                    {transaction.transactionId}
                                </p>
                            </div>
                        )}
                        {transaction.gatewayReference && transaction.gatewayReference !== '[object Object]' && (
                            <div className="col-span-2">
                                <label className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Gateway Reference</label>
                                <p className="text-sm text-gray-800 dark:text-white/90 font-mono text-xs break-all">
                                    {transaction.gatewayReference}
                                </p>
                            </div>
                        )}
                    </div>

                    {transaction.notes && (
                        <div>
                            <label className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Notes</label>
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {transaction.notes}
                            </p>
                        </div>
                    )}

                    {transaction.invoiceUrl && (
                        <div>
                            <label className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Invoice</label>
                            <div className="mt-1">
                                <a
                                    href={transaction.invoiceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                                >
                                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download Invoice
                                </a>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-4 dark:border-gray-700">
                        <div>
                            <label className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Created</label>
                            <p className="text-sm text-gray-800 dark:text-white/90">
                                {formatDateTime(transaction.createdAt)}
                            </p>
                        </div>
                        <div>
                            <label className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Last Updated</label>
                            <p className="text-sm text-gray-800 dark:text-white/90">
                                {formatDateTime(transaction.updatedAt)}
                            </p>
                        </div>
                    </div>

                    {transaction.refundAmount !== undefined && transaction.refundAmount > 0 && (
                        <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                            <label className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Refund Amount</label>
                            <p className="text-sm text-gray-800 dark:text-white/90">
                                {formatCurrency(transaction.refundAmount, transaction.currency)}
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex gap-3 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}