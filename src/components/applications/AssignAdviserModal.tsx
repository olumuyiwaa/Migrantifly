'use client';

import { type Application, type User } from '@/lib/api';

function getClientDisplayInfo(app: Application): { name: string; id: string; email?: string } {
    if (app.clientId && typeof app.clientId === 'object') {
        const client = app.clientId as any;
        const firstName = client.profile?.firstName || '';
        const lastName = client.profile?.lastName || '';
        const name = [firstName, lastName].filter(Boolean).join(' ') || client.email || 'Client';
        return {
            name,
            id: client._id || client.id || 'N/A',
            email: client.email,
        };
    }
    if (typeof app.clientId === 'string') {
        return {
            name: `Client ${app.clientId.slice(-6)}`,
            id: app.clientId,
        };
    }
    return {
        name: 'Unknown Client',
        id: 'N/A',
    };
}

interface AssignAdviserModalProps {
    application: Application;
    advisers: User[];
    selectedAdviserId: string;
    onAdviserChange: (id: string) => void;
    onClose: () => void;
    onSubmit: () => void;
    loading: boolean;
}

export function AssignAdviserModal({
                                       application,
                                       advisers,
                                       selectedAdviserId,
                                       onAdviserChange,
                                       onClose,
                                       onSubmit,
                                       loading,
                                   }: AssignAdviserModalProps) {
    const clientInfo = getClientDisplayInfo(application);

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
                            Assign Adviser
                        </h2>
                        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                            Application: {clientInfo.name}
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

                <div className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                            Select Adviser <span className="text-error-500">*</span>
                        </label>
                        <select
                            value={selectedAdviserId}
                            onChange={(e) => onAdviserChange(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                            required
                        >
                            <option value="">Select adviser...</option>
                            {advisers.length === 0 ? (
                                <option value="" disabled>No advisers available</option>
                            ) : (
                                advisers.map(adviser => (
                                    <option key={adviser._id} value={adviser._id}>
                                        {adviser.profile?.firstName} {adviser.profile?.lastName} ({adviser.email})
                                    </option>
                                ))
                            )}
                        </select>
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
                            type="button"
                            onClick={onSubmit}
                            disabled={!selectedAdviserId || loading}
                            className="flex-1 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                        >
                            {loading ? 'Assigning...' : 'Assign Adviser'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}