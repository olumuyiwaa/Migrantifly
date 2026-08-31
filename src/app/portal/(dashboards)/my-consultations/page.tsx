'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  consultationsApi,
  ApiError,
  getStoredUser,
  type Consultation,
  type BookConsultationRequest,
  type AuthUserSummary,
} from '@/lib/api';

// ---------- helpers ----------

function extractConsultations(res: unknown): Consultation[] {
  if (!res || typeof res !== 'object') return [];
  const r = res as Record<string, unknown>;
  if (Array.isArray(r.data)) return r.data as Consultation[];
  if (Array.isArray(r.consultations)) return r.consultations as Consultation[];
  if (Array.isArray(res)) return res as Consultation[];
  if (r.data && typeof r.data === 'object' && !Array.isArray(r.data)) {
    const nested = r.data as Record<string, unknown>;
    if (Array.isArray(nested.consultations)) {
      return nested.consultations as Consultation[];
    }
    if (Array.isArray(nested.data)) return nested.data as Consultation[];
  }
  return [];
}

function labelize(s?: string): string {
  if (!s) return '—';
  return s.replace(/_/g, ' ').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
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

function statusClass(status?: string): string {
  switch (status) {
    case 'completed':
      return 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400';
    case 'scheduled':
      return 'bg-blue-light-50 text-blue-light-700 dark:bg-blue-light-500/15 dark:text-blue-light-400';
    case 'pending_payment':
    case 'pending':
      return 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400';
    case 'cancelled':
      return 'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400';
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300';
  }
}

function adviserFrom(c: Consultation): string {
  const any = c as Consultation & {
    adviserId?: {
      email?: string;
      profile?: { firstName?: string; lastName?: string };
    };
  };
  const a = any.adviserId;
  if (!a || typeof a === 'string') return typeof a === 'string' ? 'Assigned' : '—';
  const name = [a.profile?.firstName, a.profile?.lastName].filter(Boolean).join(' ');
  return name || a.email || '—';
}

// ---------- page ----------

export default function ClientConsultationsPage() {
  const [items, setItems] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [bookOpen, setBookOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await consultationsApi.myConsultations();
      const list = extractConsultations(res);
      list.sort((a, b) => {
        const ta = a.scheduledDate
          ? new Date(a.scheduledDate).getTime()
          : a.createdAt
            ? new Date(a.createdAt).getTime()
            : 0;
        const tb = b.scheduledDate
          ? new Date(b.scheduledDate).getTime()
          : b.createdAt
            ? new Date(b.createdAt).getTime()
            : 0;
        return tb - ta;
      });
      setItems(list);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to load consultations'
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!statusFilter) return items;
    return items.filter((c) => c.status === statusFilter);
  }, [items, statusFilter]);

  const statuses = useMemo(() => {
    return Array.from(new Set(items.map((c) => c.status).filter(Boolean))) as string[];
  }, [items]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">
            My consultations
          </h1>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            Book and track advisory sessions
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
            onClick={() => setBookOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Book consultation
          </button>
        </div>
      </div>

      <div className="w-full max-w-xs">
        <label className="mb-1.5 block text-theme-xs font-medium text-gray-500">
          Status
        </label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
        >
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {labelize(s)}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          {error}
          <button type="button" onClick={load} className="ml-3 font-medium underline">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-gray-500">
          <span className="size-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          Loading consultations…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 px-4 py-16 text-center dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {items.length === 0
              ? 'You have no consultations yet.'
              : 'No consultations match this filter.'}
          </p>
          {items.length === 0 && (
            <button
              type="button"
              onClick={() => setBookOpen(true)}
              className="mt-3 text-sm font-medium text-brand-500 hover:text-brand-600"
            >
              Book your first consultation
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03]">
                  <th className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400">
                    When
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400">
                    Method
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400">
                    Type
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400">
                    Adviser
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const any = c as Consultation & { type?: string };
                  return (
                    <tr
                      key={c._id}
                      className="border-b border-gray-100 last:border-0 dark:border-gray-800/60"
                    >
                      <td className="px-5 py-3 text-gray-800 dark:text-white/90">
                        {formatDateTime(c.scheduledDate || c.preferredDate)}
                        {c.duration ? (
                          <span className="block text-theme-xs text-gray-400">
                            {c.duration} min
                          </span>
                        ) : null}
                      </td>
                      <td className="px-5 py-3 capitalize text-gray-600 dark:text-gray-300">
                        {labelize(String(c.method))}
                      </td>
                      <td className="px-5 py-3 capitalize text-gray-600 dark:text-gray-300">
                        {labelize(any.type) || '—'}
                      </td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300">
                        {adviserFrom(c)}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusClass(c.status)}`}
                        >
                          {labelize(c.status)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/portal/my-consultations/${c._id}`}
                          className="text-sm font-medium text-brand-500 hover:text-brand-600"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {bookOpen && (
        <BookConsultationModal
          onClose={() => setBookOpen(false)}
          onBooked={() => {
            setBookOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}

// ---------- book modal ----------

function BookConsultationModal({
  onClose,
  onBooked,
}: {
  onClose: () => void;
  onBooked: () => void;
}) {
  const [user, setUser] = useState<AuthUserSummary | null>(null);
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('10:00');
  const [method, setMethod] = useState<'online' | 'phone' | 'in_person'>('online');
  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const u = getStoredUser();
    setUser(u);
    if (u?.profile?.phone) setPhone(String(u.profile.phone));
  }, []);

  const clientName = user
    ? [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(' ') ||
      user.email
    : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!user?.email) {
      setFormError('You must be signed in to book.');
      return;
    }
    if (!preferredDate || !preferredTime) {
      setFormError('Date and time are required.');
      return;
    }

    const body: BookConsultationRequest = {
      clientEmail: user.email,
      clientName: clientName || user.email,
      clientPhone: phone.trim() || undefined,
      preferredDate,
      preferredTime,
      method,
      message: message.trim() || undefined,
    };

    setSubmitting(true);
    try {
      await consultationsApi.book(body);
      onBooked();
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : 'Failed to book consultation'
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
              Book consultation
            </h2>
            <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
              Choose a preferred date and method. Payment may be required after booking.
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

          <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-white/[0.03]">
            <p className="font-medium text-gray-800 dark:text-white/90">
              {clientName || '—'}
            </p>
            <p className="text-theme-xs text-gray-500">{user?.email}</p>
          </div>

          <div>
            <label className="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">
                Preferred date <span className="text-error-500">*</span>
              </label>
              <input
                type="date"
                required
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">
                Time <span className="text-error-500">*</span>
              </label>
              <input
                type="time"
                required
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">
              Method <span className="text-error-500">*</span>
            </label>
            <select
              value={method}
              onChange={(e) =>
                setMethod(e.target.value as 'online' | 'phone' | 'in_person')
              }
              className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
            >
              <option value="online">Online</option>
              <option value="phone">Phone</option>
              <option value="in_person">In person</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">
              Message
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What would you like to discuss?"
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
              {submitting ? 'Booking…' : 'Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}