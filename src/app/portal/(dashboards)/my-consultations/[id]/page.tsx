'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  consultationsApi,
  ApiError,
  type Consultation,
  type EditConsultationRequest,
  type ConsultationMethod,
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
  return s
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
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

function personLabel(value: unknown): string {
  if (!value) return '—';
  if (typeof value === 'string') return value.slice(-6);
  const o = value as {
    email?: string;
    profile?: { firstName?: string; lastName?: string; phone?: string };
  };
  const name = [o.profile?.firstName, o.profile?.lastName]
    .filter(Boolean)
    .join(' ');
  return name || o.email || '—';
}

function toDatetimeLocal(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ---------- page ----------

export default function ClientConsultationDetailPage() {
  const params = useParams();
  const id = String(params?.id ?? '');

  const [item, setItem] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      // No dedicated GET-by-id on client API — load own list and find
      const res = await consultationsApi.myConsultations();
      const list = extractConsultations(res);
      const found = list.find((c) => c._id === id) ?? null;
      if (!found) {
        setError('Consultation not found');
        setItem(null);
      } else {
        setItem(found);
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to load consultation'
      );
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center gap-2 text-gray-500">
        <span className="size-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        Loading consultation…
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <Link
          href="/portal/my-consultations"
          className="text-sm font-medium text-brand-500 hover:text-brand-600"
        >
          ← Back to consultations
        </Link>
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          {error || 'Not found'}
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

  const any = item as Consultation & {
    type?: string;
    paymentId?: string;
    adviserId?: unknown;
    clientId?: unknown;
    clientToken?: string;
  };

  const canReschedule =
    item.status === 'scheduled' ||
    item.status === 'pending' ||
    item.status === 'pending_payment';

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/portal/my-consultations"
            className="text-theme-xs font-medium text-brand-500 hover:text-brand-600"
          >
            ← Back to consultations
          </Link>
          <h1 className="mt-2 text-title-sm font-semibold text-gray-800 dark:text-white/90">
            Consultation
          </h1>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            {formatDateTime(item.scheduledDate || item.preferredDate)}
            {' · '}
            {labelize(String(item.method))}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canReschedule && (
            <button
              type="button"
              onClick={() => setRescheduleOpen(true)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            >
              Reschedule
            </button>
          )}
          <button
            type="button"
            onClick={load}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusClass(item.status)}`}
              >
                {labelize(item.status)}
              </span>
              {any.type && (
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium capitalize text-gray-600 dark:bg-white/5 dark:text-gray-300">
                  {labelize(any.type)}
                </span>
              )}
            </div>

            <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Info label="Scheduled" value={formatDateTime(item.scheduledDate)} />
              <Info
                label="Preferred"
                value={
                  item.preferredDate
                    ? `${item.preferredDate}${item.preferredTime ? ` ${item.preferredTime}` : ''}`
                    : '—'
                }
              />
              <Info label="Method" value={labelize(String(item.method))} />
              <Info
                label="Duration"
                value={item.duration ? `${item.duration} minutes` : '—'}
              />
              <Info label="Adviser" value={personLabel(any.adviserId)} />
              <Info
                label="Meeting link"
                value={item.meetingLink || '—'}
                mono={Boolean(item.meetingLink)}
              />
            </dl>

            {(item.notes || item.message) && (
              <div className="mt-5 rounded-lg bg-gray-50 px-3 py-3 dark:bg-white/[0.03]">
                <p className="text-theme-xs font-medium text-gray-500">Notes</p>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                  {item.notes || item.message}
                </p>
              </div>
            )}

            {item.visaPathways && item.visaPathways.length > 0 && (
              <div className="mt-4">
                <p className="text-theme-xs font-medium text-gray-500">
                  Visa pathways discussed
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {item.visaPathways.map((v) => (
                    <span
                      key={v}
                      className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium capitalize text-brand-700 dark:bg-brand-500/15 dark:text-brand-400"
                    >
                      {labelize(v)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {item.status === 'pending_payment' && (
            <div className="rounded-xl border border-warning-200 bg-warning-50 px-4 py-4 dark:border-warning-500/30 dark:bg-warning-500/10">
              <p className="text-sm font-medium text-warning-800 dark:text-warning-300">
                Payment required
              </p>
              <p className="mt-1 text-theme-sm text-warning-700 dark:text-warning-400">
                Complete the consultation fee to confirm this booking.
              </p>
              <Link
                href="/portal/payments"
                className="mt-3 inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                Go to payments →
              </Link>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Reference
            </h2>
            <dl className="mt-3 space-y-3 text-sm">
              <Row label="ID" value={item._id} mono />
              {any.clientToken && (
                <Row label="Client token" value={any.clientToken} mono />
              )}
              {any.paymentId && (
                <Row label="Payment" value={String(any.paymentId).slice(-8)} mono />
              )}
              <Row label="Created" value={formatDateTime(item.createdAt)} />
              <Row label="Updated" value={formatDateTime(item.updatedAt)} />
            </dl>
          </section>

          <div className="grid gap-2">
            <Link
              href="/portal/my-applications"
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-center text-sm font-medium text-gray-800 shadow-theme-xs hover:border-brand-200 dark:border-gray-800 dark:bg-gray-dark dark:text-white/90"
            >
              My applications
            </Link>
            <Link
              href="/portal/payments"
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-center text-sm font-medium text-gray-800 shadow-theme-xs hover:border-brand-200 dark:border-gray-800 dark:bg-gray-dark dark:text-white/90"
            >
              Payments
            </Link>
          </div>
        </div>
      </div>

      {rescheduleOpen && (
        <RescheduleModal
          consultation={item}
          onClose={() => setRescheduleOpen(false)}
          onSaved={() => {
            setRescheduleOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function Info({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
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

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
      <dd
        className={`text-right font-medium text-gray-800 dark:text-white/90 ${
          mono ? 'break-all font-mono text-xs' : ''
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function RescheduleModal({
  consultation,
  onClose,
  onSaved,
}: {
  consultation: Consultation;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [scheduledDate, setScheduledDate] = useState(
    toDatetimeLocal(consultation.scheduledDate)
  );
  const [method, setMethod] = useState<string>(String(consultation.method || 'online'));
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!scheduledDate) {
      setFormError('Choose a new date and time.');
      return;
    }
    const body: EditConsultationRequest = {
      scheduledDate: new Date(scheduledDate).toISOString(),
      method: method as ConsultationMethod,
      rescheduleReason: reason.trim() || undefined,
    };
    setSubmitting(true);
    try {
      await consultationsApi.edit(consultation._id, body);
      onSaved();
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : 'Failed to reschedule'
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
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Reschedule
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {formError && (
            <div className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
              {formError}
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">
              New date & time
            </label>
            <input
              type="datetime-local"
              required
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">
              Method
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
            >
              <option value="online">Online</option>
              <option value="phone">Phone</option>
              <option value="in_person">In person</option>
              <option value="zoom">Zoom</option>
              <option value="google-meet">Google Meet</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">
              Reason (optional)
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
            />
          </div>
          <div className="flex gap-3">
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
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}