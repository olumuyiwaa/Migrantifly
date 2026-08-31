'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  notificationsApi,
  ApiError,
  type Notification,
} from '@/lib/api';

// ---------- helpers ----------

function extractNotifications(res: unknown): Notification[] {
  if (!res || typeof res !== 'object') return [];
  const r = res as Record<string, unknown>;
  if (Array.isArray(r.data)) return r.data as Notification[];
  if (Array.isArray(r.notifications)) return r.notifications as Notification[];
  if (Array.isArray(res)) return res as Notification[];
  if (r.data && typeof r.data === 'object' && !Array.isArray(r.data)) {
    const nested = r.data as Record<string, unknown>;
    if (Array.isArray(nested.notifications)) {
      return nested.notifications as Notification[];
    }
    if (Array.isArray(nested.data)) return nested.data as Notification[];
  }
  return [];
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

function typeLabel(type?: string): string {
  if (!type) return 'General';
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

type Filter = 'all' | 'unread' | 'read';

// ---------- page ----------

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationsApi.list();
      const list = extractNotifications(res);
      list.sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      });
      setItems(list);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to load notifications'
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
    if (filter === 'unread') return items.filter((n) => !n.isRead);
    if (filter === 'read') return items.filter((n) => n.isRead);
    return items;
  }, [items, filter]);

  const unreadCount = items.filter((n) => !n.isRead).length;

  const markRead = async (n: Notification) => {
    if (n.isRead) return;
    setBusyId(n._id);
    setError(null);
    try {
      await notificationsApi.markRead(n._id);
      setItems((prev) =>
        prev.map((x) => (x._id === n._id ? { ...x, isRead: true } : x))
      );
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to mark as read'
      );
    } finally {
      setBusyId(null);
    }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    setError(null);
    setSuccess(null);
    try {
      await notificationsApi.markAllRead();
      setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
      setSuccess('All notifications marked as read.');
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to mark all as read'
      );
    } finally {
      setMarkingAll(false);
    }
  };

  const remove = async (n: Notification) => {
    setBusyId(n._id);
    setError(null);
    try {
      await notificationsApi.delete(n._id);
      setItems((prev) => prev.filter((x) => x._id !== n._id));
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to delete notification'
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">
            Notifications
          </h1>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            {unreadCount > 0
              ? `${unreadCount} unread · ${items.length} total`
              : `${items.length} total`}
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
            disabled={markingAll || unreadCount === 0}
            onClick={markAllRead}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {markingAll ? 'Updating…' : 'Mark all as read'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'unread', 'read'] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition ${
              filter === f
                ? 'bg-brand-500 text-white'
                : 'border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {success && (
        <div className="rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400">
          {success}
          <button
            type="button"
            className="ml-3 font-medium underline"
            onClick={() => setSuccess(null)}
          >
            Dismiss
          </button>
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          {error}
          <button
            type="button"
            className="ml-3 font-medium underline"
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* List */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
        {loading ? (
          <div className="flex items-center justify-center gap-2 px-4 py-16 text-gray-500">
            <span className="size-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            Loading notifications…
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-16 text-center text-gray-500 dark:text-gray-400">
            {filter === 'all'
              ? 'No notifications yet.'
              : `No ${filter} notifications.`}
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.map((n) => (
              <li
                key={n._id}
                className={`flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between ${
                  !n.isRead ? 'bg-brand-50/30 dark:bg-brand-500/[0.04]' : ''
                }`}
              >
                <div className="flex min-w-0 flex-1 gap-3">
                  <div
                    className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                      n.isRead
                        ? 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400'
                        : 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400'
                    }`}
                  >
                    {(n.title || n.message || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {n.title && (
                        <p className="font-medium text-gray-800 dark:text-white/90">
                          {n.title}
                        </p>
                      )}
                      {!n.isRead && (
                        <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase">
                          New
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">
                      {n.message}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-theme-xs text-gray-500 dark:text-gray-400">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 capitalize dark:bg-white/5">
                        {typeLabel(n.type)}
                      </span>
                      <span>{formatDateTime(n.createdAt)}</span>
                      {n.relatedType && (
                        <span className="capitalize">
                          · {n.relatedType}
                          {n.relatedId
                            ? ` · ${String(n.relatedId).slice(-6)}`
                            : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 gap-2 sm:flex-col sm:items-end">
                  {!n.isRead && (
                    <button
                      type="button"
                      disabled={busyId === n._id}
                      onClick={() => markRead(n)}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busyId === n._id}
                    onClick={() => remove(n)}
                    className="rounded-lg border border-error-200 px-3 py-1.5 text-xs font-medium text-error-600 hover:bg-error-50 disabled:opacity-50 dark:border-error-500/30 dark:text-error-400 dark:hover:bg-error-500/10"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}