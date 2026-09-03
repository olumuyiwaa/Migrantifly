'use client';

import { useState } from 'react';
import { applicationsApi, ApiError } from '@/lib/api';

interface FeedbackFormProps {
    applicationId: string;
    alreadySubmitted?: boolean;
}

export default function FeedbackForm({ applicationId, alreadySubmitted }: FeedbackFormProps) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comments, setComments] = useState('');
    const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(!!alreadySubmitted);
    const [error, setError] = useState<string | null>(null);

    if (submitted) {
        return (
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
                <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                    Feedback
                </h2>
                <p className="mt-2 text-sm text-success-600 dark:text-success-400">
                    Thank you — your feedback has been received.
                </p>
            </section>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating < 1) {
            setError('Please choose a star rating');
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            await applicationsApi.submitFeedback(applicationId, {
                rating,
                comments: comments.trim() || undefined,
                wouldRecommend: wouldRecommend ?? undefined,
            });
            setSubmitted(true);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to submit feedback');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                How was your experience?
            </h2>
            <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                Your case is now closed. A couple of minutes of feedback helps us improve.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="text-2xl leading-none"
                            aria-label={`${star} star${star > 1 ? 's' : ''}`}
                        >
                            <span
                                className={
                                    (hoverRating || rating) >= star
                                        ? 'text-warning-400'
                                        : 'text-gray-200 dark:text-gray-700'
                                }
                            >
                                ★
                            </span>
                        </button>
                    ))}
                </div>

                <div>
                    <label className="mb-1.5 block text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                        Comments (optional)
                    </label>
                    <textarea
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        rows={3}
                        placeholder="Tell us about your experience…"
                        className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                    />
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <span>Would you recommend Migrantifly?</span>
                    <button
                        type="button"
                        onClick={() => setWouldRecommend(true)}
                        className={`rounded-lg border px-3 py-1.5 text-theme-xs font-medium ${
                            wouldRecommend === true
                                ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/10'
                                : 'border-gray-200 text-gray-500 dark:border-gray-700'
                        }`}
                    >
                        Yes
                    </button>
                    <button
                        type="button"
                        onClick={() => setWouldRecommend(false)}
                        className={`rounded-lg border px-3 py-1.5 text-theme-xs font-medium ${
                            wouldRecommend === false
                                ? 'border-error-500 bg-error-50 text-error-600 dark:bg-error-500/10'
                                : 'border-gray-200 text-gray-500 dark:border-gray-700'
                        }`}
                    >
                        No
                    </button>
                </div>

                {error && (
                    <div className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-theme-xs text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                >
                    {submitting ? 'Submitting…' : 'Submit Feedback'}
                </button>
            </form>
        </section>
    );
}
