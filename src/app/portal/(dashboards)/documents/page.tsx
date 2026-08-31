'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    documentsApi,
    ApiError,
    type DocumentItem,
    type DocumentReviewStatus,
} from '@/lib/api';

// Constants
const DOCUMENT_STATUS_BADGE: Record<DocumentReviewStatus, string> = {
    pending: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
    approved: 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400',
    rejected: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400',
};

const DOCUMENT_STATUS_LABELS: Record<DocumentReviewStatus, string> = {
    pending: 'Pending Review',
    approved: 'Approved',
    rejected: 'Rejected',
};

const VISA_TYPE_LABELS: Record<string, string> = {
    work: 'Work Visa',
    partner: 'Partner Visa',
    student: 'Student Visa',
    residence: 'Residence Visa',
    visitor: 'Visitor Visa',
    business: 'Business Visa',
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

function formatFileSize(bytes?: number): string {
    if (!bytes) return '—';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
}

// Helper functions for nested data
function getApplicationId(doc: DocumentItem): string {
    if (!doc.applicationId) return 'N/A';
    if (typeof doc.applicationId === 'string') {
        return doc.applicationId;
    }
    if (typeof doc.applicationId === 'object') {
        return (doc.applicationId as any)._id || 'N/A';
    }
    return 'N/A';
}

function getApplicationVisaType(doc: DocumentItem): string | undefined {
    if (!doc.applicationId) return undefined;
    if (typeof doc.applicationId === 'object') {
        return (doc.applicationId as any).visaType;
    }
    return undefined;
}

function getClientDisplayName(doc: DocumentItem): string {
    if (!doc.clientId) return 'Unknown Client';
    if (typeof doc.clientId === 'object') {
        const client = doc.clientId as any;
        const firstName = client.profile?.firstName || '';
        const lastName = client.profile?.lastName || '';
        const name = [firstName, lastName].filter(Boolean).join(' ');
        return name || client.email || 'Unknown Client';
    }
    return 'Unknown Client';
}

function getClientEmail(doc: DocumentItem): string {
    if (!doc.clientId) return '';
    if (typeof doc.clientId === 'object') {
        return (doc.clientId as any).email || '';
    }
    return '';
}

function getReviewerName(doc: DocumentItem): string {
    if (!doc.reviewedBy) return '—';
    if (typeof doc.reviewedBy === 'object') {
        const reviewer = doc.reviewedBy as any;
        const firstName = reviewer.profile?.firstName || '';
        const lastName = reviewer.profile?.lastName || '';
        const name = [firstName, lastName].filter(Boolean).join(' ');
        return name || reviewer.email || '—';
    }
    return '—';
}

export default function DocumentManagementPage() {
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState('');
    const [statusFilter, setStatusFilter] = useState<DocumentReviewStatus | ''>('');
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [reviewStatus, setReviewStatus] = useState<DocumentReviewStatus>('pending');
    const [reviewNotes, setReviewNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchDocuments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await documentsApi.list({
                status: statusFilter || undefined,
                page,
                limit,
            });

            let docList: DocumentItem[] = [];
            let totalCount = 0;
            let pages = 1;

            if (res && typeof res === 'object') {
                // Handle the actual response structure: { success: true, data: { documents: [...], total: 7, totalPages: 1, currentPage: 1 } }
                const responseData = (res as any).data || res;

                if (Array.isArray(responseData.documents)) {
                    docList = responseData.documents;
                    totalCount = responseData.total || docList.length;
                    pages = responseData.totalPages || 1;
                } else if (Array.isArray(responseData)) {
                    docList = responseData;
                    totalCount = responseData.length;
                } else if (Array.isArray(res)) {
                    docList = res;
                    totalCount = res.length;
                }
            }

            setDocuments(docList);
            setTotal(totalCount);
            setTotalPages(pages);
        } catch (err) {
            const message = err instanceof ApiError ? err.message : 'Failed to load documents';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, page, limit]);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    const handleReview = async () => {
        if (!selectedDocument) return;

        setSubmitting(true);
        try {
            await documentsApi.review(selectedDocument._id, {
                status: reviewStatus,
                reviewNotes: reviewNotes || undefined,
            });
            await fetchDocuments();
            setShowReviewModal(false);
            setSelectedDocument(null);
            setReviewStatus('pending');
            setReviewNotes('');
        } catch (err) {
            const message = err instanceof ApiError ? err.message : 'Failed to review document';
            setError(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedDocument) return;

        setSubmitting(true);
        try {
            await documentsApi.delete(selectedDocument._id);
            await fetchDocuments();
            setShowDeleteModal(false);
            setSelectedDocument(null);
        } catch (err) {
            const message = err instanceof ApiError ? err.message : 'Failed to delete document';
            setError(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDownload = async (documentId: string) => {
        try {
            const res = await documentsApi.downloadUrl(documentId);
            const url = (res as any).data?.url || (res as any).url;
            if (url) {
                window.open(url, '_blank');
            }
        } catch (error) {
            console.error('Failed to get download URL:', error);
            setError('Failed to download document');
        }
    };

    const maxPages = Math.max(1, totalPages);

    return (
        <div className="space-y-6 p-4 md:p-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">
                        Document Management
                    </h1>
                    <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                        Review and manage all uploaded documents
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="inline-flex items-center rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
                        Total: {total}
                    </span>
                    <span className="inline-flex items-center rounded-lg bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 dark:bg-green-500/15 dark:text-green-400">
                        Approved: {documents.filter(d => d.status === 'approved').length}
                    </span>
                    <span className="inline-flex items-center rounded-lg bg-yellow-50 px-3 py-1.5 text-sm font-medium text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400">
                        Pending: {documents.filter(d => d.status === 'pending').length}
                    </span>
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
                                placeholder="Search documents by type or client..."
                                className="w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pr-3 pl-10 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                            />
                        </div>
                    </div>

                    <div className="w-full md:w-48">
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setPage(1);
                                setStatusFilter(e.target.value as DocumentReviewStatus | '');
                            }}
                            className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                        >
                            <option value="">All Status</option>
                            <option value="pending">Pending Review</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>

                    <button
                        onClick={fetchDocuments}
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

            {/* Documents Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px] text-left text-sm">
                        <thead>
                        <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03]">
                            <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Document</th>
                            <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Client</th>
                            <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Application</th>
                            <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                            <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Uploaded</th>
                            <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                                    <div className="inline-flex items-center gap-2">
                                        <span className="size-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                                        Loading documents...
                                    </div>
                                </td>
                            </tr>
                        ) : documents.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                                    No documents found.
                                </td>
                            </tr>
                        ) : (
                            documents.map((doc) => {
                                const appId = getApplicationId(doc);
                                const visaType = getApplicationVisaType(doc);
                                const clientName = getClientDisplayName(doc);
                                const clientEmail = getClientEmail(doc);
                                const reviewerName = getReviewerName(doc);
                                const displayId = appId !== 'N/A' ? appId.slice(-8) : 'N/A';

                                return (
                                    <tr
                                        key={doc._id}
                                        className="border-b border-gray-100 last:border-0 hover:bg-gray-50 dark:border-gray-800/60 dark:hover:bg-white/[0.02]"
                                    >
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="font-medium text-gray-800 dark:text-white/90">
                                                    {doc.documentType || doc.type || 'Untitled'}
                                                </p>
                                                {doc.originalName && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                                                        {doc.originalName}
                                                    </p>
                                                )}
                                                {doc.fileSize && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {formatFileSize(doc.fileSize)}
                                                    </p>
                                                )}
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
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div>
                                                {visaType ? (
                                                    <p className="text-sm text-gray-800 dark:text-white/90">
                                                        {VISA_TYPE_LABELS[visaType] || visaType}
                                                    </p>
                                                ) : (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        Application
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    ID: {displayId}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div>
                                                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${DOCUMENT_STATUS_BADGE[doc.status || 'pending']}`}>
                                                        {DOCUMENT_STATUS_LABELS[doc.status || 'pending']}
                                                    </span>
                                                {doc.reviewNotes && (
                                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                                                        {doc.reviewNotes}
                                                    </p>
                                                )}
                                                {doc.reviewedBy && (
                                                    <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                                                        by {reviewerName}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                            {formatDateTime(doc.createdAt)}
                                            {doc.reviewedAt && (
                                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                                    Reviewed: {formatDateTime(doc.reviewedAt)}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => handleDownload(doc._id)}
                                                    className="rounded-lg p-1.5 text-brand-500 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
                                                    title="Download"
                                                >
                                                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedDocument(doc);
                                                        setReviewStatus(doc.status || 'pending');
                                                        setReviewNotes(doc.reviewNotes || '');
                                                        setShowReviewModal(true);
                                                    }}
                                                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
                                                    title="Review"
                                                >
                                                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedDocument(doc);
                                                        setShowDeleteModal(true);
                                                    }}
                                                    className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                                                    title="Delete"
                                                >
                                                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
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

            {/* Review Modal */}
            {showReviewModal && selectedDocument && (
                <div className="fixed inset-0 z-99999 flex items-center justify-center p-4">
                    <button
                        type="button"
                        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
                        aria-label="Close"
                        onClick={() => {
                            setShowReviewModal(false);
                            setSelectedDocument(null);
                            setReviewStatus('pending');
                            setReviewNotes('');
                        }}
                    />
                    <div className="relative z-10 w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xl dark:border-gray-800 dark:bg-gray-dark">
                        <div className="mb-5 flex items-start justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                                    Review Document
                                </h2>
                                <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                                    {selectedDocument.documentType || selectedDocument.type || 'Untitled'}
                                </p>
                                {selectedDocument.originalName && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {selectedDocument.originalName}
                                    </p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowReviewModal(false);
                                    setSelectedDocument(null);
                                    setReviewStatus('pending');
                                    setReviewNotes('');
                                }}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5"
                            >
                                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                                    Review Status <span className="text-error-500">*</span>
                                </label>
                                <select
                                    value={reviewStatus}
                                    onChange={(e) => setReviewStatus(e.target.value as DocumentReviewStatus)}
                                    className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                                >
                                    <option value="pending">Pending Review</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                                    Review Notes
                                </label>
                                <textarea
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    placeholder="Add notes about this document review..."
                                    rows={3}
                                    className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowReviewModal(false);
                                        setSelectedDocument(null);
                                        setReviewStatus('pending');
                                        setReviewNotes('');
                                    }}
                                    className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleReview}
                                    disabled={submitting}
                                    className="flex-1 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                                >
                                    {submitting ? 'Submitting...' : 'Submit Review'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && selectedDocument && (
                <div className="fixed inset-0 z-99999 flex items-center justify-center p-4">
                    <button
                        type="button"
                        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
                        aria-label="Close"
                        onClick={() => {
                            setShowDeleteModal(false);
                            setSelectedDocument(null);
                        }}
                    />
                    <div className="relative z-10 w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xl dark:border-gray-800 dark:bg-gray-dark">
                        <div className="mb-5 flex items-start justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                                    Delete Document
                                </h2>
                                <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                                    This action cannot be undone
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setSelectedDocument(null);
                                }}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5"
                            >
                                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Are you sure you want to delete document "{selectedDocument.documentType || selectedDocument.type}"?
                                {selectedDocument.originalName && (
                                    <span className="block mt-1 text-xs text-gray-500 dark:text-gray-500">
                                        File: {selectedDocument.originalName}
                                    </span>
                                )}
                                <span className="block mt-1 text-xs text-gray-500 dark:text-gray-500">
                                    Client: {getClientDisplayName(selectedDocument)}
                                </span>
                            </p>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setSelectedDocument(null);
                                    }}
                                    className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={submitting}
                                    className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
                                >
                                    {submitting ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}