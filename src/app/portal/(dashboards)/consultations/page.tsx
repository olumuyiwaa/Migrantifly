'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    consultationsApi,
    adminApi,
    ApiError,
    type Consultation,
    type ConsultationMethod,
    type User,
} from '@/lib/api';

// Constants
const CONSULTATION_METHOD_LABELS: Record<string, string> = {
    online: 'Online',
    phone: 'Phone',
    in_person: 'In Person',
    zoom: 'Zoom',
    'google-meet': 'Google Meet',
    'in-person': 'In Person',
};

const STATUS_BADGE_COLORS: Record<string, string> = {
    pending: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
    pending_payment: 'bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
    confirmed: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
    scheduled: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
    completed: 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400',
    cancelled: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400',
    rescheduled: 'bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
};

const STATUS_LABELS: Record<string, string> = {
    pending: 'Pending',
    pending_payment: 'Pending Payment',
    confirmed: 'Confirmed',
    scheduled: 'Scheduled',
    completed: 'Completed',
    cancelled: 'Cancelled',
    rescheduled: 'Rescheduled',
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

function getClientDisplayName(consultation: Consultation): string {
    if (consultation.clientId && typeof consultation.clientId === 'object') {
        const client = consultation.clientId as any;
        const firstName = client.profile?.firstName || '';
        const lastName = client.profile?.lastName || '';
        const name = [firstName, lastName].filter(Boolean).join(' ');
        return name || client.email || 'Unknown Client';
    }
    return consultation.clientName || 'Unknown Client';
}

function getClientEmail(consultation: Consultation): string {
    if (consultation.clientId && typeof consultation.clientId === 'object') {
        const client = consultation.clientId as any;
        return client.email || consultation.clientEmail || '';
    }
    return consultation.clientEmail || '';
}

function getClientPhone(consultation: Consultation): string {
    if (consultation.clientId && typeof consultation.clientId === 'object') {
        const client = consultation.clientId as any;
        return client.profile?.phone || consultation.clientPhone || '—';
    }
    return consultation.clientPhone || '—';
}

function getAdviserDisplayName(consultation: Consultation): string {
    if (consultation.adviserId && typeof consultation.adviserId === 'object') {
        const adviser = consultation.adviserId as any;
        const firstName = adviser.profile?.firstName || '';
        const lastName = adviser.profile?.lastName || '';
        const name = [firstName, lastName].filter(Boolean).join(' ');
        return name || adviser.email || 'Not assigned';
    }
    return consultation.adviserId ? 'Adviser assigned' : 'Not assigned';
}

function getAdviserEmail(consultation: Consultation): string {
    if (consultation.adviserId && typeof consultation.adviserId === 'object') {
        const adviser = consultation.adviserId as any;
        return adviser.email || '';
    }
    return '';
}

function getAdviserId(consultation: Consultation): string | null {
    if (consultation.adviserId && typeof consultation.adviserId === 'object') {
        return (consultation.adviserId as any)._id || null;
    }
    if (typeof consultation.adviserId === 'string') {
        return consultation.adviserId;
    }
    return null;
}

export default function ConsultationManagementPage() {
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [advisers, setAdvisers] = useState<User[]>([]);
    const [selectedAdviserId, setSelectedAdviserId] = useState('');

    // Edit form states
    const [editData, setEditData] = useState({
        scheduledDate: '',
        method: '' as ConsultationMethod | '',
        duration: 30,
        meetingLink: '',
        notes: '',
        rescheduleReason: '',
    });

    // Complete form states
    const [completeData, setCompleteData] = useState({
        notes: '',
        visaPathways: [] as string[],
        proceedWithApplication: false,
    });

    // Fetch advisers
    useEffect(() => {
        const fetchAdvisers = async () => {
            try {
                const res = await adminApi.users({ role: 'adviser', limit: 100 });
                const list = (res as any).data?.users || (res as any).users || [];
                setAdvisers(Array.isArray(list) ? list : []);
            } catch (error) {
                console.error('Failed to fetch advisers:', error);
            }
        };
        fetchAdvisers();
    }, []);

    const fetchConsultations = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await consultationsApi.list({
                status: statusFilter || undefined,
                page,
                limit,
            });

            let consList: Consultation[] = [];
            let totalCount = 0;
            let pages = 1;

            if (res && typeof res === 'object') {
                const responseData = (res as any).data || res;

                if (Array.isArray(responseData.consultations)) {
                    consList = responseData.consultations;
                    totalCount = responseData.total || consList.length;
                    pages = responseData.totalPages || 1;
                } else if (Array.isArray(responseData)) {
                    consList = responseData;
                    totalCount = responseData.length;
                } else if (Array.isArray(res)) {
                    consList = res;
                    totalCount = res.length;
                }
            }

            setConsultations(consList);
            setTotal(totalCount);
            setTotalPages(pages);
        } catch (err) {
            const message = err instanceof ApiError ? err.message : 'Failed to load consultations';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, page, limit]);

    useEffect(() => {
        fetchConsultations();
    }, [fetchConsultations]);

    const handleComplete = async () => {
        if (!selectedConsultation) return;

        setSubmitting(true);
        try {
            await consultationsApi.complete(selectedConsultation._id!, {
                notes: completeData.notes || undefined,
                visaPathways: completeData.visaPathways.length > 0 ? completeData.visaPathways : undefined,
                proceedWithApplication: completeData.proceedWithApplication,
            });
            await fetchConsultations();
            setShowCompleteModal(false);
            setSelectedConsultation(null);
            setCompleteData({ notes: '', visaPathways: [], proceedWithApplication: false });
        } catch (err) {
            const message = err instanceof ApiError ? err.message : 'Failed to complete consultation';
            setError(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = async () => {
        if (!selectedConsultation) return;

        setSubmitting(true);
        try {
            await consultationsApi.edit(selectedConsultation._id!, {
                scheduledDate: editData.scheduledDate || undefined,
                method: editData.method || undefined,
                duration: editData.duration || undefined,
                meetingLink: editData.meetingLink || undefined,
                notes: editData.notes || undefined,
                rescheduleReason: editData.rescheduleReason || undefined,
            });
            await fetchConsultations();
            setShowEditModal(false);
            setSelectedConsultation(null);
        } catch (err) {
            const message = err instanceof ApiError ? err.message : 'Failed to update consultation';
            setError(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleAssignAdviser = async () => {
        if (!selectedConsultation || !selectedAdviserId) return;

        setSubmitting(true);
        setError(null);
        try {
            // Use the correct consultation assignment endpoint
            await consultationsApi.assignAdviser(selectedConsultation._id!, selectedAdviserId);
            await fetchConsultations();
            setShowAssignModal(false);
            setSelectedConsultation(null);
            setSelectedAdviserId('');

            // Optional: Show success message
            // You could add a toast notification here
        } catch (err) {
            const message = err instanceof ApiError ? err.message : 'Failed to assign adviser';
            setError(message);
        } finally {
            setSubmitting(false);
        }
    };

    const openEditModal = (consultation: Consultation) => {
        setSelectedConsultation(consultation);
        setEditData({
            scheduledDate: consultation.scheduledDate?.split('T')[0] || '',
            method: consultation.method as ConsultationMethod || '',
            duration: consultation.duration || 30,
            meetingLink: consultation.meetingLink || '',
            notes: consultation.notes || '',
            rescheduleReason: '',
        });
        setShowEditModal(true);
    };

    const openCompleteModal = (consultation: Consultation) => {
        setSelectedConsultation(consultation);
        setCompleteData({
            notes: '',
            visaPathways: consultation.visaPathways || [],
            proceedWithApplication: consultation.proceedWithApplication || false,
        });
        setShowCompleteModal(true);
    };

    const openAssignModal = (consultation: Consultation) => {
        setSelectedConsultation(consultation);
        setSelectedAdviserId(getAdviserId(consultation) || '');
        setShowAssignModal(true);
    };

    const maxPages = Math.max(1, totalPages);

    return (
        <div className="space-y-6 p-4 md:p-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">
                        Consultation Management
                    </h1>
                    <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                        Manage all client consultations
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="inline-flex items-center rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
                        Total: {total}
                    </span>
                    <span className="inline-flex items-center rounded-lg bg-yellow-50 px-3 py-1.5 text-sm font-medium text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400">
                        Pending: {consultations.filter(c => c.status === 'pending' || c.status === 'pending_payment').length}
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
                                placeholder="Search by client name or email..."
                                className="w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pr-3 pl-10 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                            />
                        </div>
                    </div>

                    <div className="w-full md:w-48">
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setPage(1);
                                setStatusFilter(e.target.value);
                            }}
                            className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                        >
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="pending_payment">Pending Payment</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="rescheduled">Rescheduled</option>
                        </select>
                    </div>

                    <button
                        onClick={fetchConsultations}
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

            {/* Consultations Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px] text-left text-sm">
                        <thead>
                        <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03]">
                            <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Client</th>
                            <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Adviser</th>
                            <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Scheduled</th>
                            <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Method</th>
                            <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                            <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                                    <div className="inline-flex items-center gap-2">
                                        <span className="size-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                                        Loading consultations...
                                    </div>
                                </td>
                            </tr>
                        ) : consultations.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                                    No consultations found.
                                </td>
                            </tr>
                        ) : (
                            consultations.map((consultation) => {
                                const clientName = getClientDisplayName(consultation);
                                const clientEmail = getClientEmail(consultation);
                                const clientPhone = getClientPhone(consultation);
                                const adviserName = getAdviserDisplayName(consultation);
                                const status = consultation.status || 'pending';
                                const statusLabel = STATUS_LABELS[status] || status.charAt(0).toUpperCase() + status.slice(1);

                                return (
                                    <tr
                                        key={consultation._id}
                                        className="border-b border-gray-100 last:border-0 hover:bg-gray-50 dark:border-gray-800/60 dark:hover:bg-white/[0.02]"
                                    >
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="font-medium text-gray-800 dark:text-white/90">
                                                    {clientName}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {clientEmail}
                                                </p>
                                                {clientPhone && clientPhone !== '—' && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {clientPhone}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                            {adviserName}
                                        </td>
                                        <td className="px-4 py-3">
                                            {consultation.scheduledDate ? (
                                                <div>
                                                    <p className="text-sm text-gray-800 dark:text-white/90">
                                                        {formatDateTime(consultation.scheduledDate)}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {consultation.duration ? `${consultation.duration} min` : ''}
                                                    </p>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                                        Not scheduled
                                                    </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                            {CONSULTATION_METHOD_LABELS[consultation.method] || consultation.method || '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE_COLORS[status]}`}>
                                                    {statusLabel}
                                                </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => {
                                                        setSelectedConsultation(consultation);
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
                                                <button
                                                    onClick={() => openAssignModal(consultation)}
                                                    className="rounded-lg p-1.5 text-purple-500 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-500/10"
                                                    title="Assign Adviser"
                                                >
                                                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                </button>
                                                {status !== 'completed' && status !== 'cancelled' && (
                                                    <>
                                                        <button
                                                            onClick={() => openEditModal(consultation)}
                                                            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
                                                            title="Edit"
                                                        >
                                                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => openCompleteModal(consultation)}
                                                            className="rounded-lg p-1.5 text-green-500 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-500/10"
                                                            title="Complete"
                                                        >
                                                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </button>
                                                    </>
                                                )}
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

            {/* Detail Modal */}
            {showDetailModal && selectedConsultation && (
                <ConsultationDetailModal
                    consultation={selectedConsultation}
                    onClose={() => {
                        setShowDetailModal(false);
                        setSelectedConsultation(null);
                    }}
                    onAssign={() => {
                        setShowDetailModal(false);
                        openAssignModal(selectedConsultation);
                    }}
                />
            )}

            {/* Edit Modal */}
            {showEditModal && selectedConsultation && (
                <EditConsultationModal
                    consultation={selectedConsultation}
                    editData={editData}
                    onEditDataChange={setEditData}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedConsultation(null);
                    }}
                    onSubmit={handleEdit}
                    loading={submitting}
                />
            )}

            {/* Complete Modal */}
            {showCompleteModal && selectedConsultation && (
                <CompleteConsultationModal
                    consultation={selectedConsultation}
                    completeData={completeData}
                    onCompleteDataChange={setCompleteData}
                    onClose={() => {
                        setShowCompleteModal(false);
                        setSelectedConsultation(null);
                    }}
                    onSubmit={handleComplete}
                    loading={submitting}
                />
            )}

            {/* Assign Adviser Modal */}
            {showAssignModal && selectedConsultation && (
                <AssignAdviserModal
                    consultation={selectedConsultation}
                    advisers={advisers}
                    selectedAdviserId={selectedAdviserId}
                    onAdviserChange={setSelectedAdviserId}
                    onClose={() => {
                        setShowAssignModal(false);
                        setSelectedConsultation(null);
                        setSelectedAdviserId('');
                    }}
                    onSubmit={handleAssignAdviser}
                    loading={submitting}
                />
            )}
        </div>
    );
}

// Detail Modal Component
function ConsultationDetailModal({
                                     consultation,
                                     onClose,
                                     onAssign,
                                 }: {
    consultation: Consultation;
    onClose: () => void;
    onAssign?: () => void;
}) {
    const clientName = getClientDisplayName(consultation);
    const clientEmail = getClientEmail(consultation);
    const clientPhone = getClientPhone(consultation);
    const adviserName = getAdviserDisplayName(consultation);
    const adviserEmail = getAdviserEmail(consultation);
    const status = consultation.status || 'pending';
    const statusLabel = STATUS_LABELS[status] || status.charAt(0).toUpperCase() + status.slice(1);

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
                            Consultation Details
                        </h2>
                        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                            ID: {consultation._id}
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
                            <label className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Client Name</label>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                {clientName}
                            </p>
                        </div>
                        <div>
                            <label className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Email</label>
                            <p className="text-sm text-gray-800 dark:text-white/90">{clientEmail}</p>
                        </div>
                        <div>
                            <label className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Phone</label>
                            <p className="text-sm text-gray-800 dark:text-white/90">{clientPhone}</p>
                        </div>
                        <div>
                            <label className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Status</label>
                            <p className="text-sm text-gray-800 dark:text-white/90">
                                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE_COLORS[status]}`}>
                                    {statusLabel}
                                </span>
                            </p>
                        </div>
                        <div>
                            <label className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Method</label>
                            <p className="text-sm text-gray-800 dark:text-white/90">
                                {CONSULTATION_METHOD_LABELS[consultation.method] || consultation.method || '—'}
                            </p>
                        </div>
                        <div>
                            <label className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Duration</label>
                            <p className="text-sm text-gray-800 dark:text-white/90">
                                {consultation.duration ? `${consultation.duration} min` : '—'}
                            </p>
                        </div>
                        <div>
                            <label className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Adviser</label>
                            <p className="text-sm text-gray-800 dark:text-white/90">
                                {adviserName}
                                {adviserEmail && (
                                    <span className="block text-xs text-gray-500 dark:text-gray-400">
                                        {adviserEmail}
                                    </span>
                                )}
                            </p>
                            {onAssign && (
                                <button
                                    onClick={onAssign}
                                    className="mt-1 text-xs text-brand-500 hover:text-brand-600 dark:text-brand-400"
                                >
                                    Assign Adviser
                                </button>
                            )}
                        </div>
                        {consultation.scheduledDate && (
                            <div>
                                <label className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Scheduled Date</label>
                                <p className="text-sm text-gray-800 dark:text-white/90">
                                    {formatDateTime(consultation.scheduledDate)}
                                </p>
                            </div>
                        )}
                        {consultation.paymentId && (
                            <div>
                                <label className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Payment ID</label>
                                <p className="text-sm text-gray-800 dark:text-white/90 font-mono text-xs">
                                    {String(consultation.paymentId)}
                                </p>
                            </div>
                        )}
                        {consultation.clientToken && (
                            <div>
                                <label className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Client Token</label>
                                <p className="text-sm text-gray-800 dark:text-white/90 font-mono text-xs">
                                    {String(consultation.clientToken)}
                                </p>
                            </div>
                        )}
                        {consultation.meetingLink && (
                            <div className="col-span-2">
                                <label className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Meeting Link</label>
                                <a href={consultation.meetingLink} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400">
                                    {consultation.meetingLink}
                                </a>
                            </div>
                        )}
                    </div>

                    {consultation.message && (
                        <div>
                            <label className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Message</label>
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {consultation.message}
                            </p>
                        </div>
                    )}

                    {consultation.notes && (
                        <div>
                            <label className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Notes</label>
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {consultation.notes}
                            </p>
                        </div>
                    )}

                    {consultation.visaPathways && consultation.visaPathways.length > 0 && (
                        <div>
                            <label className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Visa Pathways</label>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {consultation.visaPathways.map((pathway, index) => (
                                    <span key={index} className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-400">
                                        {pathway}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {consultation.proceedWithApplication !== undefined && (
                        <div>
                            <label className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Proceed with Application</label>
                            <p className="text-sm text-gray-800 dark:text-white/90">
                                {consultation.proceedWithApplication ? 'Yes' : 'No'}
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex gap-3 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                    {onAssign && (
                        <button
                            type="button"
                            onClick={onAssign}
                            className="flex-1 rounded-lg bg-purple-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-600"
                        >
                            Assign Adviser
                        </button>
                    )}
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

// Edit Modal Component
function EditConsultationModal({
                                   consultation,
                                   editData,
                                   onEditDataChange,
                                   onClose,
                                   onSubmit,
                                   loading,
                               }: {
    consultation: Consultation;
    editData: any;
    onEditDataChange: (data: any) => void;
    onClose: () => void;
    onSubmit: () => void;
    loading: boolean;
}) {
    return (
        <div className="fixed inset-0 z-99999 flex items-center justify-center p-4">
            <button
                type="button"
                className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
                aria-label="Close"
                onClick={onClose}
            />
            <div className="relative z-10 w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xl dark:border-gray-800 dark:bg-gray-dark">
                <div className="mb-5 flex items-start justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                            Edit Consultation
                        </h2>
                        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                            {getClientDisplayName(consultation)}
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
                    <div>
                        <label className="mb-1.5 block text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                            Scheduled Date
                        </label>
                        <input
                            type="date"
                            value={editData.scheduledDate}
                            onChange={(e) => onEditDataChange({ ...editData, scheduledDate: e.target.value })}
                            className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                            Method
                        </label>
                        <select
                            value={editData.method}
                            onChange={(e) => onEditDataChange({ ...editData, method: e.target.value })}
                            className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                        >
                            <option value="">Select method...</option>
                            <option value="online">Online</option>
                            <option value="phone">Phone</option>
                            <option value="in-person">In Person</option>
                            <option value="in_person">In Person</option>
                            <option value="zoom">Zoom</option>
                            <option value="google-meet">Google Meet</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                            Duration (minutes)
                        </label>
                        <input
                            type="number"
                            value={editData.duration}
                            onChange={(e) => onEditDataChange({ ...editData, duration: parseInt(e.target.value) || 30 })}
                            min="15"
                            max="120"
                            step="15"
                            className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                            Meeting Link
                        </label>
                        <input
                            type="url"
                            value={editData.meetingLink}
                            onChange={(e) => onEditDataChange({ ...editData, meetingLink: e.target.value })}
                            placeholder="https://..."
                            className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                            Notes
                        </label>
                        <textarea
                            value={editData.notes}
                            onChange={(e) => onEditDataChange({ ...editData, notes: e.target.value })}
                            rows={2}
                            className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                            Reschedule Reason (if applicable)
                        </label>
                        <textarea
                            value={editData.rescheduleReason}
                            onChange={(e) => onEditDataChange({ ...editData, rescheduleReason: e.target.value })}
                            rows={2}
                            placeholder="Why is this consultation being rescheduled?"
                            className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={onSubmit}
                            disabled={loading}
                            className="flex-1 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Complete Modal Component
function CompleteConsultationModal({
                                       consultation,
                                       completeData,
                                       onCompleteDataChange,
                                       onClose,
                                       onSubmit,
                                       loading,
                                   }: {
    consultation: Consultation;
    completeData: any;
    onCompleteDataChange: (data: any) => void;
    onClose: () => void;
    onSubmit: () => void;
    loading: boolean;
}) {
    const [pathwayInput, setPathwayInput] = useState('');

    const addPathway = () => {
        if (pathwayInput.trim()) {
            onCompleteDataChange({
                ...completeData,
                visaPathways: [...completeData.visaPathways, pathwayInput.trim()]
            });
            setPathwayInput('');
        }
    };

    const removePathway = (index: number) => {
        onCompleteDataChange({
            ...completeData,
            visaPathways: completeData.visaPathways.filter((_: string, i: number) => i !== index)
        });
    };

    return (
        <div className="fixed inset-0 z-99999 flex items-center justify-center p-4">
            <button
                type="button"
                className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
                aria-label="Close"
                onClick={onClose}
            />
            <div className="relative z-10 w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xl dark:border-gray-800 dark:bg-gray-dark">
                <div className="mb-5 flex items-start justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                            Complete Consultation
                        </h2>
                        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                            {getClientDisplayName(consultation)}
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
                    <div>
                        <label className="mb-1.5 block text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                            Consultation Notes
                        </label>
                        <textarea
                            value={completeData.notes}
                            onChange={(e) => onCompleteDataChange({ ...completeData, notes: e.target.value })}
                            rows={3}
                            placeholder="Add notes from the consultation..."
                            className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                            Visa Pathways Discussed
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={pathwayInput}
                                onChange={(e) => setPathwayInput(e.target.value)}
                                placeholder="Add visa pathway..."
                                className="flex-1 rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                                onKeyDown={(e) => e.key === 'Enter' && addPathway()}
                            />
                            <button
                                type="button"
                                onClick={addPathway}
                                className="rounded-lg bg-brand-500 px-3 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
                            >
                                Add
                            </button>
                        </div>
                        {completeData.visaPathways.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {completeData.visaPathways.map((pathway: string, index: number) => (
                                    <span key={index} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-400">
                                        {pathway}
                                        <button
                                            type="button"
                                            onClick={() => removePathway(index)}
                                            className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="proceedWithApplication"
                            checked={completeData.proceedWithApplication}
                            onChange={(e) => onCompleteDataChange({ ...completeData, proceedWithApplication: e.target.checked })}
                            className="rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-700"
                        />
                        <label htmlFor="proceedWithApplication" className="text-sm text-gray-700 dark:text-gray-300">
                            Client will proceed with application
                        </label>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={onSubmit}
                            disabled={loading}
                            className="flex-1 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                        >
                            {loading ? 'Completing...' : 'Complete Consultation'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Assign Adviser Modal Component
function AssignAdviserModal({
                                consultation,
                                advisers,
                                selectedAdviserId,
                                onAdviserChange,
                                onClose,
                                onSubmit,
                                loading,
                            }: {
    consultation: Consultation;
    advisers: User[];
    selectedAdviserId: string;
    onAdviserChange: (id: string) => void;
    onClose: () => void;
    onSubmit: () => void;
    loading: boolean;
}) {
    const clientName = getClientDisplayName(consultation);

    return (
        <div className="fixed inset-0 z-99999 flex items-center justify-center p-4">
            <button
                type="button"
                className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
                aria-label="Close"
                onClick={onClose}
            />
            <div className="relative z-10 w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xl dark:border-gray-800 dark:bg-gray-dark">
                <div className="mb-5 flex items-start justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                            Assign Adviser
                        </h2>
                        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                            Consultation: {clientName}
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
                    <div>
                        <label className="mb-1.5 block text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                            Select Adviser <span className="text-error-500">*</span>
                        </label>
                        <select
                            value={selectedAdviserId}
                            onChange={(e) => onAdviserChange(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                            required
                        >
                            <option value="">Select adviser...</option>
                            {advisers.length === 0 ? (
                                <option value="" disabled>No advisers available</option>
                            ) : (
                                advisers.map(adviser => (
                                    <option key={adviser._id} value={adviser._id}>
                                        {adviser.profile?.firstName} {adviser.profile?.lastName} ({adviser.email})
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={onSubmit}
                            disabled={!selectedAdviserId || loading}
                            className="flex-1 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                        >
                            {loading ? 'Assigning...' : 'Assign Adviser'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}