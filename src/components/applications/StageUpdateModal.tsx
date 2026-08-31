'use client';

import { type Application, type ApplicationStage } from '@/lib/api';

const STAGE_LABELS: Record<ApplicationStage, string> = {
    consultation: 'Consultation',
    deposit_paid: 'Deposit Paid',
    documents_completed: 'Documents Completed',
    additional_docs_required: 'Additional Docs Required',
    submitted_to_inz: 'Submitted to INZ',
    inz_processing: 'INZ Processing',
    rfi_received: 'RFI Received',
    ppi_received: 'PPI Received',
    decision: 'Decision',
};

const STAGE_BADGE_COLORS: Record<ApplicationStage, string> = {
    consultation: 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300',
    deposit_paid: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
    documents_completed: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400',
    additional_docs_required: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
    submitted_to_inz: 'bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
    inz_processing: 'bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
    rfi_received: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400',
    ppi_received: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
    decision: 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400',
};

// Export these helpers so they can be used elsewhere
export { STAGE_LABELS, STAGE_BADGE_COLORS };

// Helper function to get available actions based on current stage
export function getAvailableActions(stage: ApplicationStage): string[] {
    const actions: string[] = [];

    switch (stage) {
        case 'consultation':
        case 'deposit_paid':
        case 'documents_completed':
            actions.push('submit_to_inz');
            break;
        case 'submitted_to_inz':
        case 'inz_processing':
            actions.push('add_rfi', 'add_ppi', 'record_decision');
            break;
        case 'rfi_received':
        case 'ppi_received':
            actions.push('record_decision');
            break;
        case 'decision':
            // Final stage - no further actions
            break;
        default:
            break;
    }

    return actions;
}

// Helper function to validate stage transitions
export function isStageTransitionValid(currentStage: ApplicationStage, newStage: ApplicationStage): boolean {
    const stageOrder: ApplicationStage[] = [
        'consultation',
        'deposit_paid',
        'documents_completed',
        'additional_docs_required',
        'submitted_to_inz',
        'inz_processing',
        'rfi_received',
        'ppi_received',
        'decision'
    ];

    const currentIndex = stageOrder.indexOf(currentStage);
    const newIndex = stageOrder.indexOf(newStage);

    // If either stage is not found, allow the transition
    if (currentIndex === -1 || newIndex === -1) {
        return true;
    }

    // Can't go backwards
    if (newIndex < currentIndex) {
        return false;
    }

    // Special cases
    if (currentStage === 'additional_docs_required' && newStage === 'documents_completed') {
        return true;
    }

    if ((currentStage === 'rfi_received' || currentStage === 'ppi_received') && newStage === 'decision') {
        return true;
    }

    // For 'consultation', allow transition to 'deposit_paid' or directly to 'documents_completed'
    if (currentStage === 'consultation' && newStage === 'documents_completed') {
        return true;
    }

    // Normal progression - can only go to next stage or skip one stage
    return Math.abs(newIndex - currentIndex) <= 1 || (newIndex - currentIndex) <= 2;
}

interface StageUpdateModalProps {
    application: Application;
    currentStage: ApplicationStage;
    newStage: ApplicationStage | '';
    onStageChange: (stage: ApplicationStage | '') => void;
    notes: string;
    onNotesChange: (notes: string) => void;
    onClose: () => void;
    onSubmit: () => void;
    loading: boolean;
}

export function StageUpdateModal({
                                     application,
                                     currentStage,
                                     newStage,
                                     onStageChange,
                                     notes,
                                     onNotesChange,
                                     onClose,
                                     onSubmit,
                                     loading,
                                 }: StageUpdateModalProps) {
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
                            Update Application Stage
                        </h2>
                        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                            Application: {application._id.slice(-8)}
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
                            Current Stage
                        </label>
                        <div className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${STAGE_BADGE_COLORS[currentStage]}`}>
                            {STAGE_LABELS[currentStage] || currentStage}
                        </div>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                            New Stage <span className="text-error-500">*</span>
                        </label>
                        <select
                            value={newStage}
                            onChange={(e) => onStageChange(e.target.value as ApplicationStage)}
                            className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                            required
                        >
                            <option value="">Select stage...</option>
                            {Object.entries(STAGE_LABELS).map(([key, label]) => {
                                // Optionally filter stages based on transition validity
                                const stageKey = key as ApplicationStage;
                                const isValid = newStage ? true : isStageTransitionValid(currentStage, stageKey);
                                return (
                                    <option key={key} value={key} disabled={!isValid}>
                                        {label} {!isValid ? '(Invalid transition)' : ''}
                                    </option>
                                );
                            })}
                        </select>
                        {newStage && !isStageTransitionValid(currentStage, newStage as ApplicationStage) && (
                            <p className="mt-1 text-xs text-error-500">
                                Invalid stage transition. Please select a valid next stage.
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                            Notes (Optional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => onNotesChange(e.target.value)}
                            placeholder="Add notes about this stage update..."
                            rows={3}
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
                            type="button"
                            onClick={onSubmit}
                            disabled={
                                !newStage ||
                                newStage === currentStage ||
                                loading ||
                                (newStage && !isStageTransitionValid(currentStage, newStage as ApplicationStage))
                            }
                            className="flex-1 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                        >
                            {loading ? 'Updating...' : 'Update Stage'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}