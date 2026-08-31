'use client';

import { useEffect, useState } from 'react';
import {
  applicationsApi,
  consultationsApi,
  documentsApi,
  deadlinesApi,
  ApiError,
  patchApi,
  type User,
  type UserRole,
  type Application,
  type Consultation,
  type DocumentItem,
  type DeadlineItem,
} from '@/lib/api';

// ---------- helpers ----------

function displayName(user: User): string {
  const p = user.profile;
  if (p?.firstName || p?.lastName) {
    return [p.firstName, p.lastName].filter(Boolean).join(' ');
  }
  return user.email?.split('@')[0] || 'User';
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

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  adviser: 'Adviser',
  client: 'Client',
};

/**
 * Unwrap common API list envelopes:
 *  - [...]
 *  - { data: [...] }
 *  - { data: { applications|documents|consultations|users|items: [...] } }
 *  - { applications|documents|consultations: [...] }
 */
function extractArray<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  if (!res || typeof res !== 'object') return [];

  const r = res as Record<string, unknown>;
  const listKeys = [
    'applications',
    'documents',
    'consultations',
    'users',
    'items',
    'requests',
    'results',
    'rows',
  ];

  // { applications: [...] } etc.
  for (const k of listKeys) {
    if (Array.isArray(r[k])) return r[k] as T[];
  }

  // { data: [...] }
  if (Array.isArray(r.data)) return r.data as T[];

  // { data: { applications: [...] } }  ← same shape as admin users
  if (r.data && typeof r.data === 'object' && !Array.isArray(r.data)) {
    const nested = r.data as Record<string, unknown>;
    for (const k of listKeys) {
      if (Array.isArray(nested[k])) return nested[k] as T[];
    }
    if (Array.isArray(nested.data)) return nested.data as T[];
  }

  return [];
}

/** Collect possible Mongo/string ids from a value that may be id, _id, or populated doc */
function collectIds(value: unknown, out: Set<string>) {
  if (value == null) return;
  if (typeof value === 'string' || typeof value === 'number') {
    out.add(String(value));
    return;
  }
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>;
    if (o._id != null) out.add(String(o._id));
    if (o.id != null) out.add(String(o.id));
  }
}

function idsEqual(a: unknown, b: string): boolean {
  if (a == null) return false;
  if (typeof a === 'string' || typeof a === 'number') return String(a) === b;
  if (typeof a === 'object') {
    const o = a as Record<string, unknown>;
    return String(o._id ?? o.id ?? '') === b;
  }
  return false;
}

function userIds(user: User): string[] {
  const ids: string[] = [];
  if (user._id) ids.push(String(user._id));
  const any = user as User & { id?: string };
  if (any.id) ids.push(String(any.id));
  return [...new Set(ids)];
}

function matchesUserRef(value: unknown, user: User): boolean {
  for (const uid of userIds(user)) {
    if (idsEqual(value, uid)) return true;
  }
  const email = user.email?.toLowerCase();
  if (email && value && typeof value === 'object') {
    const o = value as Record<string, unknown>;
    if (String(o.email || '').toLowerCase() === email) return true;
  }
  return false;
}

function applicationBelongsToUser(app: Application, user: User): boolean {
  const any = app as Record<string, unknown>;
  if (matchesUserRef(app.clientId, user)) return true;
  if (matchesUserRef(app.adviserId, user)) return true;
  if (matchesUserRef(any.client, user)) return true;
  if (matchesUserRef(any.adviser, user)) return true;
  if (matchesUserRef(any.user, user)) return true;
  if (matchesUserRef(any.userId, user)) return true;
  return false;
}

function refId(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>;
    if (o._id != null) return String(o._id);
    if (o.id != null) return String(o.id);
  }
  return undefined;
}

function documentBelongsToUser(
  doc: DocumentItem,
  user: User,
  appIds: Set<string>
): boolean {
  const any = doc as Record<string, unknown>;

  if (matchesUserRef(any.clientId, user)) return true;
  if (matchesUserRef(doc.uploadedBy, user)) return true;
  if (matchesUserRef(any.userId, user)) return true;
  if (matchesUserRef(any.owner, user)) return true;
  if (matchesUserRef(any.reviewedBy, user)) return true;

  const appRef = any.applicationId ?? any.application;
  const appIdStr = refId(appRef);
  if (appIdStr && appIds.has(appIdStr)) return true;

  if (appRef && typeof appRef === 'object') {
    const app = appRef as Record<string, unknown>;
    if (matchesUserRef(app.clientId, user)) return true;
  }

  return false;
}

function consultationBelongsToUser(c: Consultation, user: User): boolean {
  if (user.email && c.clientEmail?.toLowerCase() === user.email.toLowerCase()) {
    return true;
  }
  const any = c as Record<string, unknown>;
  for (const key of [
    'clientId',
    'adviserId',
    'userId',
    'client',
    'adviser',
    'user',
  ]) {
    if (matchesUserRef(any[key], user)) return true;
  }
  return false;
}

/**
 * Change user role.
 * Adjust path if your backend uses a different endpoint.
 */
async function updateUserRole(userId: string, role: UserRole) {
  return patchApi<{ success?: boolean; message?: string; data?: User }>(
    `/admin/users/${userId}/role`,
    { role }
  );
}

// ---------- subcomponents ----------

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-white/[0.03]">
      <dt className="text-theme-xs text-gray-500 dark:text-gray-400">{label}</dt>
      <dd
        className={`mt-0.5 text-sm text-gray-800 dark:text-white/90 ${
          mono ? 'break-all font-mono text-xs' : ''
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function RelatedTable({
  headers,
  rows,
  empty,
}: {
  headers: string[];
  rows: string[][];
  empty: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        {empty}
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-white/[0.03]">
            {headers.map((h) => (
              <th
                key={h}
                className="px-3 py-2 font-medium text-gray-500 dark:text-gray-400"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-gray-100 last:border-0 dark:border-gray-800/60"
            >
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="px-3 py-2 capitalize text-gray-700 dark:text-gray-300"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------- main modal ----------

type DetailTab = 'overview' | 'applications' | 'documents' | 'consultations';

export type UserDetailModalProps = {
  user: User;
  onClose: () => void;
  onUserUpdated: (u: User) => void;
};

export default function UserDetailModal({
  user,
  onClose,
  onUserUpdated,
}: UserDetailModalProps) {
  const [tab, setTab] = useState<DetailTab>('overview');
  const [roleDraft, setRoleDraft] = useState<UserRole>(user.role);
  const [roleSaving, setRoleSaving] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [roleSuccess, setRoleSuccess] = useState<string | null>(null);

  const [apps, setApps] = useState<Application[]>([]);
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [consults, setConsults] = useState<Consultation[]>([]);
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [relatedError, setRelatedError] = useState<string | null>(null);

  // Sync role draft if parent updates user
  useEffect(() => {
    setRoleDraft(user.role);
    setRoleError(null);
    setRoleSuccess(null);
  }, [user._id, user.role]);

  useEffect(() => {
    let cancelled = false;

    async function loadRelated() {
      setRelatedLoading(true);
      setRelatedError(null);
      setApps([]);
      setDocs([]);
      setConsults([]);
      setDeadlines([]);

      const errors: string[] = [];

      try {
        const userId = user._id;

        const [appsRes, docsRes, consultRes, deadlineRes] =
          await Promise.allSettled([
            applicationsApi.list({ page: 1, limit: 100 }),
            documentsApi.list({ limit: 100 }),
            consultationsApi.list({ page: 1, limit: 100 }),
            // Deadlines by client work for any user id that owns applications
            deadlinesApi.byClient(userId).catch(() => null),
          ]);

        if (cancelled) return;

        // ----- Applications -----
        let matchedApps: Application[] = [];
        if (appsRes.status === 'fulfilled') {
          const all = extractArray<Application>(appsRes.value);
          matchedApps = all.filter((a) => applicationBelongsToUser(a, user));
          setApps(matchedApps);
          if (all.length === 0) {
            // Response parsed empty — likely envelope mismatch; log raw for debug
            console.warn('[UserDetail] applications raw response:', appsRes.value);
          }
        } else {
          const reason = appsRes.reason;
          errors.push(
            reason instanceof ApiError
              ? `Applications: ${reason.message}`
              : 'Applications: request failed'
          );
          console.error('[UserDetail] applications error:', reason);
        }

        const appIds = new Set<string>();
        for (const a of matchedApps) {
          collectIds(a._id, appIds);
          collectIds((a as { id?: string }).id, appIds);
        }

        // ----- Documents -----
        // 1) Global list filtered by user/apps
        // 2) Plus per-application fetch (more reliable when global list is scoped)
        const docMap = new Map<string, DocumentItem>();

        if (docsRes.status === 'fulfilled') {
          const allDocs = extractArray<DocumentItem>(docsRes.value);
          for (const d of allDocs) {
            if (documentBelongsToUser(d, user, appIds)) {
              docMap.set(String(d._id || JSON.stringify(d)), d);
            }
          }
          if (allDocs.length === 0) {
            console.warn('[UserDetail] documents raw response:', docsRes.value);
          }
        } else {
          const reason = docsRes.reason;
          errors.push(
            reason instanceof ApiError
              ? `Documents: ${reason.message}`
              : 'Documents: request failed'
          );
          console.error('[UserDetail] documents error:', reason);
        }

        // Fetch docs for each matched application
        if (matchedApps.length > 0) {
          const perApp = await Promise.allSettled(
            matchedApps.slice(0, 20).map((a) =>
              documentsApi.byApplication(String(a._id))
            )
          );
          for (const result of perApp) {
            if (result.status !== 'fulfilled') continue;
            for (const d of extractArray<DocumentItem>(result.value)) {
              docMap.set(String(d._id || JSON.stringify(d)), d);
            }
          }
        }

        if (!cancelled) setDocs(Array.from(docMap.values()));

        // ----- Consultations -----
        if (consultRes.status === 'fulfilled') {
          const allC = extractArray<Consultation>(consultRes.value);
          setConsults(allC.filter((c) => consultationBelongsToUser(c, user)));
          if (allC.length === 0) {
            console.warn(
              '[UserDetail] consultations raw response:',
              consultRes.value
            );
          }
        } else {
          const reason = consultRes.reason;
          errors.push(
            reason instanceof ApiError
              ? `Consultations: ${reason.message}`
              : 'Consultations: request failed'
          );
          console.error('[UserDetail] consultations error:', reason);
        }

        // ----- Deadlines -----
        if (deadlineRes.status === 'fulfilled' && deadlineRes.value) {
          setDeadlines(extractArray<DeadlineItem>(deadlineRes.value));
        }

        if (errors.length && !cancelled) {
          setRelatedError(errors.join(' · '));
        }
      } catch (err) {
        if (!cancelled) {
          setRelatedError(
            err instanceof ApiError
              ? err.message
              : 'Failed to load related records'
          );
        }
      } finally {
        if (!cancelled) setRelatedLoading(false);
      }
    }

    loadRelated();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const saveRole = async () => {
    if (roleDraft === user.role) return;
    setRoleSaving(true);
    setRoleError(null);
    setRoleSuccess(null);
    try {
      await updateUserRole(user._id, roleDraft);
      const updated = { ...user, role: roleDraft };
      onUserUpdated(updated);
      setRoleSuccess(`Role updated to ${ROLE_LABELS[roleDraft]}.`);
    } catch (err) {
      setRoleError(
        err instanceof ApiError
          ? err.message
          : 'Failed to update role. Ensure PATCH /admin/users/:id exists on the backend.'
      );
    } finally {
      setRoleSaving(false);
    }
  };

  const tabs: { id: DetailTab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'applications', label: 'Applications', count: apps.length },
    { id: 'documents', label: 'Documents', count: docs.length },
    { id: 'consultations', label: 'Consultations', count: consults.length },
  ];

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
        className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xl dark:border-gray-800 dark:bg-gray-dark"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-brand-50 text-lg font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
              {displayName(user).charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                {displayName(user)}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user.email}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5"
          >
            <svg
              className="size-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto border-b border-gray-200 px-4 dark:border-gray-800">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`relative whitespace-nowrap px-3 py-3 text-sm font-medium transition ${
                tab === t.id
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {t.label}
              {typeof t.count === 'number' && (
                <span className="ml-1.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-white/10 dark:text-gray-300">
                  {t.count}
                </span>
              )}
              {tab === t.id && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-brand-500" />
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === 'overview' && (
            <div className="space-y-6">
              <section className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                  Role
                </h3>
                <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                  Changing role updates access across the portal. Requires backend
                  support for{' '}
                  <code className="text-xs">PATCH /admin/users/:id</code>.
                </p>
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <div className="w-full sm:w-48">
                    <label className="mb-1.5 block text-theme-xs font-medium text-gray-500">
                      Assign role
                    </label>
                    <select
                      value={roleDraft}
                      onChange={(e) =>
                        setRoleDraft(e.target.value as UserRole)
                      }
                      className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                    >
                      <option value="client">Client</option>
                      <option value="adviser">Adviser</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    disabled={roleSaving || roleDraft === user.role}
                    onClick={saveRole}
                    className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                  >
                    {roleSaving ? 'Saving…' : 'Save role'}
                  </button>
                </div>
                {roleError && (
                  <p className="mt-2 text-sm text-error-600 dark:text-error-400">
                    {roleError}
                  </p>
                )}
                {roleSuccess && (
                  <p className="mt-2 text-sm text-success-600 dark:text-success-400">
                    {roleSuccess}
                  </p>
                )}
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
                  Profile
                </h3>
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InfoRow label="Email" value={user.email} />
                  <InfoRow
                    label="Phone"
                    value={(user.profile?.phone as string) || '—'}
                  />
                  <InfoRow label="Name" value={displayName(user)} />
                  <InfoRow
                    label="Nationality"
                    value={(user.profile?.nationality as string) || '—'}
                  />
                  <InfoRow
                    label="Status"
                    value={user.isActive === false ? 'Inactive' : 'Active'}
                  />
                  <InfoRow label="Joined" value={formatDate(user.createdAt)} />
                  <InfoRow label="User ID" value={user._id} mono />
                </dl>
              </section>

              {deadlines.length > 0 && (
                <section>
                  <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
                    Deadlines
                  </h3>
                  <ul className="space-y-2">
                    {deadlines.slice(0, 8).map((d, i) => (
                      <li
                        key={`${d.applicationId}-${i}`}
                        className="rounded-lg border border-gray-100 px-3 py-2 text-sm dark:border-gray-800"
                      >
                        <span className="font-medium capitalize text-gray-800 dark:text-white/90">
                          {d.deadline?.type}
                        </span>
                        <span className="text-gray-500"> · {d.visaType}</span>
                        <span className="block text-theme-xs text-gray-500">
                          Due {formatDate(d.deadline?.dueDate)}
                          {d.overdue ? ' · Overdue' : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}

          {tab !== 'overview' && relatedLoading && (
            <div className="flex justify-center py-12 text-gray-500">
              <span className="inline-flex items-center gap-2">
                <span className="size-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                Loading…
              </span>
            </div>
          )}

          {tab !== 'overview' && relatedError && (
            <p className="text-sm text-error-600 dark:text-error-400">
              {relatedError}
            </p>
          )}

          {tab === 'applications' && !relatedLoading && (
            <RelatedTable
              empty="No applications linked to this user."
              headers={['Visa', 'Stage', 'Country', 'Created']}
              rows={apps.map((a) => [
                a.visaType,
                a.stage?.replace(/_/g, ' ') || '—',
                a.destinationCountry?.name ||
                  a.destinationCountry?.code ||
                  '—',
                formatDate(a.createdAt),
              ])}
            />
          )}

          {tab === 'documents' && !relatedLoading && (
            <RelatedTable
              empty="No documents linked to this user."
              headers={['Type', 'Name', 'Status', 'Uploaded']}
              rows={docs.map((d) => {
                const any = d as Record<string, unknown>;
                const type =
                  (any.type as string) ||
                  d.documentType ||
                  '—';
                const name =
                  (any.originalName as string) ||
                  (any.name as string) ||
                  '—';
                return [
                  String(type).replace(/_/g, ' '),
                  String(name),
                  d.status || '—',
                  formatDate(d.createdAt),
                ];
              })}
            />
          )}

          {tab === 'consultations' && !relatedLoading && (
            <RelatedTable
              empty="No consultations linked to this user."
              headers={['Client', 'Method', 'Date', 'Status']}
              rows={consults.map((c) => {
                const any = c as Record<string, unknown>;
                const clientRef = any.clientId as Record<string, unknown> | undefined;
                const profile = clientRef?.profile as Record<string, unknown> | undefined;
                const clientLabel =
                  c.clientName ||
                  c.clientEmail ||
                  (profile
                    ? [profile.firstName, profile.lastName].filter(Boolean).join(' ')
                    : '') ||
                  (clientRef?.email as string) ||
                  '—';
                return [
                  String(clientLabel),
                  String(c.method || '—').replace(/_/g, ' '),
                  formatDateTime(c.scheduledDate || c.preferredDate),
                  c.status || '—',
                ];
              })}
            />
          )}
        </div>

        <div className="border-t border-gray-200 px-6 py-3 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}