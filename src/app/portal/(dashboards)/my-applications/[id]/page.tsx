'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  applicationsApi,
  documentsApi,
  ApiError,
} from '@/lib/api';
import RequiredDocumentsSection from "@/components/applications/RequiredDocumentsSection";

// ---------- types (flexible — dashboard payload varies) ----------

type TimelineItem = {
  _id?: string;
  stage?: string;
  date?: string;
  notes?: string;
  updatedBy?: string;
};

type DeadlineItem = {
  _id?: string;
  type?: string;
  description?: string;
  dueDate?: string;
  completed?: boolean;
};

type PopulatedPerson = {
  _id?: string;
  email?: string;
  profile?: { firstName?: string; lastName?: string; phone?: string };
};

type ApplicationCore = {
  _id: string;
  visaType?: string;
  stage?: string;
  progress?: number;
  inzReference?: string;
  outcome?: string;
  decisionOutcome?: string;
  decisionLetter?: string;
  submissionDate?: string;
  decisionDate?: string;
  createdAt?: string;
  updatedAt?: string;
  consultationId?: string;
  destinationCountry?: { code?: string; name?: string };
  clientId?: PopulatedPerson | string;
  adviserId?: PopulatedPerson | string;
  timeline?: TimelineItem[];
  deadlines?: DeadlineItem[];
};

type DocumentRow = {
  _id: string;
  type?: string;
  documentType?: string;
  name?: string;
  originalName?: string;
  status?: string;
  fileUrl?: string;
  createdAt?: string;
  reviewNotes?: string;
};

type DashboardPayload = {
  application?: ApplicationCore;
  documents?: DocumentRow[];
  checklist?: unknown;
  [key: string]: unknown;
};

// ---------- helpers ----------

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

function personName(p?: PopulatedPerson | string): string {
  if (!p) return '—';
  if (typeof p === 'string') return p.slice(-6);
  const name = [p.profile?.firstName, p.profile?.lastName]
    .filter(Boolean)
    .join(' ');
  return name || p.email || '—';
}

function extractDashboard(res: unknown): {
  application: ApplicationCore | null;
  documents: DocumentRow[];
  raw: DashboardPayload | null;
} {
  if (!res || typeof res !== 'object') {
    return { application: null, documents: [], raw: null };
  }
  const r = res as Record<string, unknown>;
  const data = (r.data ?? r) as Record<string, unknown>;

  // Shape A: { data: { application, documents, ... } }
  if (data.application && typeof data.application === 'object') {
    return {
      application: data.application as ApplicationCore,
      documents: Array.isArray(data.documents)
        ? (data.documents as DocumentRow[])
        : [],
      raw: data as DashboardPayload,
    };
  }

  // Shape B: { data: Application } — application is the payload itself
  if (data._id && (data.visaType || data.stage)) {
    return {
      application: data as unknown as ApplicationCore,
      documents: Array.isArray(data.documents)
        ? (data.documents as DocumentRow[])
        : [],
      raw: data as DashboardPayload,
    };
  }

  return { application: null, documents: [], raw: data as DashboardPayload };
}

function extractDocuments(res: unknown): DocumentRow[] {
  if (!res || typeof res !== 'object') return [];
  const r = res as Record<string, unknown>;
  if (Array.isArray(r.data)) return r.data as DocumentRow[];
  if (Array.isArray(r.documents)) return r.documents as DocumentRow[];
  if (r.data && typeof r.data === 'object' && !Array.isArray(r.data)) {
    const nested = r.data as Record<string, unknown>;
    if (Array.isArray(nested.documents)) return nested.documents as DocumentRow[];
  }
  return [];
}

const STAGE_ORDER = [
  'consultation',
  'deposit_paid',
  'documents_completed',
  'additional_docs_required',
  'submitted_to_inz',
  'inz_processing',
  'rfi_received',
  'ppi_received',
  'decision',
];

const DOCUMENT_TYPES = [
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
] as const;

// ---------- page ----------

export default function ClientApplicationDetailPage() {
  const params = useParams();
  const id = String(params?.id ?? '');

  const [app, setApp] = useState<ApplicationCore | null>(null);
  const [docs, setDocs] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // upload form
  const [docType, setDocType] = useState<string>('passport');
  const [expiryDate, setExpiryDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [dashRes, docsRes] = await Promise.allSettled([
        applicationsApi.dashboard(id),
        documentsApi.byApplication?.(id) ??
          documentsApi.list?.({ applicationId: id } as never) ??
          Promise.resolve(null),
      ]);

      if (dashRes.status === 'fulfilled') {
        const parsed = extractDashboard(dashRes.value);
        if (parsed.application) {
          setApp(parsed.application);
          if (parsed.documents.length > 0) setDocs(parsed.documents);
        } else {
          setError('Application not found in dashboard response');
        }
      } else {
        const reason = dashRes.reason;
        throw reason instanceof ApiError
          ? reason
          : new ApiError('Failed to load application', 500);
      }

      if (docsRes.status === 'fulfilled' && docsRes.value) {
        const list = extractDocuments(docsRes.value);
        if (list.length > 0) setDocs(list);
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to load application'
      );
      setApp(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const reloadDocuments = async () => {
    try {
      const docsRes = await documentsApi.byApplication(id);
      const list = extractDocuments(docsRes);
      setDocs(list);
    } catch {
      // keep existing list
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    setUploadSuccess(null);
    if (!file) {
      setUploadError('Choose a file to upload.');
      return;
    }
    if (!docType) {
      setUploadError('Select a document type.');
      return;
    }
    setUploading(true);
    try {
      await documentsApi.upload(
        {
          applicationId: id,
          documentType: docType,
          ...(expiryDate ? { expiryDate } : {}),
        },
        file
      );
      setUploadSuccess('Document uploaded successfully.');
      setFile(null);
      setExpiryDate('');
      await reloadDocuments();
    } catch (err) {
      setUploadError(
        err instanceof ApiError ? err.message : 'Upload failed'
      );
    } finally {
      setUploading(false);
    }
  };

  const progress = useMemo(() => {
    if (!app) return 0;
    if (typeof app.progress === 'number') return app.progress;
    const idx = STAGE_ORDER.indexOf(String(app.stage));
    if (idx < 0) return 0;
    return Math.round(((idx + 1) / STAGE_ORDER.length) * 100);
  }, [app]);

  const openDeadlines = useMemo(
    () => (app?.deadlines ?? []).filter((d) => !d.completed),
    [app]
  );

  const timeline = useMemo(() => {
    const t = [...(app?.timeline ?? [])];
    t.sort((a, b) => {
      const ta = a.date ? new Date(a.date).getTime() : 0;
      const tb = b.date ? new Date(b.date).getTime() : 0;
      return ta - tb;
    });
    return t;
  }, [app]);

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center gap-2 text-gray-500">
        <span className="size-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        Loading application…
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <Link
          href="/portal/my-applications"
          className="text-sm font-medium text-brand-500 hover:text-brand-600"
        >
          ← Back to applications
        </Link>
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          {error || 'Application not found'}
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/portal/my-applications"
            className="text-theme-xs font-medium text-brand-500 hover:text-brand-600"
          >
            ← Back to applications
          </Link>
          <h1 className="mt-2 text-title-sm font-semibold capitalize text-gray-800 dark:text-white/90">
            {labelize(app.visaType)} visa
          </h1>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            {app.destinationCountry?.name ||
              app.destinationCountry?.code ||
              '—'}
            {' · '}
            <span className="capitalize">{labelize(app.stage)}</span>
            {app.inzReference ? ` · ${app.inzReference}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="self-start rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
        >
          Refresh
        </button>
      </div>

      {/* Progress */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
        <div className="mb-2 flex justify-between text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Overall progress
          </span>
          <span className="text-gray-500">{progress}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
          <div
            className="h-full rounded-full bg-brand-500 transition-all"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
        {/* Stage chips */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {STAGE_ORDER.map((s) => {
            const reached =
              STAGE_ORDER.indexOf(s) <= STAGE_ORDER.indexOf(String(app.stage));
            const current = s === app.stage;
            return (
              <span
                key={s}
                className={`rounded-full px-2 py-0.5 text-theme-xs capitalize ${
                  current
                    ? 'bg-brand-500 text-white'
                    : reached
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400'
                      : 'bg-gray-100 text-gray-400 dark:bg-white/5'
                }`}
              >
                {labelize(s)}
              </span>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Timeline */}
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Timeline
            </h2>
            {timeline.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">No timeline events yet</p>
            ) : (
              <ol className="relative mt-4 space-y-0 border-l border-gray-200 pl-4 dark:border-gray-700">
                {timeline.map((item, i) => (
                  <li key={item._id || i} className="relative pb-6 last:pb-0">
                    <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full border-2 border-white bg-brand-500 dark:border-gray-dark" />
                    <p className="text-sm font-medium capitalize text-gray-800 dark:text-white/90">
                      {labelize(item.stage)}
                    </p>
                    <p className="text-theme-xs text-gray-400">
                      {formatDateTime(item.date)}
                    </p>
                    {item.notes && (
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        {item.notes}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* Required Documents */}
          {app.visaType && (
              <RequiredDocumentsSection
                  documents={docs}
                  visaType={app.visaType}
              />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Details
            </h2>
            <dl className="mt-3 space-y-3 text-sm">
              <Row label="Visa type" value={labelize(app.visaType)} />
              <Row label="Stage" value={labelize(app.stage)} />
              <Row
                label="Country"
                value={
                  app.destinationCountry?.name ||
                  app.destinationCountry?.code ||
                  '—'
                }
              />
              <Row label="Adviser" value={personName(app.adviserId)} />
              <Row label="INZ reference" value={app.inzReference || '—'} />
              <Row
                label="Submitted"
                value={formatDate(app.submissionDate)}
              />
              <Row
                label="Outcome"
                value={labelize(app.outcome || app.decisionOutcome)}
              />
              <Row label="Created" value={formatDate(app.createdAt)} />
              <Row label="Updated" value={formatDate(app.updatedAt)} />
            </dl>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
            <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                Upload Documents
              </h2>
              <p className="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">
                Upload files for this application. Supported types depend on your visa pathway.
              </p>
            </div>

            {/* Upload form */}
            <form
                onSubmit={handleUpload}
                className="space-y-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800"
            >
              {uploadError && (
                  <div className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
                    {uploadError}
                  </div>
              )}
              {uploadSuccess && (
                  <div className="rounded-lg border border-success-200 bg-success-50 px-3 py-2 text-sm text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400">
                    {uploadSuccess}
                  </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">
                    Document type <span className="text-error-500">*</span>
                  </label>
                  <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                  >
                    {DOCUMENT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {labelize(t)}
                        </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">
                    Expiry date <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                  />
                </div>
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
                      Selected: {file.name} ({Math.round(file.size / 1024)} KB)
                    </p>
                )}
              </div>

              <button
                  type="submit"
                  disabled={uploading || !file}
                  className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {uploading ? 'Uploading…' : 'Upload document'}
              </button>
            </form>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Open deadlines
            </h2>
            {openDeadlines.length === 0 ? (
                <p className="mt-3 text-sm text-gray-500">None pending</p>
            ) : (
                <ul className="mt-3 space-y-3">
                  {openDeadlines.map((d) => (
                      <li key={d._id || d.type}>
                        <p className="text-sm font-medium capitalize text-gray-800 dark:text-white/90">
                          {labelize(d.type)}
                        </p>
                        {d.description && (
                            <p className="text-theme-xs text-gray-500">
                              {d.description}
                            </p>
                        )}
                        <p className="text-theme-xs text-gray-400">
                          Due {formatDate(d.dueDate)}
                        </p>
                      </li>
                  ))}
                </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="text-right font-medium text-gray-800 dark:text-white/90">
        {value}
      </dd>
    </div>
  );
}