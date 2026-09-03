'use client';

import { useState, useEffect } from 'react';
import {
    applicationsApi,
    adminApi,
    adminApplicationsApi,
    documentsApi,
    deadlinesApi,
    ApiError,
    getStoredUser,
    type Application,
    type ApplicationStage,
    type User,
    type DocumentItem,
    type DocumentChecklistItem,
    type DocumentReviewStatus,
    type DecisionOutcome,
    type DeadlineItem,
} from '@/lib/api';
import { SubmitToInzModal } from './SubmitToInzModal';
import { AddRfiModal } from './AddRfiModal';
import { AddPpiModal } from './AddPpiModal';
import { RecordDecisionModal } from './RecordDecisionModal';
import { StageUpdateModal } from './StageUpdateModal';
import { AssignAdviserModal } from './AssignAdviserModal';
import MessagingPanel from './MessagingPanel';

// ---------- Labels & badge colours ----------
const STAGE_LABELS: Record<ApplicationStage, string> = {
    consultation: 'Consultation',
    deposit_paid: 'Deposit Paid',
    documents_completed: 'Documents Completed',
    additional_docs_required: 'Additional Docs Required',
    submitted_to_inz: 'Submitted to INZ',
    inz_processing: 'INZ Processing',
    rfi_received: 'RFI Received',
    ppi_received: 'PPI Received',
    decision: 'Decision',
};

const STAGE_BADGE_COLORS: Record<ApplicationStage, string> = {
    consultation: 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300',
    deposit_paid: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
    documents_completed: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400',
    additional_docs_required: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
    submitted_to_inz: 'bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
    inz_processing: 'bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
    rfi_received: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400',
    ppi_received: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
    decision: 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400',
};

const VISA_TYPE_LABELS: Record<string, string> = {
    work: 'Work Visa',
    partner: 'Partner Visa',
    student: 'Student Visa',
    residence: 'Residence Visa',
    visitor: 'Visitor Visa',
    business: 'Business Visa',
};

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

// ---------- Helpers ----------
function getClientDisplayInfo(app: Application): { name: string; id: string; email?: string } {
    if (app.clientId && typeof app.clientId === 'object') {
        const client = app.clientId as any;
        const firstName = client.profile?.firstName || '';
        const lastName = client.profile?.lastName || '';
        const name = [firstName, lastName].filter(Boolean).join(' ') || client.email || 'Client';
        return {
            name,
            id: client._id || client.id || 'N/A',
            email: client.email,
        };
    }
    if (typeof app.clientId === 'string') {
        return {
            name: `Client ${app.clientId.slice(-6)}`,
            id: app.clientId,
        };
    }
    return { name: 'Unknown Client', id: 'N/A' };
}

function getAdviserDisplayInfo(app: Application): string {
    if (!app.adviserId) return 'Not assigned';
    if (typeof app.adviserId === 'object') {
        const adviser = app.adviserId as any;
        const firstName = adviser.profile?.firstName || '';
        const lastName = adviser.profile?.lastName || '';
        return [firstName, lastName].filter(Boolean).join(' ') || adviser.email || 'Adviser';
    }
    if (typeof app.adviserId === 'string') {
        return `Adviser ${app.adviserId.slice(-6)}`;
    }
    return 'Not assigned';
}

function formatDate(iso?: string | null): string {
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

// ---------- Props ----------
interface ApplicationDetailModalProps {
    application: Application;
    onClose: () => void;
    onUpdate?: () => void;
}

export function ApplicationDetailModal({
                                           application,
                                           onClose,
                                           onUpdate,
                                       }: ApplicationDetailModalProps) {
    // Stage / assign
    const [showStageModal, setShowStageModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [newStage, setNewStage] = useState<ApplicationStage | ''>(application.stage);
    const [stageNotes, setStageNotes] = useState('');
    const [error, setError] = useState('');
    const [updating, setUpdating] = useState(false);
    const [selectedAdviserId, setSelectedAdviserId] = useState('');
    const [advisers, setAdvisers] = useState<User[]>([]);
    const [assigning, setAssigning] = useState(false);

    // Documents
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [checklist, setChecklist] = useState<DocumentChecklistItem[]>([]);
    const [loadingDocuments, setLoadingDocuments] = useState(false);
    const [showDocumentReview, setShowDocumentReview] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null);
    const [reviewStatus, setReviewStatus] = useState<DocumentReviewStatus>('pending');
    const [reviewNotes, setReviewNotes] = useState('');
    const [reviewing, setReviewing] = useState(false);

    // Deadlines (RFI / PPI)
    const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
    const [loadingDeadlines, setLoadingDeadlines] = useState(false);

    // Action modals
    const [showSubmitToInzModal, setShowSubmitToInzModal] = useState(false);
    const [showAddRfiModal, setShowAddRfiModal] = useState(false);
    const [showAddPpiModal, setShowAddPpiModal] = useState(false);
    const [showRecordDecisionModal, setShowRecordDecisionModal] = useState(false);
    const [submittingToInz, setSubmittingToInz] = useState(false);
    const [addingRfi, setAddingRfi] = useState(false);
    const [addingPpi, setAddingPpi] = useState(false);
    const [recordingDecision, setRecordingDecision] = useState(false);

    // Derived
    const clientInfo = getClientDisplayInfo(application);
    const uploadedCount = documents.length;
    const requiredCount = checklist.filter((item) => item.required).length;
    const approvedCount = documents.filter((doc) => doc.status === 'approved').length;

    const rfis = deadlines.filter((d) => d.deadline.type === 'rfi');
    const ppis = deadlines.filter((d) => d.deadline.type === 'ppi');

    const isInzStage =
        application.stage === 'submitted_to_inz' ||
        application.stage === 'inz_processing' ||
        application.stage === 'rfi_received' ||
        application.stage === 'ppi_received';

    const isRfiOrPpiStage =
        application.stage === 'rfi_received' || application.stage === 'ppi_received';

    // ---------- Effects ----------
    useEffect(() => {
        const fetchAdvisers = async () => {
            try {
                const res = await adminApi.users({ role: 'adviser', limit: 100 });
                const list = (res as any).data?.users || (res as any).users || (res as any).data || [];
                setAdvisers(Array.isArray(list) ? list : []);
            } catch (err) {
                console.error('Failed to fetch advisers:', err);
            }
        };
        fetchAdvisers();
    }, []);

    useEffect(() => {
        const fetchDocuments = async () => {
            setLoadingDocuments(true);
            try {
                const docsRes = await documentsApi.byApplication(application._id);
                const docsList = (docsRes as any).data || (docsRes as any).documents || [];
                setDocuments(Array.isArray(docsList) ? docsList : []);

                const checklistRes = await documentsApi.checklist(application.visaType);
                const checklistList = (checklistRes as any).data || [];
                setChecklist(Array.isArray(checklistList) ? checklistList : []);
            } catch (err) {
                console.error('Failed to fetch documents:', err);
            } finally {
                setLoadingDocuments(false);
            }
        };
        fetchDocuments();
    }, [application._id, application.visaType]);

    // Fetch deadlines for this application
    useEffect(() => {
        const fetchDeadlines = async () => {
            setLoadingDeadlines(true);
            try {
                // Prefer by-client if we have a clean client id, otherwise fall back to list + filter
                let items: DeadlineItem[] = [];

                const clientId =
                    typeof application.clientId === 'string'
                        ? application.clientId
                        : (application.clientId as any)?._id || (application.clientId as any)?.id;

                if (clientId) {
                    const res = await deadlinesApi.byClient(clientId);
                    const list = (res as any).data || [];
                    items = Array.isArray(list) ? list : [];
                } else {
                    const res = await deadlinesApi.list({ limit: 100 });
                    const payload = (res as any).data || res;
                    items = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
                }

                // Keep only deadlines belonging to this application
                setDeadlines(items.filter((d) => d.applicationId === application._id));
            } catch (err) {
                console.error('Failed to fetch deadlines:', err);
                setDeadlines([]);
            } finally {
                setLoadingDeadlines(false);
            }
        };
        fetchDeadlines();
    }, [application._id, application.clientId]);

    // ---------- Handlers ----------
    const handleStageUpdate = async () => {
        if (!newStage || newStage === application.stage) return;
        setUpdating(true);
        try {
            await applicationsApi.updateStage(application._id, {
                stage: newStage as ApplicationStage,
                notes: stageNotes || undefined,
            });
            setShowStageModal(false);
            setNewStage(application.stage);
            setStageNotes('');
            onUpdate?.();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to update stage');
        } finally {
            setUpdating(false);
        }
    };

    const handleAssignAdviser = async () => {
        if (!selectedAdviserId) return;
        setAssigning(true);
        try {
            await adminApplicationsApi.assignAdviser(application._id, selectedAdviserId);
            setShowAssignModal(false);
            setSelectedAdviserId('');
            onUpdate?.();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to assign adviser');
        } finally {
            setAssigning(false);
        }
    };

    const handleReviewDocument = async () => {
        if (!selectedDocument) return;
        setReviewing(true);
        try {
            await documentsApi.review(selectedDocument._id, {
                status: reviewStatus,
                reviewNotes: reviewNotes || undefined,
            });
            setDocuments((prev) =>
                prev.map((doc) =>
                    doc._id === selectedDocument._id
                        ? { ...doc, status: reviewStatus, reviewNotes: reviewNotes || undefined }
                        : doc
                )
            );
            setShowDocumentReview(false);
            setSelectedDocument(null);
            setReviewStatus('pending');
            setReviewNotes('');
            onUpdate?.();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to review document');
        } finally {
            setReviewing(false);
        }
    };

    const handleDownload = async (documentId: string) => {
        try {
            const res = await documentsApi.downloadUrl(documentId);
            const url = (res as any).data?.url || (res as any).url;
            if (url) window.open(url, '_blank');
        } catch {
            setError('Failed to download document');
        }
    };

    const handleSubmitToInz = async (inzReference: string) => {
        setSubmittingToInz(true);
        try {
            await applicationsApi.submitToInz(application._id, { inzReference });
            setShowSubmitToInzModal(false);
            onUpdate?.();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to submit to INZ');
        } finally {
            setSubmittingToInz(false);
        }
    };

    const handleAddRfi = async (description: string, dueDate: string) => {
        setAddingRfi(true);
        try {
            await applicationsApi.addRfi(application._id, { description, dueDate });
            setShowAddRfiModal(false);
            onUpdate?.();
            // Refresh deadlines after adding
            // (the parent onUpdate should re-fetch the application; we also re-run the effect)
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to add RFI');
        } finally {
            setAddingRfi(false);
        }
    };

    const handleAddPpi = async (description: string, dueDate: string) => {
        setAddingPpi(true);
        try {
            await applicationsApi.addPpi(application._id, { description, dueDate });
            setShowAddPpiModal(false);
            onUpdate?.();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to add PPI');
        } finally {
            setAddingPpi(false);
        }
    };

    const handleRecordDecision = async (
        outcome: DecisionOutcome,
        decisionLetter: string,
        notes: string
    ) => {
        setRecordingDecision(true);
        try {
            await applicationsApi.recordDecision(application._id, {
                outcome,
                decisionLetter: decisionLetter || undefined,
                notes: notes || undefined,
            });
            setShowRecordDecisionModal(false);
            onUpdate?.();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to record decision');
        } finally {
            setRecordingDecision(false);
        }
    };

    // ---------- Render ----------
    return (
        <div className="fixed inset-0 z-99999 flex items-center justify-center p-4">
            <button
                type="button"
                className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
                aria-label="Close"
                onClick={onClose}
            />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="application-detail-title"
                className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-theme-xl dark:border-gray-800 dark:bg-gray-dark"
            >
                {/* Header */}
                <div className="sticky top-0 z-20 flex items-start justify-between border-b border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-dark">
                    <div className="flex-1 min-w-0">
                        <h2
                            id="application-detail-title"
                            className="text-lg font-semibold text-gray-800 dark:text-white/90 truncate"
                        >
                            Application Details
                        </h2>
                        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                            ID: {application._id}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                        <button
                            type="button"
                            onClick={() => setShowStageModal(true)}
                            className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600"
                        >
                            Update Stage
                        </button>
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
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {error && (
                        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
                            {error}
                            <button
                                type="button"
                                onClick={() => setError('')}
                                className="ml-3 font-medium underline hover:no-underline"
                            >
                                Dismiss
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* ===== Main column ===== */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Application Information */}
                            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
                                <h3 className="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">
                                    Application Information
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                                            Client
                                        </label>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                            {clientInfo.name}
                                        </p>
                                        {clientInfo.email && (
                                            <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                                                {clientInfo.email}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                                            Visa Type
                                        </label>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                            {VISA_TYPE_LABELS[application.visaType] || application.visaType}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                                            Stage
                                        </label>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE_BADGE_COLORS[application.stage]}`}
                                            >
                                                {STAGE_LABELS[application.stage] || application.stage}
                                            </span>
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                                            Adviser
                                        </label>
                                        <p className="text-sm text-gray-800 dark:text-white/90">
                                            {getAdviserDisplayInfo(application)}
                                        </p>
                                        <button
                                            onClick={() => setShowAssignModal(true)}
                                            className="mt-1 text-xs text-brand-500 hover:text-brand-600 dark:text-brand-400"
                                        >
                                            Change Adviser
                                        </button>
                                    </div>
                                    {application.destinationCountry && (
                                        <div>
                                            <label className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                                                Destination Country
                                            </label>
                                            <p className="text-sm text-gray-800 dark:text-white/90">
                                                {application.destinationCountry.name}
                                            </p>
                                        </div>
                                    )}
                                    {application.inzReference && (
                                        <div>
                                            <label className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                                                INZ Reference
                                            </label>
                                            <p className="text-sm text-gray-800 dark:text-white/90">
                                                {application.inzReference}
                                            </p>
                                        </div>
                                    )}
                                    {application.decisionOutcome && (
                                        <div>
                                            <label className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                                                Decision
                                            </label>
                                            <p
                                                className={`text-sm font-medium ${
                                                    application.decisionOutcome === 'approved'
                                                        ? 'text-green-600 dark:text-green-400'
                                                        : 'text-red-600 dark:text-red-400'
                                                }`}
                                            >
                                                {application.decisionOutcome.charAt(0).toUpperCase() +
                                                    application.decisionOutcome.slice(1)}
                                            </p>
                                        </div>
                                    )}
                                    {application.decisionLetter && (
                                        <div className="col-span-2">
                                            <label className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                                                Decision Letter
                                            </label>
                                            <p className="text-sm text-gray-800 dark:text-white/90">
                                                {application.decisionLetter}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ===== Requests from INZ (RFI / PPI) ===== */}
                            {(rfis.length > 0 || ppis.length > 0 || isRfiOrPpiStage || loadingDeadlines) && (
                                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
                                    <h3 className="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">
                                        Requests from INZ
                                    </h3>

                                    {isRfiOrPpiStage && (
                                        <div
                                            className={`mb-5 rounded-lg border px-4 py-3 text-sm ${
                                                application.stage === 'ppi_received'
                                                    ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300'
                                                    : 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-300'
                                            }`}
                                        >
                                            <strong>
                                                {application.stage === 'ppi_received'
                                                    ? 'PPI Received'
                                                    : 'RFI Received'}
                                            </strong>
                                            {' — '}
                                            Action required. Review the items below and respond before the due date.
                                        </div>
                                    )}

                                    {loadingDeadlines ? (
                                        <div className="flex items-center justify-center py-6">
                                            <span className="size-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                                        </div>
                                    ) : (
                                        <>
                                            {/* RFIs */}
                                            {rfis.length > 0 && (
                                                <div className={ppis.length > 0 ? 'mb-5' : ''}>
                                                    <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                                                        RFIs ({rfis.length})
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {rfis.map((item) => (
                                                            <div
                                                                key={`${item.applicationId}-rfi-${item.deadline.dueDate}`}
                                                                className="rounded-lg border border-yellow-100 bg-yellow-50/50 p-3 dark:border-yellow-500/20 dark:bg-yellow-500/5"
                                                            >
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm text-gray-800 dark:text-white/90">
                                                                            {item.deadline.description || 'Request for further information'}
                                                                        </p>
                                                                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                                                                            <span>Due: {formatDate(item.deadline.dueDate)}</span>
                                                                            {item.overdue ? (
                                                                                <span className="font-medium text-red-600 dark:text-red-400">
                                                                                    Overdue
                                                                                </span>
                                                                            ) : (
                                                                                <span
                                                                                    className={
                                                                                        item.daysRemaining <= 3
                                                                                            ? 'font-medium text-orange-600 dark:text-orange-400'
                                                                                            : ''
                                                                                    }
                                                                                >
                                                                                    {item.daysRemaining === 0
                                                                                        ? 'Due today'
                                                                                        : `${item.daysRemaining} day${item.daysRemaining !== 1 ? 's' : ''} left`}
                                                                                </span>
                                                                            )}
                                                                            {item.deadline.completed && (
                                                                                <span className="text-green-600 dark:text-green-400">
                                                                                    · Completed
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <span className="inline-flex shrink-0 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400">
                                                                        RFI
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* PPIs */}
                                            {ppis.length > 0 && (
                                                <div>
                                                    <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                                                        PPIs ({ppis.length})
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {ppis.map((item) => (
                                                            <div
                                                                key={`${item.applicationId}-ppi-${item.deadline.dueDate}`}
                                                                className="rounded-lg border border-red-100 bg-red-50/50 p-3 dark:border-red-500/20 dark:bg-red-500/5"
                                                            >
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm text-gray-800 dark:text-white/90">
                                                                            {item.deadline.description || 'Potentially prejudicial information'}
                                                                        </p>
                                                                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                                                                            <span>Due: {formatDate(item.deadline.dueDate)}</span>
                                                                            {item.overdue ? (
                                                                                <span className="font-medium text-red-600 dark:text-red-400">
                                                                                    Overdue
                                                                                </span>
                                                                            ) : (
                                                                                <span
                                                                                    className={
                                                                                        item.daysRemaining <= 3
                                                                                            ? 'font-medium text-orange-600 dark:text-orange-400'
                                                                                            : ''
                                                                                    }
                                                                                >
                                                                                    {item.daysRemaining === 0
                                                                                        ? 'Due today'
                                                                                        : `${item.daysRemaining} day${item.daysRemaining !== 1 ? 's' : ''} left`}
                                                                                </span>
                                                                            )}
                                                                            {item.deadline.completed && (
                                                                                <span className="text-green-600 dark:text-green-400">
                                                                                    · Completed
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <span className="inline-flex shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-500/15 dark:text-red-400">
                                                                        PPI
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {rfis.length === 0 && ppis.length === 0 && (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    No RFI or PPI records found yet. Use the buttons on the right to add one.
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Documents section – unchanged from previous version */}
                            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                                        Documents
                                    </h3>
                                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                        <span>
                                            {uploadedCount} uploaded · {approvedCount} approved
                                        </span>
                                        <span>{requiredCount} required</span>
                                    </div>
                                </div>

                                {loadingDocuments ? (
                                    <div className="flex items-center justify-center py-8">
                                        <span className="size-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {checklist.length > 0 && (
                                            <div>
                                                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                                                    Required Documents
                                                </h4>
                                                <div className="space-y-1.5">
                                                    {checklist.map((item, index) => {
                                                        const uploaded = documents.some(
                                                            (doc) => doc.documentType === item.documentType
                                                        );
                                                        const approved = documents.some(
                                                            (doc) =>
                                                                doc.documentType === item.documentType &&
                                                                doc.status === 'approved'
                                                        );
                                                        return (
                                                            <div
                                                                key={index}
                                                                className="flex items-center justify-between text-sm"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <span
                                                                        className={`text-gray-700 dark:text-gray-300 ${
                                                                            item.required ? '' : 'text-gray-400'
                                                                        }`}
                                                                    >
                                                                        {item.documentType}
                                                                    </span>
                                                                    {item.required && (
                                                                        <span className="text-xs text-error-500">*</span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    {uploaded ? (
                                                                        <span
                                                                            className={`inline-flex items-center gap-1 text-xs ${
                                                                                approved
                                                                                    ? 'text-green-600 dark:text-green-400'
                                                                                    : 'text-yellow-600 dark:text-yellow-400'
                                                                            }`}
                                                                        >
                                                                            <span
                                                                                className={`size-1.5 rounded-full ${
                                                                                    approved ? 'bg-green-500' : 'bg-yellow-500'
                                                                                }`}
                                                                            />
                                                                            {approved ? 'Approved' : 'Uploaded'}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-xs text-gray-400">
                                                                            Not uploaded
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {documents.length > 0 && (
                                            <div>
                                                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                                                    Uploaded Documents ({documents.length})
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {documents.map((doc) => (
                                                        <div
                                                            key={doc._id}
                                                            className="flex flex-col rounded-lg border border-gray-100 p-3 hover:shadow-md hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5 transition-all duration-200"
                                                        >
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-start justify-between">
                                                                    <p className="text-sm font-medium text-gray-800 dark:text-white/90 truncate flex-1">
                                                                        {doc.documentType}
                                                                    </p>
                                                                    <span
                                                                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ml-2 whitespace-nowrap ${
                                                                            DOCUMENT_STATUS_BADGE[doc.status || 'pending']
                                                                        }`}
                                                                    >
                                                                        {DOCUMENT_STATUS_LABELS[doc.status || 'pending']}
                                                                    </span>
                                                                </div>
                                                                {doc.fileName && (
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                                                                        📄 {doc.fileName}
                                                                    </p>
                                                                )}
                                                                {doc.expiryDate && (
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                        ⏰ Expires: {formatDate(doc.expiryDate)}
                                                                    </p>
                                                                )}
                                                                {doc.reviewNotes && (
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic truncate">
                                                                        📝 {doc.reviewNotes}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                                                                <button
                                                                    onClick={() => handleDownload(doc._id)}
                                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg dark:text-brand-400 dark:hover:bg-brand-500/10 transition-colors"
                                                                >
                                                                    Download
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedDocument(doc);
                                                                        setReviewStatus(doc.status || 'pending');
                                                                        setReviewNotes(doc.reviewNotes || '');
                                                                        setShowDocumentReview(true);
                                                                    }}
                                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg dark:text-gray-400 dark:hover:bg-white/5 transition-colors"
                                                                >
                                                                    Review
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {documents.length === 0 && checklist.length === 0 && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                                No documents uploaded yet
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Messages with client */}
                            <MessagingPanel
                                applicationId={application._id}
                                currentUserId={getStoredUser()?.id}
                            />

                            {/* Notes */}
                            {application.notes && (
                                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
                                    <h3 className="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">
                                        Notes
                                    </h3>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                        {application.notes}
                                    </p>
                                </div>
                            )}

                            {/* Timeline */}
                            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
                                <h3 className="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">
                                    Timeline
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-2 dark:border-gray-700">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Created</span>
                                        <span className="text-sm text-gray-800 dark:text-white/90">
                                            {new Date(application.createdAt!).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Last Updated</span>
                                        <span className="text-sm text-gray-800 dark:text-white/90">
                                            {new Date(application.updatedAt!).toLocaleString()}
                                        </span>
                                    </div>
                                    {application.createdAt && (
                                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Days Active</span>
                                            <span className="text-sm text-gray-800 dark:text-white/90">
                                                {Math.floor(
                                                    (Date.now() - new Date(application.createdAt).getTime()) /
                                                    (1000 * 60 * 60 * 24)
                                                )}{' '}
                                                days
                                            </span>
                                        </div>
                                    )}
                                    {rfis.length > 0 && (
                                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                Latest RFI due
                                            </span>
                                            <span className="text-sm text-gray-800 dark:text-white/90">
                                                {formatDate(rfis[rfis.length - 1]?.deadline.dueDate)}
                                            </span>
                                        </div>
                                    )}
                                    {ppis.length > 0 && (
                                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                Latest PPI due
                                            </span>
                                            <span className="text-sm text-gray-800 dark:text-white/90">
                                                {formatDate(ppis[ppis.length - 1]?.deadline.dueDate)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                         {/*===== Sidebar ===== */}
                        <div className="space-y-6">
                            {/* Quick Actions */}
                            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
                                <h3 className="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">
                                    Quick Actions
                                </h3>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => setShowStageModal(true)}
                                        className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
                                    >
                                        Update Stage
                                    </button>
                                    <button
                                        onClick={() => setShowAssignModal(true)}
                                        className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5 transition-colors"
                                    >
                                        Assign Advisers
                                    </button>

                                    {application.stage !== 'submitted_to_inz' &&
                                        application.stage !== 'inz_processing' &&
                                        application.stage !== 'rfi_received' &&
                                        application.stage !== 'ppi_received' &&
                                        application.stage !== 'decision' && (
                                            <button
                                                onClick={() => setShowSubmitToInzModal(true)}
                                                className="w-full rounded-lg border border-brand-200 px-4 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-50 dark:border-brand-700 dark:text-brand-300 dark:hover:bg-white/5 transition-colors"
                                            >
                                                Submit to INZ
                                            </button>
                                        )}

                                    {isInzStage && (
                                        <>
                                            <button
                                                onClick={() => setShowAddRfiModal(true)}
                                                className="w-full rounded-lg border border-purple-200 px-4 py-2.5 text-sm font-medium text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-white/5 transition-colors"
                                            >
                                                Add RFI
                                            </button>
                                            <button
                                                onClick={() => setShowAddPpiModal(true)}
                                                className="w-full rounded-lg border border-blue-200 px-4 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-white/5 transition-colors"
                                            >
                                                Add PPI
                                            </button>
                                            <button
                                                onClick={() => setShowRecordDecisionModal(true)}
                                                className="w-full rounded-lg border border-green-200 px-4 py-2.5 text-sm font-medium text-green-600 hover:bg-green-50 dark:border-green-500/30 dark:text-green-400 dark:hover:bg-green-500/10 transition-colors"
                                            >
                                                Record Decision
                                            </button>
                                        </>
                                    )}

                                    <button className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5 transition-colors">
                                        Download All Documents
                                    </button>
                                    <button
                                        className="w-full rounded-lg border border-error-200 px-4 py-2.5 text-sm font-medium text-error-600 hover:bg-error-50 dark:border-error-500/30 dark:text-error-400 dark:hover:bg-error-500/10 transition-colors">
                                        Cancel Application
                                    </button>
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
                                <h3 className="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">
                                    Quick Stats
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 dark:text-gray-400">Status</span>
                                        <span
                                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE_BADGE_COLORS[application.stage]}`}
                                        >
                                            {STAGE_LABELS[application.stage] || application.stage}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 dark:text-gray-400">Visa Type</span>
                                        <span className="text-gray-800 dark:text-white/90 font-medium">
                                            {VISA_TYPE_LABELS[application.visaType] || application.visaType}
                                        </span>
                                    </div>
                                    {application.destinationCountry && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 dark:text-gray-400">Country</span>
                                            <span className="text-gray-800 dark:text-white/90">
                                                {application.destinationCountry.name}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700">
                                        <span className="text-gray-600 dark:text-gray-400">Documents</span>
                                        <span className="text-gray-800 dark:text-white/90">
                                            {approvedCount}/{requiredCount} approved
                                        </span>
                                    </div>
                                    {(rfis.length > 0 || ppis.length > 0) && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 dark:text-gray-400">Open requests</span>
                                            <span className="text-gray-800 dark:text-white/90">
                                                {rfis.filter((r) => !r.deadline.completed).length +
                                                    ppis.filter((p) => !p.deadline.completed).length}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 dark:text-gray-400">Days Active</span>
                                        <span className="text-gray-800 dark:text-white/90">
                                            {Math.floor(
                                                (Date.now() - new Date(application.createdAt!).getTime()) /
                                                (1000 * 60 * 60 * 24)
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-gray-800/50">
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>

            {/* Sub-modals – same as before */}
            {showStageModal && (
                <StageUpdateModal
                    application={application}
                    currentStage={application.stage}
                    newStage={newStage}
                    onStageChange={setNewStage}
                    notes={stageNotes}
                    onNotesChange={setStageNotes}
                    onClose={() => {
                        setShowStageModal(false);
                        setNewStage(application.stage);
                        setStageNotes('');
                    }}
                    onSubmit={handleStageUpdate}
                    loading={updating}
                />
            )}

            {showAssignModal && (
                <AssignAdviserModal
                    application={application}
                    advisers={advisers}
                    selectedAdviserId={selectedAdviserId}
                    onAdviserChange={setSelectedAdviserId}
                    onClose={() => {
                        setShowAssignModal(false);
                        setSelectedAdviserId('');
                    }}
                    onSubmit={handleAssignAdviser}
                    loading={assigning}
                />
            )}

            {showDocumentReview && selectedDocument && (
                <DocumentReviewModal
                    document={selectedDocument}
                    status={reviewStatus}
                    onStatusChange={setReviewStatus}
                    notes={reviewNotes}
                    onNotesChange={setReviewNotes}
                    onClose={() => {
                        setShowDocumentReview(false);
                        setSelectedDocument(null);
                        setReviewStatus('pending');
                        setReviewNotes('');
                    }}
                    onSubmit={handleReviewDocument}
                    loading={reviewing}
                />
            )}

            {showSubmitToInzModal && (
                <SubmitToInzModal
                    applicationId={application._id}
                    onClose={() => setShowSubmitToInzModal(false)}
                    onSubmit={handleSubmitToInz}
                    loading={submittingToInz}
                />
            )}

            {showAddRfiModal && (
                <AddRfiModal
                    applicationId={application._id}
                    onClose={() => setShowAddRfiModal(false)}
                    onSubmit={handleAddRfi}
                    loading={addingRfi}
                />
            )}

            {showAddPpiModal && (
                <AddPpiModal
                    applicationId={application._id}
                    onClose={() => setShowAddPpiModal(false)}
                    onSubmit={handleAddPpi}
                    loading={addingPpi}
                />
            )}

            {showRecordDecisionModal && (
                <RecordDecisionModal
                    applicationId={application._id}
                    onClose={() => setShowRecordDecisionModal(false)}
                    onSubmit={handleRecordDecision}
                    loading={recordingDecision}
                />
            )}
        </div>
    );
}

// ---------- Document Review Modal (unchanged) ----------
interface DocumentReviewModalProps {
    document: DocumentItem;
    status: DocumentReviewStatus;
    onStatusChange: (status: DocumentReviewStatus) => void;
    notes: string;
    onNotesChange: (notes: string) => void;
    onClose: () => void;
    onSubmit: () => void;
    loading: boolean;
}

function DocumentReviewModal({
                                 document,
                                 status,
                                 onStatusChange,
                                 notes,
                                 onNotesChange,
                                 onClose,
                                 onSubmit,
                                 loading,
                             }: DocumentReviewModalProps) {
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
                            Review Document
                        </h2>
                        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                            {document.documentType}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5"
                    >
                        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                            Review Status <span className="text-error-500">*</span>
                        </label>
                        <select
                            value={status}
                            onChange={(e) => onStatusChange(e.target.value as DocumentReviewStatus)}
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
                            value={notes}
                            onChange={(e) => onNotesChange(e.target.value)}
                            placeholder="Add notes about this document review..."
                            rows={3}
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
                            {loading ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}