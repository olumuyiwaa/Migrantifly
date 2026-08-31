'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import {
    applicationsApi,
    adminApplicationsApi,
    adminApi,
    ApiError,
    type Application,
    type ApplicationStage,
    type VisaType,
    type User,
} from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {StageUpdateModal} from "@/components/applications/StageUpdateModal";
import {AssignAdviserModal} from "@/components/applications/AssignAdviserModal";
import {ApplicationDetailModal} from "@/components/applications/DetailsModal";

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

const VISA_TYPE_LABELS: Record<VisaType, string> = {
    work: 'Work Visa',
    partner: 'Partner Visa',
    student: 'Student Visa',
    residence: 'Residence Visa',
    visitor: 'Visitor Visa',
    business: 'Business Visa',
};

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

function getStageBadgeColor(stage: ApplicationStage): string {
    return STAGE_BADGE_COLORS[stage] || 'bg-gray-100 text-gray-700';
}

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

function getAdviserDisplayInfo(app: Application): string {
    if (!app.adviserId) return 'Not assigned';
    if (typeof app.adviserId === 'object') {
        const adviser = app.adviserId as any;
        const firstName = adviser.profile?.firstName || '';
        const lastName = adviser.profile?.lastName || '';
        const name = [firstName, lastName].filter(Boolean).join(' ') || adviser.email || 'Adviser';
        return name;
    }
    if (typeof app.adviserId === 'string') {
        return `Adviser ${app.adviserId.slice(-6)}`;
    }
    return 'Not assigned';
}

// ---------- Main Component ----------

export default function ApplicationsPage() {
    const router = useRouter();
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [advisers, setAdvisers] = useState<User[]>([]);

    // Selection state for bulk actions
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [selectAll, setSelectAll] = useState(false);

    // Modal states
    const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showStageModal, setShowStageModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
    const [showBulkStageModal, setShowBulkStageModal] = useState(false);

    // Form states
    const [newStage, setNewStage] = useState<ApplicationStage | ''>('');
    const [stageNotes, setStageNotes] = useState('');
    const [updatingStage, setUpdatingStage] = useState(false);
    const [selectedAdviserId, setSelectedAdviserId] = useState('');
    const [assigningAdviser, setAssigningAdviser] = useState(false);

    // Advanced filters
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [advancedFilters, setAdvancedFilters] = useState({
        stages: [] as ApplicationStage[],
        visaTypes: [] as VisaType[],
        dateFrom: '',
        dateTo: '',
        adviserId: '',
    });

    // Basic filters
    const [filters, setFilters] = useState({
        stage: '' as ApplicationStage | '',
        visaType: '' as VisaType | '',
        search: '',
    });
    const [searchInput, setSearchInput] = useState('');
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [total, setTotal] = useState(0);

    // WebSocket for real-time updates
    // const { isConnected, lastEvent } = useWebSocket(undefined, {
    //     onMessage: (event) => {
    //         // Handle real-time updates
    //         if (event.type === 'application_updated' || event.type === 'stage_changed') {
    //             fetchApplications(); // Refresh the list
    //         }
    //     },
    // });

    // Fetch advisers for assignment
    useEffect(() => {
        const fetchAdvisers = async () => {
            try {
                const res = await adminApi.users({ role: 'adviser', limit: 100 });
                const list = (res as any).data?.users || (res as any).users || [];
                setAdvisers(Array.isArray(list) ? list : []);
            } catch (error) {
                console.error('Failed to fetch advisers:', error);
            }
        };
        fetchAdvisers();
    }, []);

    const fetchApplications = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await applicationsApi.list({
                stage: filters.stage || undefined,
                visaType: filters.visaType || undefined,
                search: filters.search || undefined,
                page,
                limit,
            });

            let appList: Application[] = [];
            let totalCount = 0;

            if (res && typeof res === 'object') {
                const responseData = (res as any).data || res;
                if (Array.isArray(responseData.applications)) {
                    appList = responseData.applications;
                    totalCount = responseData.pagination?.total || appList.length;
                } else if (Array.isArray(responseData.data)) {
                    appList = responseData.data;
                    totalCount = responseData.pagination?.total || appList.length;
                } else if (Array.isArray(res)) {
                    appList = res;
                    totalCount = res.length;
                }
            }

            setApplications(appList);
            setTotal(totalCount);
        } catch (err) {
            const message = err instanceof ApiError ? err.message : 'Failed to load applications';
            setError(message);
            setApplications([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [filters.stage, filters.visaType, filters.search, page, limit]);

    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    // ---------- Selection Handlers ----------
    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
        setSelectAll(newSelected.size === applications.length);
    };

    const toggleSelectAll = () => {
        if (selectAll) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(applications.map(app => app._id)));
        }
        setSelectAll(!selectAll);
    };

    const clearSelection = () => {
        setSelectedIds(new Set());
        setSelectAll(false);
    };

    // ---------- Bulk Actions ----------
    const handleBulkStageUpdate = async () => {
        if (!newStage || selectedIds.size === 0) return;

        setUpdatingStage(true);
        try {
            await adminApplicationsApi.bulkAction({
                applicationIds: Array.from(selectedIds),
                action: 'update_stage',
                data: { stage: newStage, notes: stageNotes || undefined },
            });
            await fetchApplications();
            clearSelection();
            setShowBulkStageModal(false);
            setNewStage('');
            setStageNotes('');
        } catch (err) {
            const message = err instanceof ApiError ? err.message : 'Failed to update stages';
            setError(message);
        } finally {
            setUpdatingStage(false);
        }
    };

    const handleBulkAssignAdviser = async () => {
        if (!selectedAdviserId || selectedIds.size === 0) return;

        setAssigningAdviser(true);
        try {
            await adminApplicationsApi.bulkAssignAdviser(
                Array.from(selectedIds),
                selectedAdviserId
            );
            await fetchApplications();
            clearSelection();
            setShowBulkAssignModal(false);
            setSelectedAdviserId('');
        } catch (err) {
            const message = err instanceof ApiError ? err.message : 'Failed to assign adviser';
            setError(message);
        } finally {
            setAssigningAdviser(false);
        }
    };

    // ---------- Export ----------
    const handleExport = async (format: 'csv' | 'excel' = 'csv') => {
        try {
            const response = await adminApplicationsApi.exportApplications({
                stage: filters.stage || undefined,
                visaType: filters.visaType || undefined,
            });

            // If the API returns a URL, download it
            if (response.data?.url) {
                window.open(response.data.url, '_blank');
            } else {
                // Fallback: export current data as CSV
                exportToCSV(applications);
            }
        } catch (error) {
            console.error('Export failed:', error);
            // Fallback: export current data
            exportToCSV(applications);
        }
    };

    const exportToCSV = (data: Application[]) => {
        const headers = ['ID', 'Client', 'Visa Type', 'Stage', 'Adviser', 'Created', 'Updated'];
        const rows = data.map(app => {
            const clientInfo = getClientDisplayInfo(app);
            return [
                app._id,
                clientInfo.name,
                VISA_TYPE_LABELS[app.visaType] || app.visaType,
                STAGE_LABELS[app.stage] || app.stage,
                getAdviserDisplayInfo(app),
                formatDate(app.createdAt),
                formatDate(app.updatedAt),
            ];
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(',')),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `applications_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // ---------- Single Application Actions ----------
    const handleAssignAdviser = async (applicationId: string) => {
        if (!selectedAdviserId) return;

        setAssigningAdviser(true);
        try {
            await adminApplicationsApi.assignAdviser(applicationId, selectedAdviserId);
            await fetchApplications();
            setShowAssignModal(false);
            setSelectedAdviserId('');
        } catch (err) {
            const message = err instanceof ApiError ? err.message : 'Failed to assign adviser';
            setError(message);
        } finally {
            setAssigningAdviser(false);
        }
    };

    const handleViewDetails = (app: Application) => {
        setSelectedApplication(app);
        setShowDetailModal(true);
    };

    const handleStageUpdate = (app: Application) => {
        setSelectedApplication(app);
        setNewStage(app.stage);
        setStageNotes('');
        setShowStageModal(true);
    };

    const handleSubmitStageUpdate = async () => {
        if (!selectedApplication || !newStage) return;

        setUpdatingStage(true);
        try {
            await applicationsApi.updateStage(selectedApplication._id, {
                stage: newStage,
                notes: stageNotes || undefined,
            });
            await fetchApplications();
            setShowStageModal(false);
            setSelectedApplication(null);
            setNewStage('');
            setStageNotes('');
        } catch (err) {
            const message = err instanceof ApiError ? err.message : 'Failed to update stage';
            setError(message);
        } finally {
            setUpdatingStage(false);
        }
    };

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return (
        <div className="space-y-6 p-4 md:p-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">
                        Applications
                    </h1>
                    <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                        Manage and track all visa applications
                    </p>
                    {/*{isConnected && (*/}
                    {/*    <span className="inline-flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">*/}
                    {/*        <span className="relative flex size-2">*/}
                    {/*            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />*/}
                    {/*            <span className="relative inline-flex size-2 rounded-full bg-green-500" />*/}
                    {/*        </span>*/}
                    {/*        Live updates connected*/}
                    {/*    </span>*/}
                    {/*)}*/}
                </div>
                <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
                        Total: {total}
                    </span>
                    {selectedIds.size > 0 && (
                        <span className="inline-flex items-center rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-400">
                            {selectedIds.size} selected
                        </span>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    <form onSubmit={(e) => { e.preventDefault(); setPage(1); setFilters(prev => ({ ...prev, search: searchInput.trim() })); }} className="md:col-span-2">
                        <div className="relative">
                            <label className="mb-1.5 block text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                                Search Application
                            </label>
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="search"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search by email, name, or reference…"
                                className="w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pr-3 pl-10 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                            />
                        </div>
                    </form>

                    <div>
                        <label className="mb-1.5 block text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                            Visa Type
                        </label>
                        <select
                            value={filters.visaType}
                            onChange={(e) => { setPage(1); setFilters(prev => ({ ...prev, visaType: e.target.value as VisaType | '' })); }}
                            className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                        >
                            <option value="">All Types</option>
                            {Object.entries(VISA_TYPE_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                            Stage
                        </label>
                        <select
                            value={filters.stage}
                            onChange={(e) => { setPage(1); setFilters(prev => ({ ...prev, stage: e.target.value as ApplicationStage | '' })); }}
                            className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                        >
                            <option value="">All Stages</option>
                            {Object.entries(STAGE_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Advanced Filters Toggle */}
                <div className="mt-3">
                    <button
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                    >
                        {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
                    </button>
                </div>

                {/* Advanced Filters */}
                {showAdvancedFilters && (
                    <div className="mt-4 grid grid-cols-1 gap-3 border-t border-gray-200 pt-4 dark:border-gray-700 md:grid-cols-4">
                        <div>
                            <label className="mb-1.5 block text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                                Date From
                            </label>
                            <input
                                type="date"
                                value={advancedFilters.dateFrom}
                                onChange={(e) => setAdvancedFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                                className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                                Date To
                            </label>
                            <input
                                type="date"
                                value={advancedFilters.dateTo}
                                onChange={(e) => setAdvancedFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                                className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                                Adviser
                            </label>
                            <select
                                value={advancedFilters.adviserId}
                                onChange={(e) => setAdvancedFilters(prev => ({ ...prev, adviserId: e.target.value }))}
                                className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                            >
                                <option value="">All Advisers</option>
                                {advisers.map(adviser => (
                                    <option key={adviser._id} value={adviser._id}>
                                        {adviser.profile?.firstName} {adviser.profile?.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setAdvancedFilters({
                                        stages: [],
                                        visaTypes: [],
                                        dateFrom: '',
                                        dateTo: '',
                                        adviserId: '',
                                    });
                                }}
                                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-brand-200 bg-brand-50/50 p-3 dark:border-brand-700/30 dark:bg-brand-500/10">
                    <span className="text-sm font-medium text-brand-700 dark:text-brand-400">
                        {selectedIds.size} application(s) selected
                    </span>
                    <div className="h-4 w-px bg-brand-200 dark:bg-brand-700/30" />
                    <button
                        onClick={() => setShowBulkStageModal(true)}
                        className="rounded-lg px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-100 dark:text-brand-400 dark:hover:bg-brand-500/20"
                    >
                        Update Stage
                    </button>
                    <button
                        onClick={() => setShowBulkAssignModal(true)}
                        className="rounded-lg px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-100 dark:text-brand-400 dark:hover:bg-brand-500/20"
                    >
                        Assign Adviser
                    </button>
                    <div className="flex justify-end">
                        <button
                            onClick={() => handleExport('csv')}  // Wrap in arrow function
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                        >
                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Export All to CSV
                        </button>
                    </div>
                    <button
                        onClick={clearSelection}
                        className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
                    >
                        Clear Selection
                    </button>
                </div>
            )}

            {/* Export Button */}
            <div className="flex justify-end">
                <button
                    onClick={() => handleExport('csv')}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                >
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export All to CSV
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
                    {error}
                    <button
                        type="button"
                        onClick={fetchApplications}
                        className="ml-3 font-medium underline hover:no-underline"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Applications Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left text-sm">
                        <thead>
                        <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03]">
                            <th className="w-8 px-4 py-3">
                                <input
                                    type="checkbox"
                                    checked={selectAll}
                                    onChange={toggleSelectAll}
                                    disabled={applications.length === 0}
                                    className="rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-700"
                                />
                            </th>
                            <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Client</th>
                            <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Visa Type</th>
                            <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Stage</th>
                            <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Adviser</th>
                            <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Created</th>
                            <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                                    <div className="inline-flex items-center gap-2">
                                        <span className="size-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                                        Loading applications…
                                    </div>
                                </td>
                            </tr>
                        ) : applications.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                                    No applications found.
                                </td>
                            </tr>
                        ) : (
                            applications.map((app) => {
                                const clientInfo = getClientDisplayInfo(app);
                                return (
                                    <tr
                                        key={app._id}
                                        className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 dark:border-gray-800/60 dark:hover:bg-white/[0.02] ${
                                            selectedIds.has(app._id) ? 'bg-brand-50/50 dark:bg-brand-500/5' : ''
                                        }`}
                                    >
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(app._id)}
                                                onChange={() => toggleSelect(app._id)}
                                                className="rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-700"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="font-medium text-gray-800 dark:text-white/90">
                                                    {clientInfo.name}
                                                </p>
                                                {clientInfo.email && (
                                                    <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                                                        {clientInfo.email}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                                <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-400">
                                                    {VISA_TYPE_LABELS[app.visaType] || app.visaType}
                                                </span>
                                        </td>
                                        <td className="px-4 py-3">
                                                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStageBadgeColor(app.stage)}`}>
                                                    {STAGE_LABELS[app.stage] || app.stage}
                                                </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                            {getAdviserDisplayInfo(app)}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                            {formatDate(app.createdAt)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleViewDetails(app)}
                                                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => handleStageUpdate(app)}
                                                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5"
                                                >
                                                    Stage
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedApplication(app);
                                                        setShowAssignModal(true);
                                                    }}
                                                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5"
                                                >
                                                    Assign
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && totalPages > 1 && (
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
                                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                            >
                                Previous
                            </button>
                            <button
                                type="button"
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => p + 1)}
                                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals - Same as before but with assignment modal */}
            {showDetailModal && selectedApplication && (
                <ApplicationDetailModal
                    application={selectedApplication}
                    onClose={() => {
                        setShowDetailModal(false);
                        setSelectedApplication(null);
                    }}
                    onUpdate={() => {
                        // Refresh the list after updates
                        fetchApplications();
                    }}
                />
            )}

            {showStageModal && selectedApplication && (
                <StageUpdateModal
                    application={selectedApplication}
                    currentStage={selectedApplication.stage}
                    newStage={newStage}
                    onStageChange={setNewStage}
                    notes={stageNotes}
                    onNotesChange={setStageNotes}
                    onClose={() => {
                        setShowStageModal(false);
                        setSelectedApplication(null);
                        setNewStage('');
                        setStageNotes('');
                    }}
                    onSubmit={handleSubmitStageUpdate}
                    loading={updatingStage}
                />
            )}

            {showAssignModal && selectedApplication && (
                <AssignAdviserModal
                    application={selectedApplication}
                    advisers={advisers}
                    selectedAdviserId={selectedAdviserId}
                    onAdviserChange={setSelectedAdviserId}
                    onClose={() => {
                        setShowAssignModal(false);
                        setSelectedApplication(null);
                        setSelectedAdviserId('');
                    }}
                    onSubmit={() => handleAssignAdviser(selectedApplication._id)}
                    loading={assigningAdviser}
                />
            )}

            {showBulkStageModal && (
                <BulkStageUpdateModal
                    count={selectedIds.size}
                    newStage={newStage}
                    onStageChange={setNewStage}
                    notes={stageNotes}
                    onNotesChange={setStageNotes}
                    onClose={() => {
                        setShowBulkStageModal(false);
                        setNewStage('');
                        setStageNotes('');
                    }}
                    onSubmit={handleBulkStageUpdate}
                    loading={updatingStage}
                />
            )}

            {showBulkAssignModal && (
                <BulkAssignAdviserModal
                    count={selectedIds.size}
                    advisers={advisers}
                    selectedAdviserId={selectedAdviserId}
                    onAdviserChange={setSelectedAdviserId}
                    onClose={() => {
                        setShowBulkAssignModal(false);
                        setSelectedAdviserId('');
                    }}
                    onSubmit={handleBulkAssignAdviser}
                    loading={assigningAdviser}
                />
            )}
        </div>
    );
}

// Bulk Stage Update Modal
function BulkStageUpdateModal({
                                  count,
                                  newStage,
                                  onStageChange,
                                  notes,
                                  onNotesChange,
                                  onClose,
                                  onSubmit,
                                  loading,
                              }: {
    count: number;
    newStage: ApplicationStage | '';
    onStageChange: (stage: ApplicationStage | '') => void;
    notes: string;
    onNotesChange: (notes: string) => void;
    onClose: () => void;
    onSubmit: () => void;
    loading: boolean;
}) {
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
                            Bulk Update Stage
                        </h2>
                        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                            Updating {count} application(s)
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
                            New Stage <span className="text-error-500">*</span>
                        </label>
                        <select
                            value={newStage}
                            onChange={(e) => onStageChange(e.target.value as ApplicationStage)}
                            className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                            required
                        >
                            <option value="">Select stage...</option>
                            {Object.entries(STAGE_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
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
                            disabled={!newStage || loading}
                            className="flex-1 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                        >
                            {loading ? 'Updating...' : 'Update All'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Bulk Assign Adviser Modal
function BulkAssignAdviserModal({
                                    count,
                                    advisers,
                                    selectedAdviserId,
                                    onAdviserChange,
                                    onClose,
                                    onSubmit,
                                    loading,
                                }: {
    count: number;
    advisers: User[];
    selectedAdviserId: string;
    onAdviserChange: (id: string) => void;
    onClose: () => void;
    onSubmit: () => void;
    loading: boolean;
}) {
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
                            Bulk Assign Adviser
                        </h2>
                        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                            Assigning adviser to {count} application(s)
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
                            {advisers.map(adviser => (
                                <option key={adviser._id} value={adviser._id}>
                                    {adviser.profile?.firstName} {adviser.profile?.lastName} ({adviser.email})
                                </option>
                            ))}
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
                            {loading ? 'Assigning...' : 'Assign All'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}