'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { adminApi, ApiError } from '@/lib/api';
import MonthlyPaymentsChart from '@/components/ecommerce/MonthlyPaymentsChart';

// ---------- types (match GET /admin/dashboard) ----------

type PopulatedClient = {
  _id: string;
  email?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
};

type DashboardApplication = {
  _id: string;
  visaType: string;
  stage: string;
  progress?: number;
  inzReference?: string;
  outcome?: string;
  createdAt?: string;
  updatedAt?: string;
  destinationCountry?: { code?: string; name?: string };
  clientId?: PopulatedClient | string;
  adviserId?: PopulatedClient | string;
  deadlines?: Array<{
    type?: string;
    description?: string;
    dueDate?: string;
    completed?: boolean;
  }>;
};

type DashboardOverview = {
  totalApplications: number;
  activeClients: number;
  pendingConsultations: number;
  pendingDocuments: number;
  totalRevenue: number;
};

type DashboardData = {
  overview: DashboardOverview;
  applicationsByStage: Record<string, number>;
  applicationsByVisaType: Record<string, number>;
  recentApplications: DashboardApplication[];
};

// ---------- helpers ----------

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

function formatMoney(amount: number, currency = 'NZD'): string {
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

function clientLabel(client: DashboardApplication['clientId']): string {
  if (!client) return '—';
  if (typeof client === 'string') return client.slice(-6);
  const name = [client.profile?.firstName, client.profile?.lastName]
    .filter(Boolean)
    .join(' ');
  return name || client.email || client._id.slice(-6);
}

function labelize(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseDashboard(res: unknown): DashboardData | null {
  if (!res || typeof res !== 'object') return null;
  const r = res as Record<string, unknown>;
  const data = (r.data ?? r) as Record<string, unknown>;
  if (!data || typeof data !== 'object') return null;

  const overview = (data.overview ?? {}) as Partial<DashboardOverview>;
  return {
    overview: {
      totalApplications: Number(overview.totalApplications ?? 0),
      activeClients: Number(overview.activeClients ?? 0),
      pendingConsultations: Number(overview.pendingConsultations ?? 0),
      pendingDocuments: Number(overview.pendingDocuments ?? 0),
      totalRevenue: Number(overview.totalRevenue ?? 0),
    },
    applicationsByStage:
      (data.applicationsByStage as Record<string, number>) ?? {},
    applicationsByVisaType:
      (data.applicationsByVisaType as Record<string, number>) ?? {},
    recentApplications: Array.isArray(data.recentApplications)
      ? (data.recentApplications as DashboardApplication[])
      : [],
  };
}

const STAGE_COLORS: Record<string, string> = {
  consultation: 'bg-gray-400',
  deposit_paid: 'bg-brand-500',
  documents_completed: 'bg-blue-light-500',
  additional_docs_required: 'bg-warning-500',
  submitted_to_inz: 'bg-theme-purple-500',
  inz_processing: 'bg-blue-light-600',
  rfi_received: 'bg-orange-500',
  ppi_received: 'bg-error-400',
  decision: 'bg-success-500',
};

const VISA_COLORS = [
  'bg-brand-500',
  'bg-blue-light-500',
  'bg-success-500',
  'bg-theme-purple-500',
  'bg-orange-500',
  'bg-error-400',
];

// ---------- page ----------

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.dashboard();
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

  const stageEntries = useMemo(() => {
    if (!data) return [];
    const entries = Object.entries(data.applicationsByStage);
    const total = entries.reduce((s, [, n]) => s + n, 0) || 1;
    return entries
      .map(([key, count]) => ({
        key,
        count,
        pct: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  const visaEntries = useMemo(() => {
    if (!data) return [];
    const entries = Object.entries(data.applicationsByVisaType);
    const total = entries.reduce((s, [, n]) => s + n, 0) || 1;
    return entries
      .map(([key, count], i) => ({
        key,
        count,
        pct: Math.round((count / total) * 100),
        color: VISA_COLORS[i % VISA_COLORS.length],
      }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <span className="size-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          Loading dashboard…
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

  const { overview, recentApplications } = data;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">
            Dashboard
          </h1>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            Overview of applications, clients, and pipeline health
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      <div className="col-span-12 space-y-6 xl:col-span-7">
      <MonthlyPaymentsChart />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Applications"
          value={String(overview.totalApplications)}
          hint="Total in system"
          accent="brand"
          href="/portal/applications"
        />
        <KpiCard
          label="Active clients"
          value={String(overview.activeClients)}
          hint="Registered clients"
          accent="blue"
          href="/portal/users"
        />
        <KpiCard
          label="Pending consultations"
          value={String(overview.pendingConsultations)}
          hint="Awaiting action"
          accent="orange"
          href="/portal/consultations"
        />
        <KpiCard
          label="Pending documents"
          value={String(overview.pendingDocuments)}
          hint="Need review"
          accent="warning"
          href="/portal/documents"
        />
        <KpiCard
          label="Revenue"
          value={formatMoney(overview.totalRevenue)}
          hint="Total recorded"
          accent="success"
          href="/portal/transactions"

        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* By stage */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Applications by stage
            </h2>
            <Link
              href="/portal/applications"
              className="text-theme-xs font-medium text-brand-500 hover:text-brand-600"
            >
              View all
            </Link>
          </div>
          {stageEntries.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No stage data</p>
          ) : (
            <ul className="space-y-3">
              {stageEntries.map(({ key, count, pct }) => (
                <li key={key}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium capitalize text-gray-700 dark:text-gray-300">
                      {labelize(key)}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {count} · {pct}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
                    <div
                      className={`h-full rounded-full ${STAGE_COLORS[key] ?? 'bg-brand-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* By visa type */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
          <h2 className="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">
            Applications by visa type
          </h2>
          {visaEntries.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No visa data</p>
          ) : (
            <div className="space-y-4">
              {/* Simple stacked bar */}
              <div className="flex h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
                {visaEntries.map(({ key, pct, color }) => (
                  <div
                    key={key}
                    className={`h-full ${color}`}
                    style={{ width: `${pct}%` }}
                    title={`${labelize(key)}: ${pct}%`}
                  />
                ))}
              </div>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {visaEntries.map(({ key, count, pct, color }) => (
                  <li
                    key={key}
                    className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-white/[0.03]"
                  >
                    <span className={`size-2.5 shrink-0 rounded-full ${color}`} />
                    <span className="flex-1 text-sm capitalize text-gray-700 dark:text-gray-300">
                      {labelize(key)}
                    </span>
                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {count}
                    </span>
                    <span className="text-theme-xs text-gray-400">{pct}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Recent applications */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">
            Recent applications
          </h2>
          <Link
            href="/portal/applications"
            className="text-theme-xs font-medium text-brand-500 hover:text-brand-600"
          >
            View all
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03]">
                <th className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Client
                </th>
                <th className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Visa
                </th>
                <th className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Stage
                </th>
                <th className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Progress
                </th>
                <th className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Destination Country
                </th>
                <th className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody>
              {recentApplications.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-gray-500 dark:text-gray-400"
                  >
                    No recent applications
                  </td>
                </tr>
              ) : (
                recentApplications.map((app) => (
                  <tr
                    key={app._id}
                    className="border-b border-gray-100 last:border-0 dark:border-gray-800/60"
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800 dark:text-white/90">
                        {clientLabel(app.clientId)}
                      </p>
                      {typeof app.clientId === 'object' && app.clientId?.email && (
                        <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                          {app.clientId.email}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3 capitalize text-gray-700 dark:text-gray-300">
                      {app.visaType?.replace(/_/g, ' ') || '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium capitalize text-gray-700 dark:bg-white/5 dark:text-gray-300">
                        {app.stage?.replace(/_/g, ' ') || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex min-w-[100px] items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
                          <div
                            className="h-full rounded-full bg-brand-500"
                            style={{
                              width: `${Math.min(100, Math.max(0, app.progress ?? 0))}%`,
                            }}
                          />
                        </div>
                        <span className="text-theme-xs text-gray-500">
                          {app.progress ?? 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-300">
                      {app.destinationCountry?.name ||
                        app.destinationCountry?.code ||
                        '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-300">
                      {formatDate(app.updatedAt || app.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <QuickLink
          href="/portal/consultations"
          title="Consultations"
          description={`${overview.pendingConsultations} pending`}
        />
        <QuickLink
          href="/portal/documents"
          title="Document review"
          description={`${overview.pendingDocuments} awaiting review`}
        />
        <QuickLink
          href="/portal/users"
          title="User management"
          description={`${overview.activeClients} active clients`}
        />
      </div>
    </div>
  );
}

// ---------- UI pieces ----------

function KpiCard({
  label,
  value,
  hint,
  accent,
  href,
}: {
  label: string;
  value: string;
  hint: string;
  accent: 'brand' | 'blue' | 'orange' | 'warning' | 'success';
  href?: string;
}) {
  const ring: Record<typeof accent, string> = {
    brand: 'border-brand-100 dark:border-brand-500/20',
    blue: 'border-blue-light-100 dark:border-blue-light-500/20',
    orange: 'border-orange-100 dark:border-orange-500/20',
    warning: 'border-warning-100 dark:border-warning-500/20',
    success: 'border-success-100 dark:border-success-500/20',
  };

  const body = (
    <div
      className={`rounded-xl border bg-white p-4 shadow-theme-xs dark:bg-gray-dark ${ring[accent]} ${
        href ? 'transition hover:shadow-theme-sm' : ''
      }`}
    >
      <p className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-800 dark:text-white/90">
        {value}
      </p>
      <p className="mt-1 text-theme-xs text-gray-400">{hint}</p>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {body}
      </Link>
    );
  }
  return body;
}

function QuickLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-theme-xs transition hover:border-brand-200 hover:bg-brand-50/40 dark:border-gray-800 dark:bg-gray-dark dark:hover:border-brand-500/30 dark:hover:bg-brand-500/5"
    >
      <div>
        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
          {title}
        </p>
        <p className="text-theme-xs text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>
      <svg
        className="size-5 text-gray-400"
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