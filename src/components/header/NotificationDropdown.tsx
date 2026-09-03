'use client';

import Link from 'next/link';
import React, { useCallback, useEffect, useState } from 'react';
import { Dropdown } from '../ui/dropdown/Dropdown';
import { DropdownItem } from '../ui/dropdown/DropdownItem';
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

function timeAgo(iso?: string): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const seconds = Math.floor((Date.now() - then) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function typeLabel(type?: string): string {
  if (!type) return 'General';
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function initialFrom(n: Notification): string {
  const t = n.title || n.message || '?';
  return t.trim().charAt(0).toUpperCase();
}

function hrefFor(n: Notification): string | undefined {
  if (!n.relatedId || !n.relatedType) return undefined;
  const map: Record<string, string> = {
    application: `/admin/applications`,
    document: `/admin/documents`,
    consultation: `/admin/consultations`,
    payment: `/admin/payments`,
    user: `/admin/users`,
  };
  const base = map[n.relatedType.toLowerCase()];
  return base;
}

// ---------- component ----------

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = items.filter((n) => !n.isRead).length;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationsApi.list();
      const list = extractNotifications(res);
      // Newest first
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
    // light poll while mounted
    const id = window.setInterval(load, 60_000);
    return () => window.clearInterval(id);
  }, [load]);

  function toggleDropdown() {
    setIsOpen((o) => !o);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleOpen = () => {
    toggleDropdown();
    if (!isOpen) load();
  };

  const markOneRead = async (n: Notification) => {
    if (n.isRead) return;
    try {
      await notificationsApi.markRead(n._id);
      setItems((prev) =>
        prev.map((x) => (x._id === n._id ? { ...x, isRead: true } : x))
      );
    } catch {
      // ignore — list still usable
    }
  };

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to mark all as read'
      );
    }
  };

  const preview = items.slice(0, 12);

  return (
    <div className="relative">
      <button
        type="button"
        className="dropdown-toggle relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={handleOpen}
        aria-label="Notifications"
      >
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0 z-10 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-400" />
          </span>
        )}
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute left-1/2 z-50 mt-[17px] flex h-[480px] w-[min(350px,calc(100vw-1.5rem))] -translate-x-1/2 flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:left-auto sm:right-0 sm:w-[361px] sm:translate-x-0 lg:right-0"      >
        <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
          <div>
            <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Notifications
            </h5>
            {unreadCount > 0 && (
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                {unreadCount} unread
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="rounded-lg px-2 py-1 text-theme-xs font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10"
              >
                Mark all read
              </button>
            )}
            <button
              type="button"
              onClick={closeDropdown}
              className="text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Close"
            >
              <svg
                className="fill-current"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </div>

        <ul className="custom-scrollbar flex h-auto flex-col overflow-y-auto">
          {loading && items.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-gray-500">
              Loading…
            </li>
          )}
          {error && (
            <li className="px-4 py-3 text-center text-sm text-error-600">
              {error}
            </li>
          )}
          {!loading && !error && preview.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              No notifications yet
            </li>
          )}

          {preview.map((n) => {
            const href = hrefFor(n);
            return (
              <li key={n._id}>
                <DropdownItem
                  onItemClick={() => {
                    markOneRead(n);
                    closeDropdown();
                  }}
                  href={href}
                  className={`flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5 ${
                    !n.isRead ? 'bg-brand-50/40 dark:bg-brand-500/5' : ''
                  }`}
                >
                  <span className="relative z-1 block h-10 w-full max-w-10">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                      {initialFrom(n)}
                    </span>
                    <span
                      className={`absolute right-0 bottom-0 z-10 h-2.5 w-2.5 max-w-2.5 rounded-full border-[1.5px] border-white dark:border-gray-900 ${
                        n.isRead ? 'bg-gray-300' : 'bg-success-500'
                      }`}
                    />
                  </span>

                  <span className="block min-w-0 flex-1">
                    <span className="mb-1.5 block text-theme-sm text-gray-500 dark:text-gray-400">
                      {n.title ? (
                        <>
                          <span className="font-medium text-gray-800 dark:text-white/90">
                            {n.title}
                          </span>
                          {n.message ? (
                            <span className="mt-0.5 block line-clamp-2">
                              {n.message}
                            </span>
                          ) : null}
                        </>
                      ) : (
                        <span className="line-clamp-2 text-gray-800 dark:text-white/90">
                          {n.message}
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-2 text-theme-xs text-gray-500 dark:text-gray-400">
                      <span>{typeLabel(n.type)}</span>
                      <span className="h-1 w-1 rounded-full bg-gray-400" />
                      <span>{timeAgo(n.createdAt)}</span>
                    </span>
                  </span>
                </DropdownItem>
              </li>
            );
          })}
        </ul>

        <Link
          href="/portal/notifications"
          onClick={closeDropdown}
          className="mt-3 block rounded-lg border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          View all notifications
        </Link>
      </Dropdown>
    </div>
  );
}