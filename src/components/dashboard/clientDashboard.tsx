// /portal/(dashboards)/dashboard
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  clientApi,
  notificationsApi,
  ApiError,
  getStoredUser,
  type AuthUserSummary,
} from '@/lib/api';

// ---------- types (match GET /client/dashboard) ----------

type PopulatedAdviser = {
  _id: string;
  email?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
};

type Deadline = {
  _id?: string;
  type?: string;
  description?: string;
  dueDate?: string;
  completed?: boolean;
};

type TimelineItem = {
  _id?: string;
  stage?: string;
  date?: string;
  notes?: string;
};

type ClientApplication = {
  _id: string;
  visaType: string;
  stage: string;
  progress?: number;
  inzReference?: string;
  clientId?: string;
  consultationId?: string;
  createdAt?: string;
  updatedAt?: string;
  destinationCountry?: { code?: string; name?: string };
  adviserId?: PopulatedAdviser | string;
  deadlines?: Deadline[];
  timeline?: TimelineItem[];
};

type ClientNotification = {
  _id: string;
  type?: string;
  title?: string;
  message?: string;
  priority?: string;
  isRead?: boolean;
  actionRequired?: boolean;
  actionUrl?: string | null;
  applicationId?: string;
  createdAt?: string;
};

type ClientPayment = {
  _id: string;
  amount: number;
  currency?: string;
  type?: string;
  status?: string;
  applicationId?: string;
  notes?: string;
  createdAt?: string;
};

type ClientSummary = {
  totalApplications: number;
  activeApplications: number;
  unreadNotifications: number;
  pendingDeadlines: number;
};

type ClientDashboardData = {
  applications: ClientApplication[];
  notifications: ClientNotification[];
  upcomingDeadlines: Deadline[];
  recentPayments: ClientPayment[];
  summary: ClientSummary;
};

// ---------- helpers ----------

function parseDashboard(res: unknown): ClientDashboardData | null {
  if (!res || typeof res !== 'object') return null;
  const r = res as Record<string, unknown>;
  const data = (r.data ?? r) as Record<string, unknown>;
  if (!data || typeof data !== 'object') return null;

  const summary = (data.summary ?? {}) as Partial<ClientSummary>;

  return {
    applications: Array.isArray(data.applications)
      ? (data.applications as ClientApplication[])
      : [],
    notifications: Array.isArray(data.notifications)
      ? (data.notifications as ClientNotification[])
      : [],
    upcomingDeadlines: Array.isArray(data.upcomingDeadlines)
      ? (data.upcomingDeadlines as Deadline[])
      : [],
    recentPayments: Array.isArray(data.recentPayments)
      ? (data.recentPayments as ClientPayment[])
      : [],
    summary: {
      totalApplications: Number(summary.totalApplications ?? 0),
      activeApplications: Number(summary.activeApplications ?? 0),
      unreadNotifications: Number(summary.unreadNotifications ?? 0),
      pendingDeadlines: Number(summary.pendingDeadlines ?? 0),
    },
  };
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

function formatMoney(amount: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

function labelize(s?: string): string {
  if (!s) return '—';
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function adviserName(adviser?: PopulatedAdviser | string): string {
  if (!adviser) return 'Unassigned';
  if (typeof adviser === 'string') return 'Assigned';
  const name = [adviser.profile?.firstName, adviser.profile?.lastName]
    .filter(Boolean)
    .join(' ');
  return name || adviser.email || 'Adviser';
}

function timeAgo(iso?: string): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const seconds = Math.floor((Date.now() - then) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days}d ago`;
  return formatDate(iso);
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

// ---------- page ----------

export default function ClientDashboardPage() {
  const [data, setData] = useState<ClientDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUserSummary | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await clientApi.dashboard();
      const parsed = parseDashboard(res);
      if (!parsed) throw new ApiError('Unexpected dashboard response', 500);
      setData(parsed);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to load dashboard'
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openDeadlines = useMemo(() => {
    if (!data) return [];
    // Prefer top-level upcomingDeadlines; fall back to incomplete ones on apps
    if (data.upcomingDeadlines.length > 0) return data.upcomingDeadlines;
    const fromApps: (Deadline & { visaType?: string; appId?: string })[] = [];
    for (const app of data.applications) {
      for (const d of app.deadlines ?? []) {
        if (!d.completed) {
          fromApps.push({
            ...d,
            visaType: app.visaType,
            appId: app._id,
          });
        }
      }
    }
    return fromApps.sort((a, b) => {
      const ta = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      const tb = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      return ta - tb;
    });
  }, [data]);

  const markRead = async (id: string) => {
    setMarkingId(id);
    try {
      await notificationsApi.markRead(id);
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          notifications: prev.notifications.map((n) =>
            n._id === id ? { ...n, isRead: true } : n
          ),
          summary: {
            ...prev.summary,
            unreadNotifications: Math.max(
              0,
              prev.summary.unreadNotifications - 1
            ),
          },
        };
      });
    } catch {
      // non-blocking
    } finally {
      setMarkingId(null);
    }
  };

  const firstName =
    user?.profile?.firstName || user?.email?.split('@')[0] || 'there';

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <span className="size-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          Loading your dashboard…
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          {error || 'No dashboard data'}
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

  const { applications, notifications, recentPayments, summary } = data;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Welcome */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            Track your visa applications, deadlines, and payments
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
        >
          Refresh
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard
          label="Applications"
          value={summary.totalApplications}
          hint={`${summary.activeApplications} active`}
        />
        <SummaryCard
          label="Unread alerts"
          value={summary.unreadNotifications}
          hint="Need attention"
          highlight={summary.unreadNotifications > 0}
        />
        <SummaryCard
          label="Pending deadlines"
          value={summary.pendingDeadlines || openDeadlines.length}
          hint="Upcoming tasks"
          highlight={(summary.pendingDeadlines || openDeadlines.length) > 0}
        />
        <SummaryCard
          label="Recent payments"
          value={recentPayments.length}
          hint="On this account"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Applications — 2 cols */}
        <div className="space-y-4 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Your applications
            </h2>
            <Link
              href="/portal/my-applications"
              className="text-theme-xs font-medium text-brand-500 hover:text-brand-600"
            >
              View all
            </Link>
          </div>

          {applications.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 px-4 py-10 text-center dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No applications yet.
              </p>
              <Link
                href="/portal/consultations"
                className="mt-3 inline-block text-sm font-medium text-brand-500"
              >
                Book a consultation
              </Link>
            </div>
          ) : (
            applications.map((app) => (
              <ApplicationCard key={app._id} app={app} />
            ))
          )}

          {/* Payments */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                Recent payments
              </h2>
              <Link
                href="/portal/payments"
                className="text-theme-xs font-medium text-brand-500 hover:text-brand-600"
              >
                History
              </Link>
            </div>
            {recentPayments.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-500">
                No payments yet
              </p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {recentPayments.map((p) => (
                  <li
                    key={p._id}
                    className="flex items-center justify-between gap-3 px-5 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium capitalize text-gray-800 dark:text-white/90">
                        {labelize(p.type)}
                      </p>
                      <p className="text-theme-xs text-gray-500">
                        {formatDate(p.createdAt)}
                        {p.notes ? ` · ${p.notes}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                        {formatMoney(p.amount, p.currency || 'USD')}
                      </p>
                      <span
                        className={`text-theme-xs capitalize ${
                          p.status === 'completed'
                            ? 'text-success-600 dark:text-success-400'
                            : p.status === 'pending'
                              ? 'text-warning-600 dark:text-warning-400'
                              : 'text-gray-500'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Sidebar: notifications + deadlines */}
        <div className="space-y-4">
          {/* Notifications */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                Notifications
              </h2>
              <Link
                href="/portal/notifications"
                className="text-theme-xs font-medium text-brand-500 hover:text-brand-600"
              >
                All
              </Link>
            </div>
            {notifications.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-500">
                You&apos;re all caught up
              </p>
            ) : (
              <ul className="max-h-[360px] divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800">
                {notifications.slice(0, 8).map((n) => (
                  <li
                    key={n._id}
                    className={`px-4 py-3 ${
                      !n.isRead
                        ? 'bg-brand-50/40 dark:bg-brand-500/[0.04]'
                        : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {n.title || labelize(n.type)}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-theme-xs text-gray-500 dark:text-gray-400">
                          {n.message}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-theme-xs text-gray-400">
                          <span>{timeAgo(n.createdAt)}</span>
                          {n.priority === 'high' && (
                            <span className="rounded-full bg-error-50 px-1.5 py-0.5 text-error-600 dark:bg-error-500/15 dark:text-error-400">
                              High
                            </span>
                          )}
                          {n.actionRequired && (
                            <span className="rounded-full bg-warning-50 px-1.5 py-0.5 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400">
                              Action needed
                            </span>
                          )}
                        </div>
                      </div>
                      {!n.isRead && (
                        <button
                          type="button"
                          disabled={markingId === n._id}
                          onClick={() => markRead(n._id)}
                          className="shrink-0 text-theme-xs font-medium text-brand-500 hover:text-brand-600 disabled:opacity-50"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Deadlines */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
            <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                Upcoming deadlines
              </h2>
            </div>
            {openDeadlines.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-500">
                No pending deadlines
              </p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {openDeadlines.slice(0, 6).map((d, i) => (
                  <li key={d._id || i} className="px-5 py-3">
                    <p className="text-sm font-medium capitalize text-gray-800 dark:text-white/90">
                      {labelize(d.type)}
                    </p>
                    {d.description && (
                      <p className="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">
                        {d.description}
                      </p>
                    )}
                    <p className="mt-1 text-theme-xs text-gray-400">
                      Due {formatDate(d.dueDate)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-1 gap-2">
            <QuickLink href="/portal/documents" title="Upload documents" />
            <QuickLink href="/portal/consultations" title="Book consultation" />
            <QuickLink href="/profile" title="Update profile" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- pieces ----------

function SummaryCard({
  label,
  value,
  hint,
  highlight,
}: {
  label: string;
  value: number;
  hint: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-theme-xs dark:bg-gray-dark ${
        highlight
          ? 'border-brand-200 dark:border-brand-500/30'
          : 'border-gray-200 dark:border-gray-800'
      }`}
    >
      <p className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
        {value}
      </p>
      <p className="mt-1 text-theme-xs text-gray-400">{hint}</p>
    </div>
  );
}

function ApplicationCard({ app }: { app: ClientApplication }) {
  const stageIndex = Math.max(0, STAGE_ORDER.indexOf(app.stage));
  const progress =
    typeof app.progress === 'number'
      ? app.progress
      : Math.round(((stageIndex + 1) / STAGE_ORDER.length) * 100);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold capitalize text-gray-800 dark:text-white/90">
              {labelize(app.visaType)} visa
            </h3>
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium capitalize text-gray-600 dark:bg-white/5 dark:text-gray-300">
              {labelize(app.stage)}
            </span>
          </div>
          <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
            {app.destinationCountry?.name ||
              app.destinationCountry?.code ||
              '—'}
            {' · '}
            Adviser: {adviserName(app.adviserId)}
            {app.inzReference ? ` · ${app.inzReference}` : ''}
          </p>
        </div>
        <Link
          href={`/portal/my-applications/${app._id}`}
          className="text-theme-xs font-medium text-brand-500 hover:text-brand-600"
        >
          View details
        </Link>
      </div>

      {/* Progress */}
      <div className="mt-4">
        <div className="mb-1 flex justify-between text-theme-xs text-gray-500">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
          <div
            className="h-full rounded-full bg-brand-500 transition-all"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>

      {/* Latest timeline note */}
      {app.timeline && app.timeline.length > 0 && (
        <div className="mt-4 rounded-lg bg-gray-50 px-3 py-2 dark:bg-white/[0.03]">
          <p className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
            Latest update ·{' '}
            {formatDate(app.timeline[app.timeline.length - 1]?.date)}
          </p>
          <p className="mt-0.5 line-clamp-2 text-sm text-gray-700 dark:text-gray-300">
            {app.timeline[app.timeline.length - 1]?.notes ||
              labelize(app.timeline[app.timeline.length - 1]?.stage)}
          </p>
        </div>
      )}

      {/* Open deadlines on this app */}
      {(app.deadlines ?? []).filter((d) => !d.completed).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(app.deadlines ?? [])
            .filter((d) => !d.completed)
            .slice(0, 3)
            .map((d) => (
              <span
                key={d._id}
                className="rounded-full bg-warning-50 px-2 py-0.5 text-theme-xs text-warning-700 dark:bg-warning-500/15 dark:text-warning-400"
              >
                {labelize(d.type)} · {formatDate(d.dueDate)}
              </span>
            ))}
        </div>
      )}
    </div>
  );
}

function QuickLink({ href, title }: { href: string; title: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 shadow-theme-xs transition hover:border-brand-200 hover:bg-brand-50/40 dark:border-gray-800 dark:bg-gray-dark dark:text-white/90 dark:hover:border-brand-500/30 dark:hover:bg-brand-500/5"
    >
      {title}
      <svg
        className="size-4 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </Link>
  );
}