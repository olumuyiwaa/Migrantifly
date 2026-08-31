'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    applicationsApi,
    documentsApi,
    ApiError,
    type Application,
    type VisaType,
} from '@/lib/api';

// ---------- types ----------

type DocRow = {
    _id: string;
    type?: string;
    documentType?: string;
    name?: string;
    originalName?: string;
    status?: string;
    fileUrl?: string;
    reviewNotes?: string;
    createdAt?: string;
    applicationId?: string | { _id?: string };
    /** enriched */
    visaType?: string;
    applicationLabel?: string;
};

// ---------- helpers ----------

function extractApplications(res: unknown): Application[] {
    if (!res || typeof res !== 'object') return [];
    const r = res as Record<string, unknown>;
    if (Array.isArray(r.data)) return r.data as Application[];
    if (Array.isArray(r.applications)) return r.applications as Application[];
    if (Array.isArray(res)) return res as Application[];
    if (r.data && typeof r.data === 'object' && !Array.isArray(r.data)) {
        const nested = r.data as Record<string, unknown>;
        if (Array.isArray(nested.applications)) {
            return nested.applications as Application[];
        }
        if (Array.isArray(nested.data)) return nested.data as Application[];
    }
    return [];
}

function extractDocuments(res: unknown): DocRow[] {
    if (!res || typeof res !== 'object') return [];
    const r = res as Record<string, unknown>;
    if (Array.isArray(r.data)) return r.data as DocRow[];
    if (Array.isArray(r.documents)) return r.documents as DocRow[];
    if (Array.isArray(res)) return res as DocRow[];
    if (r.data && typeof r.data === 'object' && !Array.isArray(r.data)) {
        const nested = r.data as Record<string, unknown>;
        if (Array.isArray(nested.documents)) return nested.documents as DocRow[];
        if (Array.isArray(nested.data)) return nested.data as DocRow[];
    }
    return [];
}

function labelize(s?: string): string {
    if (!s) return '—';
    return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

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

function appIdOf(doc: DocRow): string | undefined {
    if (!doc.applicationId) return undefined;
    if (typeof doc.applicationId === 'string') return doc.applicationId;
    return doc.applicationId._id;
}

function statusClass(status?: string): string {
    switch (status) {
        case 'approved':
            return 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400';
        case 'rejected':
            return 'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400';
        case 'pending':
            return 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400';
        default:
            return 'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300';
    }
}

const FALLBACK_DOC_TYPES = [
    'passport',
    'photo',
    'birth_certificate',
    'job_offer',
    'employment_contract',
    'qualification',
    'police_clearance',
    'medical',
    'bank_statement',
    'relationship_evidence',
    'other',
];

// ---------- page ----------

export default function ClientDocumentsPage() {
    const [apps, setApps] = useState<Application[]>([]);
    const [docs, setDocs] = useState<DocRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [statusFilter, setStatusFilter] = useState('');
    const [appFilter, setAppFilter] = useState('');

    // upload / delete
    const [uploadOpen, setUploadOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const appsRes = await applicationsApi.myApplications();
            const applications = extractApplications(appsRes);
            setApps(applications);

            if (applications.length === 0) {
                setDocs([]);
                return;
            }

            const results = await Promise.allSettled(
                applications.map((a) => documentsApi.byApplication(a._id))
            );

            const byApp = new Map(
                applications.map((a) => [
                    a._id,
                    {
                        visaType: a.visaType,
                        label: `${labelize(a.visaType)} · ${a._id.slice(-6)}`,
                    },
                ])
            );

            const merged: DocRow[] = [];
            results.forEach((result, i) => {
                const app = applications[i];
                if (result.status !== 'fulfilled') return;
                const list = extractDocuments(result.value);
                for (const d of list) {
                    const meta = byApp.get(app._id);
                    merged.push({
                        ...d,
                        applicationId: appIdOf(d) || app._id,
                        visaType: meta?.visaType,
                        applicationLabel: meta?.label,
                    });
                }
            });

            merged.sort((a, b) => {
                const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return tb - ta;
            });
            setDocs(merged);
        } catch (err) {
            setError(
                err instanceof ApiError ? err.message : 'Failed to load documents'
            );
            setDocs([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const handleDelete = async (doc: DocRow) => {
        if (doc.status === 'approved') return;
        const label = doc.originalName || doc.name || doc.type || 'this document';
        if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;

        setDeletingId(doc._id);
        setActionError(null);
        try {
            await documentsApi.delete(doc._id);
            setDocs((prev) => prev.filter((d) => d._id !== doc._id));
        } catch (err) {
            setActionError(
                err instanceof ApiError ? err.message : 'Failed to delete document'
            );
        } finally {
            setDeletingId(null);
        }
    };

    const filtered = useMemo(() => {
        return docs.filter((d) => {
            if (statusFilter && d.status !== statusFilter) return false;
            if (appFilter) {
                const id = appIdOf(d);
                if (id !== appFilter) return false;
            }
            return true;
        });
    }, [docs, statusFilter, appFilter]);

    const counts = useMemo(() => {
        const c = { total: docs.length, pending: 0, approved: 0, rejected: 0 };
        for (const d of docs) {
            if (d.status === 'pending') c.pending++;
            else if (d.status === 'approved') c.approved++;
            else if (d.status === 'rejected') c.rejected++;
        }
        return c;
    }, [docs]);

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">
                        My documents
                    </h1>
                    <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                        Files uploaded across your visa applications
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={load}
                        className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                    >
                        Refresh
                    </button>
                    <button
                        type="button"
                        onClick={() => setUploadOpen(true)}
                        disabled={apps.length === 0}
                        className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                    >
                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Upload
                    </button>
                </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Total" value={counts.total} />
                <Stat label="Pending" value={counts.pending} />
                <Stat label="Approved" value={counts.approved} />
                <Stat label="Rejected" value={counts.rejected} />
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs sm:flex-row dark:border-gray-800 dark:bg-gray-dark">
                <div className="w-full sm:w-48">
                    <label className="mb-1.5 block text-theme-xs font-medium text-gray-500">
                        Status
                    </label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                    >
                        <option value="">All statuses</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
                <div className="w-full sm:w-64">
                    <label className="mb-1.5 block text-theme-xs font-medium text-gray-500">
                        Application
                    </label>
                    <select
                        value={appFilter}
                        onChange={(e) => setAppFilter(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                    >
                        <option value="">All applications</option>
                        {apps.map((a) => (
                            <option key={a._id} value={a._id}>
                                {labelize(a.visaType)} · {a._id.slice(-6)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {error && (
                <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
                    {error}
                    <button type="button" onClick={load} className="ml-3 font-medium underline">
                        Retry
                    </button>
                </div>
            )}
            {actionError && (
                <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
                    {actionError}
                    <button
                        type="button"
                        onClick={() => setActionError(null)}
                        className="ml-3 font-medium underline"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-gray-500">
                    <span className="size-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                    Loading documents…
                </div>
            ) : apps.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 px-4 py-16 text-center dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        You need an application before you can upload documents.
                    </p>
                    <Link
                        href="/portal/my-applications"
                        className="mt-3 inline-block text-sm font-medium text-brand-500 hover:text-brand-600"
                    >
                        Go to applications
                    </Link>
                </div>
            ) : filtered.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 px-4 py-16 text-center dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        No documents match these filters.
                    </p>
                    <button
                        type="button"
                        onClick={() => setUploadOpen(true)}
                        className="mt-3 text-sm font-medium text-brand-500 hover:text-brand-600"
                    >
                        Upload a document
                    </button>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px] text-left text-sm">
                            <thead>
                            <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03]">
                                <th className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400">
                                    Document
                                </th>
                                <th className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400">
                                    Application
                                </th>
                                <th className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400">
                                    Status
                                </th>
                                <th className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400">
                                    Uploaded
                                </th>
                                <th className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                            </thead>
                            <tbody>
                            {filtered.map((d) => {
                                const type = d.type || d.documentType;
                                const appId = appIdOf(d);
                                return (
                                    <tr
                                        key={d._id}
                                        className="border-b border-gray-100 last:border-0 dark:border-gray-800/60"
                                    >
                                        <td className="px-5 py-3">
                                            <p className="font-medium capitalize text-gray-800 dark:text-white/90">
                                                {labelize(type)}
                                            </p>
                                            <p className="truncate text-theme-xs text-gray-500">
                                                {d.originalName || d.name || '—'}
                                            </p>
                                            {d.reviewNotes && (
                                                <p className="mt-1 text-theme-xs text-gray-400">
                                                    {d.reviewNotes}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-5 py-3 text-gray-600 dark:text-gray-300">
                                            {appId ? (
                                                <Link
                                                    href={`/portal/my-applications/${appId}`}
                                                    className="text-brand-500 hover:text-brand-600"
                                                >
                                                    {d.applicationLabel || appId.slice(-6)}
                                                </Link>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                        <td className="px-5 py-3">
                        <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusClass(d.status)}`}
                        >
                          {d.status || 'pending'}
                        </span>
                                        </td>
                                        <td className="px-5 py-3 text-gray-600 dark:text-gray-300">
                                            {formatDate(d.createdAt)}
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                {d.fileUrl ? (
                                                    <a
                                                        href={d.fileUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm font-medium text-brand-500 hover:text-brand-600"
                                                    >
                                                        View
                                                    </a>
                                                ) : null}
                                                {d.status !== 'approved' && (
                                                    <button
                                                        type="button"
                                                        disabled={deletingId === d._id}
                                                        onClick={() => handleDelete(d)}
                                                        className="text-sm font-medium text-error-600 hover:text-error-700 disabled:opacity-50 dark:text-error-400"
                                                    >
                                                        {deletingId === d._id ? 'Deleting…' : 'Delete'}
                                                    </button>
                                                )}
                                                {d.status === 'approved' && !d.fileUrl && (
                                                    <span className="text-theme-xs text-gray-400">—</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {uploadOpen && (
                <UploadModal
                    apps={apps}
                    onClose={() => setUploadOpen(false)}
                    onUploaded={() => {
                        setUploadOpen(false);
                        load();
                    }}
                />
            )}
        </div>
    );
}

function Stat({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
            <p className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                {label}
            </p>
            <p className="mt-1 text-xl font-semibold text-gray-800 dark:text-white/90">
                {value}
            </p>
        </div>
    );
}

// ---------- upload modal ----------

function UploadModal({
                         apps,
                         onClose,
                         onUploaded,
                     }: {
    apps: Application[];
    onClose: () => void;
    onUploaded: () => void;
}) {
    const [applicationId, setApplicationId] = useState(apps[0]?._id || '');
    const [docType, setDocType] = useState('passport');
    const [typeOptions, setTypeOptions] = useState<string[]>([...FALLBACK_DOC_TYPES]);
    const [expiryDate, setExpiryDate] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Load checklist types for selected application visa
    useEffect(() => {
        const app = apps.find((a) => a._id === applicationId);
        if (!app?.visaType) {
            setTypeOptions([...FALLBACK_DOC_TYPES]);
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const res = await documentsApi.checklist(app.visaType as VisaType);
                const r = res as { data?: { documents?: Array<{ type?: string }> } };
                const list = r?.data?.documents;
                if (!cancelled && Array.isArray(list) && list.length > 0) {
                    const types = list
                        .map((d) => d.type)
                        .filter((t): t is string => Boolean(t));
                    if (types.length) {
                        setTypeOptions(types);
                        setDocType(types[0]);
                        return;
                    }
                }
            } catch {
                /* fallback */
            }
            if (!cancelled) setTypeOptions([...FALLBACK_DOC_TYPES]);
        })();
        return () => {
            cancelled = true;
        };
    }, [applicationId, apps]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        if (!applicationId) {
            setFormError('Select an application.');
            return;
        }
        if (!file) {
            setFormError('Choose a file.');
            return;
        }
        setSubmitting(true);
        try {
            await documentsApi.upload(
                {
                    applicationId,
                    documentType: docType,
                    ...(expiryDate ? { expiryDate } : {}),
                },
                file
            );
            onUploaded();
        } catch (err) {
            setFormError(err instanceof ApiError ? err.message : 'Upload failed');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-99999 flex items-center justify-center p-4">
            <button
                type="button"
                className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
                aria-label="Close"
                onClick={onClose}
            />
            <div
                role="dialog"
                aria-modal="true"
                className="relative z-10 w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xl dark:border-gray-800 dark:bg-gray-dark"
            >
                <div className="mb-5 flex items-start justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                            Upload document
                        </h2>
                        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                            Attach a file to one of your applications.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                    >
                        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {formError && (
                        <div className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
                            {formError}
                        </div>
                    )}

                    <div>
                        <label className="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">
                            Application <span className="text-error-500">*</span>
                        </label>
                        <select
                            value={applicationId}
                            onChange={(e) => setApplicationId(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                        >
                            {apps.map((a) => (
                                <option key={a._id} value={a._id}>
                                    {labelize(a.visaType)} · {a._id.slice(-6)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">
                            Document type <span className="text-error-500">*</span>
                        </label>
                        <select
                            value={docType}
                            onChange={(e) => setDocType(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                        >
                            {typeOptions.map((t) => (
                                <option key={t} value={t}>
                                    {labelize(t)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">
                            Expiry <span className="text-gray-400">(optional)</span>
                        </label>
                        <input
                            type="date"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">
                            File <span className="text-error-500">*</span>
                        </label>
                        <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.webp"
                            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                            className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100 dark:text-gray-300 dark:file:bg-brand-500/15 dark:file:text-brand-400"
                        />
                        {file && (
                            <p className="mt-1 text-theme-xs text-gray-500">
                                {file.name} ({Math.round(file.size / 1024)} KB)
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !file}
                            className="flex-1 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                        >
                            {submitting ? 'Uploading…' : 'Upload'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}