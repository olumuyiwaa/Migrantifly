// components/RequiredDocumentsSection.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  documentsApi,
  ApiError,
  type VisaType,
} from '@/lib/api';

// ---------- types ----------

/** Matches GET /documents/checklist/:visaType → data.documents[] */
type ChecklistItem = {
  type: string;
  name: string;
  description?: string;
  required: boolean;
  formats?: string[];
};

/** Minimal shape from parent-uploaded docs */
type UploadedDoc = {
  type?: string;
  documentType?: string;
  status?: string;
  originalName?: string;
  name?: string;
  reviewNotes?: string;
  fileUrl?: string;
};

export type RequiredDocumentsSectionProps = {
  visaType: string;
  /** Parent-loaded uploads — only used for status badges */
  documents?: UploadedDoc[];
  className?: string;
};

// ---------- helpers ----------

function labelize(s?: string): string {
  if (!s) return '—';
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Supports:
 *  { success, data: { visaType, documents: [...] } }  ← real API
 *  { data: [...] }
 *  { checklist: [...] }
 *  [ ... ]
 */
function extractChecklist(res: unknown): ChecklistItem[] {
  if (!res || typeof res !== 'object') return [];
  const r = res as Record<string, unknown>;

  let list: unknown[] = [];

  if (Array.isArray(r.data)) {
    list = r.data;
  } else if (r.data && typeof r.data === 'object' && !Array.isArray(r.data)) {
    const nested = r.data as Record<string, unknown>;
    // Primary shape: data.documents
    if (Array.isArray(nested.documents)) list = nested.documents;
    else if (Array.isArray(nested.checklist)) list = nested.checklist;
    else if (Array.isArray(nested.items)) list = nested.items;
    else if (Array.isArray(nested.data)) list = nested.data;
  } else if (Array.isArray(r.documents)) {
    list = r.documents;
  } else if (Array.isArray(r.checklist)) {
    list = r.checklist;
  } else if (Array.isArray(res)) {
    list = res as unknown[];
  }

  return list
      .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
      .map((x) => {
        const type = String(x.type || x.documentType || '');
        const name = String(x.name || labelize(type) || 'Document');
        return {
          type,
          name,
          description: x.description ? String(x.description) : undefined,
          required: Boolean(x.required ?? true),
          formats: Array.isArray(x.formats)
              ? (x.formats as unknown[]).map(String)
              : undefined,
        };
      })
      .filter((x) => x.type);
}

function statusBadgeClass(status?: string): string {
  switch (status) {
    case 'approved':
      return 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400';
    case 'rejected':
      return 'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400';
    case 'pending':
      return 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400';
    default:
      return 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400';
  }
}

// ---------- component ----------

export default function RequiredDocumentsSection({
                                                   visaType,
                                                   documents = [],
                                                   className = '',
                                                 }: RequiredDocumentsSectionProps) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!visaType) return;
    setLoading(true);
    setError(null);
    try {
      const res = await documentsApi.checklist(visaType as VisaType);
      setChecklist(extractChecklist(res));
    } catch (err) {
      setError(
          err instanceof ApiError ? err.message : 'Failed to load checklist'
      );
      setChecklist([]);
    } finally {
      setLoading(false);
    }
  }, [visaType]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    const byType = new Map<string, UploadedDoc>();
    for (const d of documents) {
      const key = String(d.type || d.documentType || '').toLowerCase();
      if (!key) continue;
      const prev = byType.get(key);
      const rank = (s?: string) =>
          s === 'approved' ? 3 : s === 'pending' ? 2 : s === 'rejected' ? 1 : 0;
      if (!prev || rank(d.status) >= rank(prev.status)) byType.set(key, d);
    }

    return checklist.map((item) => ({
      ...item,
      uploaded: byType.get(item.type.toLowerCase()),
    }));
  }, [checklist, documents]);

  const requiredTotal = checklist.filter((c) => c.required).length;
  const approvedCount = rows.filter(
      (r) => r.required && r.uploaded?.status === 'approved'
  ).length;

  if (loading) {
    return (
        <section
            className={`rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark ${className}`}
        >
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="size-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            Loading required documents…
          </div>
        </section>
    );
  }

  if (error) {
    return (
        <section
            className={`rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark ${className}`}
        >
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">
            Required documents
          </h2>
          <p className="mt-2 text-sm text-error-600 dark:text-error-400">{error}</p>
          <button
              type="button"
              onClick={load}
              className="mt-2 text-sm font-medium text-brand-500 hover:text-brand-600"
          >
            Retry
          </button>
        </section>
    );
  }

  if (checklist.length === 0) {
    return (
        <section
            className={`rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark ${className}`}
        >
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">
            Required documents
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            No checklist available for {labelize(visaType)} visa.
          </p>
        </section>
    );
  }

  return (
      <section
          className={`overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark ${className}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <div>
            <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Required documents
            </h2>
            <p className="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">
              Checklist for {labelize(visaType)} visa
            </p>
          </div>
          {requiredTotal > 0 && (
              <p className="text-theme-xs font-medium text-gray-500">
                {approvedCount}/{requiredTotal} approved
              </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4 sm:gap-4 sm:p-5">
          {rows.map((item) => {
            const status = item.uploaded?.status;
            return (
                <div
                    key={item.type}
                    className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-white/[0.03]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {item.name}
                      </p>
                      <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-theme-xs font-medium capitalize ${statusBadgeClass(status)}`}
                      >
                        {status || 'Not uploaded'}
                      </span>
                    </div>
                    {item.required ? (
                        <span className="mt-1 inline-block text-theme-xs font-medium text-error-500">
                          Required
                        </span>
                    ) : (
                        <span className="mt-1 inline-block text-theme-xs text-gray-400">
                          Optional
                        </span>
                    )}
                    {item.description && (
                        <p className="mt-2 text-theme-xs text-gray-500 dark:text-gray-400">
                          {item.description}
                        </p>
                    )}
                  </div>
                  {item.formats && item.formats.length > 0 && (
                      <p className="text-theme-xs text-gray-400">
                        Formats: {item.formats.join(', ')}
                      </p>
                  )}

                  {/* Uploaded document details */}
                  {item.uploaded && (
                      <div className="mt-2 border-t border-gray-200 pt-2 dark:border-gray-700">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Uploaded: {item.uploaded.originalName || item.uploaded.name || 'File'}
                        </p>
                        {item.uploaded.reviewNotes && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              Note: {item.uploaded.reviewNotes}
                            </p>
                        )}
                        {item.uploaded.fileUrl && (
                            <a
                                href={item.uploaded.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-block text-xs font-medium text-brand-500 hover:text-brand-600"
                            >
                              View file →
                            </a>
                        )}
                      </div>
                  )}
                </div>
            );
          })}
        </div>
      </section>
  );
}