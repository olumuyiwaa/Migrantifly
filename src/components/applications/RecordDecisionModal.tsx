'use client';

import { useState } from 'react';
import { type DecisionOutcome } from '@/lib/api';

interface RecordDecisionModalProps {
    applicationId: string;
    onClose: () => void;
    onSubmit: (outcome: DecisionOutcome, decisionLetter: string, notes: string) => Promise<void>;
    loading: boolean;
}

export function RecordDecisionModal({
                                        applicationId,
                                        onClose,
                                        onSubmit,
                                        loading,
                                    }: RecordDecisionModalProps) {
    const [outcome, setOutcome] = useState<DecisionOutcome>('approved');
    const [decisionLetter, setDecisionLetter] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(outcome, decisionLetter.trim(), notes.trim());
    };

    return (
        <div className="fixed inset-0 z-99999 flex items-center justify-center p-4">
            <button
                type="button"
                className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
                aria-label="Close"
                onClick={onClose}
            />
            <div className="relative z-10 w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xl dark:border-gray-800 dark:bg-gray-dark">
                <div className="mb-5 flex items-start justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                            Record Decision
                        </h2>
                        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                            Application: {applicationId.slice(-8)}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5"
                    >
                        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                            Decision Outcome <span className="text-error-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setOutcome('approved')}
                                className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                                    outcome === 'approved'
                                        ? 'bg-green-50 text-green-700 ring-2 ring-green-500 dark:bg-green-500/15 dark:text-green-400'
                                        : 'border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5'
                                }`}
                            >
                                ✅ Approved
                            </button>
                            <button
                                type="button"
                                onClick={() => setOutcome('declined')}
                                className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                                    outcome === 'declined'
                                        ? 'bg-red-50 text-red-700 ring-2 ring-red-500 dark:bg-red-500/15 dark:text-red-400'
                                        : 'border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5'
                                }`}
                            >
                                ❌ Declined
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                            Decision Letter <span className="text-error-500">*</span>
                        </label>
                        <textarea
                            value={decisionLetter}
                            onChange={(e) => setDecisionLetter(e.target.value)}
                            placeholder="Paste the official decision letter text..."
                            rows={5}
                            className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                            required
                        />
                        <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                            Include the full text of the decision letter from the immigration authority
                        </p>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                            Notes (Optional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any additional notes about this decision..."
                            rows={2}
                            className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!decisionLetter.trim() || loading}
                            className="flex-1 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                        >
                            {loading ? 'Recording...' : 'Record Decision'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}