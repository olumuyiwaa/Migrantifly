'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  applicationsApi,
  ApiError,
  type Application,
  type CreateApplicationRequest,
  type VisaType,
} from '@/lib/api';

// ---------- constants ----------

const VISA_TYPES: VisaType[] = [
  'work',
  'partner',
  'student',
  'residence',
  'visitor',
  'business',
];

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

function adviserLabel(adviser: unknown): string {
  if (!adviser) return 'Unassigned';
  if (typeof adviser === 'string') return 'Assigned';
  const a = adviser as {
    email?: string;
    profile?: { firstName?: string; lastName?: string };
  };
  const name = [a.profile?.firstName, a.profile?.lastName]
    .filter(Boolean)
    .join(' ');
  return name || a.email || 'Adviser';
}

function countryLabel(app: Application): string {
  const any = app as Application & {
    destinationCountry?: { code?: string; name?: string };
  };
  return (
    any.destinationCountry?.name ||
    any.destinationCountry?.code ||
    '—'
  );
}

function progressOf(app: Application): number {
  const any = app as Application & { progress?: number };
  if (typeof any.progress === 'number') return any.progress;
  const idx = STAGE_ORDER.indexOf(String(app.stage));
  if (idx < 0) return 0;
  return Math.round(((idx + 1) / STAGE_ORDER.length) * 100);
}

// ---------- page ----------

export default function ClientApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState('');
  const [visaFilter, setVisaFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await applicationsApi.myApplications();
      const list = extractApplications(res);
      list.sort((a, b) => {
        const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return tb - ta;
      });
      setApps(list);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to load applications'
      );
      setApps([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return apps.filter((a) => {
      if (stageFilter && a.stage !== stageFilter) return false;
      if (visaFilter && a.visaType !== visaFilter) return false;
      return true;
    });
  }, [apps, stageFilter, visaFilter]);

  const stagesInData = useMemo(() => {
    const set = new Set(apps.map((a) => a.stage).filter(Boolean));
    return Array.from(set);
  }, [apps]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">
            My applications
          </h1>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            Track progress on your visa applications
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
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New application
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs sm:flex-row dark:border-gray-800 dark:bg-gray-dark">
        <div className="w-full sm:w-48">
          <label className="mb-1.5 block text-theme-xs font-medium text-gray-500">
            Stage
          </label>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
          >
            <option value="">All stages</option>
            {stagesInData.map((s) => (
              <option key={s} value={s}>
                {labelize(s)}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-48">
          <label className="mb-1.5 block text-theme-xs font-medium text-gray-500">
            Visa type
          </label>
          <select
            value={visaFilter}
            onChange={(e) => setVisaFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
          >
            <option value="">All types</option>
            {VISA_TYPES.map((v) => (
              <option key={v} value={v}>
                {labelize(v)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          {error}
          <button
            type="button"
            onClick={load}
            className="ml-3 font-medium underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-gray-500">
          <span className="size-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          Loading applications…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 px-4 py-16 text-center dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {apps.length === 0
              ? 'You have no applications yet.'
              : 'No applications match these filters.'}
          </p>
          {apps.length === 0 && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="mt-3 text-sm font-medium text-brand-500 hover:text-brand-600"
            >
              Start a new application
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((app) => {
            const progress = progressOf(app);
            const any = app as Application & {
              deadlines?: Array<{ completed?: boolean; type?: string; dueDate?: string; _id?: string }>;
              timeline?: Array<{ notes?: string; date?: string; stage?: string }>;
              inzReference?: string;
              progress?: number;
            };
            const openDeadlines = (any.deadlines ?? []).filter((d) => !d.completed);
            const latest =
              any.timeline && any.timeline.length > 0
                ? any.timeline[any.timeline.length - 1]
                : null;

            return (
              <article
                key={app._id}
                className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-semibold capitalize text-gray-800 dark:text-white/90">
                        {labelize(app.visaType)} visa
                      </h2>
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium capitalize text-gray-600 dark:bg-white/5 dark:text-gray-300">
                        {labelize(app.stage)}
                      </span>
                    </div>
                    <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                      {countryLabel(app)}
                      {' · '}
                      Adviser: {adviserLabel(app.adviserId)}
                      {any.inzReference ? ` · ${any.inzReference}` : ''}
                    </p>
                  </div>
                  <Link
                    href={`/portal/my-applications/${app._id}`}
                    className="shrink-0 text-theme-xs font-medium text-brand-500 hover:text-brand-600"
                  >
                    Details
                  </Link>
                </div>

                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-theme-xs text-gray-500">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                    />
                  </div>
                </div>

                {latest && (
                  <div className="mt-4 rounded-lg bg-gray-50 px-3 py-2 dark:bg-white/[0.03]">
                    <p className="text-theme-xs font-medium text-gray-500">
                      Latest · {formatDate(latest.date)}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-sm text-gray-700 dark:text-gray-300">
                      {latest.notes || labelize(latest.stage)}
                    </p>
                  </div>
                )}

                {openDeadlines.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {openDeadlines.slice(0, 3).map((d) => (
                      <span
                        key={d._id || d.type}
                        className="rounded-full bg-warning-50 px-2 py-0.5 text-theme-xs text-warning-700 dark:bg-warning-500/15 dark:text-warning-400"
                      >
                        {labelize(d.type)} · {formatDate(d.dueDate)}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-theme-xs text-gray-400 dark:border-gray-800">
                  <span>Updated {formatDate(app.updatedAt || app.createdAt)}</span>
                  <Link
                    href={`/portal/my-applications/${app._id}`}
                    className="font-medium text-brand-500 hover:text-brand-600"
                  >
                    Open dashboard →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {createOpen && (
        <CreateApplicationModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}

// ---------- create modal ----------

function CreateApplicationModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [visaType, setVisaType] = useState<VisaType>('work');
  const [countryCode, setCountryCode] = useState('NZ');
  const [countryName, setCountryName] = useState('New Zealand');
  const [consultationId, setConsultationId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const body: CreateApplicationRequest = {
        visaType,
        destinationCountry: {
          code: countryCode.trim() || 'NZ',
          name: countryName.trim() || 'New Zealand',
        },
      };
      if (consultationId.trim()) {
        body.consultationId = consultationId.trim();
      }
      await applicationsApi.create(body);
      onCreated();
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : 'Failed to create application'
      );
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
              New application
            </h2>
            <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
              Start a visa application. You can upload documents after creation.
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
              Visa type <span className="text-error-500">*</span>
            </label>
            <select
              value={visaType}
              onChange={(e) => setVisaType(e.target.value as VisaType)}
              className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
            >
              {VISA_TYPES.map((v) => (
                <option key={v} value={v}>
                  {labelize(v)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">
                Country code
              </label>
              <input
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                maxLength={3}
                placeholder="NZ"
                className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">
                Country name
              </label>
              <input
                value={countryName}
                onChange={(e) => setCountryName(e.target.value)}
                placeholder="New Zealand"
                className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">
              Consultation ID <span className="text-gray-400">(optional)</span>
            </label>
            <input
              value={consultationId}
              onChange={(e) => setConsultationId(e.target.value)}
              placeholder="Link a completed consultation"
              className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
            />
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
              disabled={submitting}
              className="flex-1 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {submitting ? 'Creating…' : 'Create application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}