'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminApi, ApiError, type Feedback } from '@/lib/api';

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

function clientName(feedback: Feedback): string {
    const client = feedback.clientId as unknown;
    if (client && typeof client === 'object') {
        const c = client as { profile?: { firstName?: string; lastName?: string }; email?: string };
        const name = [c.profile?.firstName, c.profile?.lastName].filter(Boolean).join(' ');
        return name || c.email || 'Client';
    }
    return 'Client';
}

function visaType(feedback: Feedback): string {
    const app = feedback.applicationId as unknown;
    if (app && typeof app === 'object') {
        const a = app as { visaType?: string; outcome?: string };
        return a.visaType ? a.visaType.replace(/_/g, ' ') : '—';
    }
    return '—';
}

function Stars({ rating }: { rating: number }) {
    return (
        <span className="text-warning-400">
            {'★'.repeat(rating)}
            <span className="text-gray-200 dark:text-gray-700">{'★'.repeat(5 - rating)}</span>
        </span>
    );
}

export default function FeedbackPage() {
    const [feedback, setFeedback] = useState<Feedback[]>([]);
    const [averageRating, setAverageRating] = useState<number | null>(null);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const limit = 20;

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await adminApi.feedback({ page, limit });
            setFeedback(res.data || []);
            setAverageRating(res.averageRating ?? null);
            setTotal(res.pagination?.total ?? (res.data || []).length);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to load feedback');
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div>
                <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">
                    Client Feedback
                </h1>
                <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                    Feedback submitted by clients after their case is closed.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
                    <p className="text-theme-xs text-gray-500 dark:text-gray-400">Average rating</p>
                    <p className="mt-1 text-title-sm font-semibold text-gray-800 dark:text-white/90">
                        {averageRating ? averageRating.toFixed(1) : '—'}
                        <span className="ml-1 text-sm font-normal text-gray-400">/ 5</span>
                    </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
                    <p className="text-theme-xs text-gray-500 dark:text-gray-400">Responses</p>
                    <p className="mt-1 text-title-sm font-semibold text-gray-800 dark:text-white/90">
                        {total}
                    </p>
                </div>
            </div>

            {error && (
                <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
                    {error}
                </div>
            )}

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                        <thead className="bg-gray-50 dark:bg-white/5">
                            <tr>
                                <th className="px-5 py-3 text-left text-theme-xs font-medium uppercase text-gray-500 dark:text-gray-400">Client</th>
                                <th className="px-5 py-3 text-left text-theme-xs font-medium uppercase text-gray-500 dark:text-gray-400">Visa Type</th>
                                <th className="px-5 py-3 text-left text-theme-xs font-medium uppercase text-gray-500 dark:text-gray-400">Rating</th>
                                <th className="px-5 py-3 text-left text-theme-xs font-medium uppercase text-gray-500 dark:text-gray-400">Would Recommend</th>
                                <th className="px-5 py-3 text-left text-theme-xs font-medium uppercase text-gray-500 dark:text-gray-400">Comments</th>
                                <th className="px-5 py-3 text-left text-theme-xs font-medium uppercase text-gray-500 dark:text-gray-400">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-6 text-center text-sm text-gray-400">
                                        Loading…
                                    </td>
                                </tr>
                            ) : feedback.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-6 text-center text-sm text-gray-400">
                                        No feedback submitted yet
                                    </td>
                                </tr>
                            ) : (
                                feedback.map((f) => (
                                    <tr key={f._id}>
                                        <td className="whitespace-nowrap px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300">
                                            {clientName(f)}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3.5 text-sm capitalize text-gray-700 dark:text-gray-300">
                                            {visaType(f)}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3.5 text-sm">
                                            <Stars rating={f.rating} />
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300">
                                            {f.wouldRecommend === true ? 'Yes' : f.wouldRecommend === false ? 'No' : '—'}
                                        </td>
                                        <td className="max-w-xs px-5 py-3.5 text-sm text-gray-600 dark:text-gray-400">
                                            {f.comments || '—'}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400">
                                            {formatDate(f.submittedAt || f.createdAt)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {total > limit && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3 dark:border-gray-800">
                        <button
                            type="button"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300"
                        >
                            Previous
                        </button>
                        <span className="text-theme-xs text-gray-500 dark:text-gray-400">
                            Page {page} of {Math.ceil(total / limit)}
                        </span>
                        <button
                            type="button"
                            disabled={page >= Math.ceil(total / limit)}
                            onClick={() => setPage((p) => p + 1)}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
