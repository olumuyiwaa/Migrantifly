'use client';

import { useCallback, useEffect, useState } from 'react';
import {
    adminApi,
    applicationsApi,
    consultationsApi,
    documentsApi,
    deadlinesApi,
    ApiError,
    patchApi,
    type CreateAdviserRequest,
    type User,
    type UserRole,
    type Application,
    type Consultation,
    type DocumentItem,
    type DeadlineItem,
} from '@/lib/api';
import UserDetailModal from '@/components/user-management/UserDetailModal';
import CreateAdviserModal from '@/components/user-management/CreateAdviserModal';

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

const ROLE_BADGE: Record<UserRole, string> = {
    admin: 'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400',
    adviser: 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
    client:
        'bg-blue-light-50 text-blue-light-700 dark:bg-blue-light-500/15 dark:text-blue-light-400',
};

const ROLE_LABELS: Record<UserRole, string> = {
    admin: 'Admin',
    adviser: 'Adviser',
    client: 'Client',
};

function extractUsersResponse(res: unknown): { users: User[]; total: number } {
    if (!res || typeof res !== 'object') return { users: [], total: 0 };
    const r = res as Record<string, unknown>;
    const data = r.data as Record<string, unknown> | User[] | undefined;

    if (data && typeof data === 'object' && !Array.isArray(data)) {
        const users = Array.isArray(data.users) ? (data.users as User[]) : [];
        const total =
            typeof data.total === 'number' ? data.total : users.length;
        return { users, total };
    }
    if (Array.isArray(data)) return { users: data, total: data.length };
    if (Array.isArray(r.users)) {
        return {
            users: r.users as User[],
            total: typeof r.total === 'number' ? r.total : (r.users as User[]).length,
        };
    }
    if (Array.isArray(res)) return { users: res as User[], total: (res as User[]).length };
    return { users: [], total: 0 };
}

function extractArray<T>(res: unknown, keys: string[] = ['data', 'items']): T[] {
    if (Array.isArray(res)) return res as T[];
    if (!res || typeof res !== 'object') return [];
    const r = res as Record<string, unknown>;
    for (const key of keys) {
        const v = r[key];
        if (Array.isArray(v)) return v as T[];
        if (v && typeof v === 'object' && !Array.isArray(v)) {
            const nested = v as Record<string, unknown>;
            for (const k of ['items', 'applications', 'documents', 'consultations', 'data']) {
                if (Array.isArray(nested[k])) return nested[k] as T[];
            }
        }
    }
    for (const k of ['applications', 'documents', 'consultations', 'requests']) {
        if (Array.isArray(r[k])) return r[k] as T[];
    }
    return [];
}

/**
 * Change user role.
 * Swagger did not document this route — tries PATCH /admin/users/:id
 * Adjust path if your backend uses a different endpoint.
 */
async function updateUserRole(userId: string, role: UserRole) {
    return patchApi<{ success?: boolean; message?: string; data?: User }>(
        `/admin/users/${userId}`,
        { role }
    );
}

// ---------- page ----------

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [role, setRole] = useState<UserRole | ''>('');
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [total, setTotal] = useState(0);

    const [createOpen, setCreateOpen] = useState(false);
    const [detailUser, setDetailUser] = useState<User | null>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await adminApi.users({
                role: role || undefined,
                search: search || undefined,
                page,
                limit,
            });
            const { users: list, total: count } = extractUsersResponse(res);
            setUsers(list);
            setTotal(count);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to load users');
            setUsers([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [role, search, page, limit]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const onSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        setSearch(searchInput.trim());
    };

    const totalPages = Math.max(1, Math.ceil(total / limit) || 1);

    return (
        <div className="space-y-6 p-4 md:p-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">
                        User management
                    </h1>
                    <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                        View clients, advisers, and admins. Open a user for details, related
                        records, and role changes.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                >
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create adviser
                </button>
            </div>

            {/* Filters */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
                <div className="flex flex-col gap-3 md:flex-row md:items-end">
                    <form onSubmit={onSearchSubmit} className="flex flex-1 gap-2">
                        <div className="relative flex-1">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </span>
                            <input
                                type="search"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search by email or name…"
                                className="w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pr-3 pl-10 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                            />
                        </div>
                        <button
                            type="submit"
                            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5"
                        >
                            Search
                        </button>
                    </form>

                    <div className="w-full md:w-48">
                        <label className="mb-1.5 block text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                            Role
                        </label>
                        <select
                            value={role}
                            onChange={(e) => {
                                setPage(1);
                                setRole(e.target.value as UserRole | '');
                            }}
                            className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                        >
                            <option value="">All roles</option>
                            <option value="client">Client</option>
                            <option value="adviser">Adviser</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                </div>
            </div>

            {error && (
                <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
                    {error}
                    <button
                        type="button"
                        onClick={fetchUsers}
                        className="ml-3 font-medium underline hover:no-underline"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                        <thead>
                        <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03]">
                            <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">User</th>
                            <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Role</th>
                            <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Phone</th>
                            <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                            <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Joined</th>
                            <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                                    <div className="inline-flex items-center gap-2">
                                        <span className="size-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                                        Loading users…
                                    </div>
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-4 py-12 text-center text-gray-500 dark:text-gray-400"
                                >
                                    No users found.
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr
                                    key={user._id}
                                    className="border-b border-gray-100 last:border-0 dark:border-gray-800/60"
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                                                {displayName(user).charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate font-medium text-gray-800 dark:text-white/90">
                                                    {displayName(user)}
                                                </p>
                                                <p className="truncate text-theme-xs text-gray-500 dark:text-gray-400">
                                                    {user.email}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                      <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${ROLE_BADGE[user.role] ?? ROLE_BADGE.client}`}
                      >
                        {user.role}
                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                        {(user.profile?.phone as string) || '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        {user.isActive === false ? (
                                            <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-white/5 dark:text-gray-400">
                          Inactive
                        </span>
                                        ) : (
                                            <span className="inline-flex rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-medium text-success-700 dark:bg-success-500/15 dark:text-success-400">
                          Active
                        </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                        {formatDate(user.createdAt)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            type="button"
                                            onClick={() => setDetailUser(user)}
                                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

                {!loading && (totalPages > 1 || total > 0) && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-800">
                        <p className="text-theme-sm text-gray-500 dark:text-gray-400">
                            Page {page} of {totalPages}
                            {total > 0 && ` · ${total} total`}
                        </p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                            >
                                Previous
                            </button>
                            <button
                                type="button"
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => p + 1)}
                                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {detailUser && (
                <UserDetailModal
                    user={detailUser}
                    onClose={() => setDetailUser(null)}
                    onUserUpdated={(updated) => {
                        setDetailUser(updated);
                        setUsers((prev) =>
                            prev.map((u) => (u._id === updated._id ? updated : u))
                        );
                    }}
                />
            )}

            {createOpen && (
                <CreateAdviserModal
                    onClose={() => setCreateOpen(false)}
                    onSuccess={() => {
                        setCreateOpen(false);
                        setPage(1);
                        fetchUsers();
                    }}
                />
            )}
        </div>
    );
}