'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    authApi,
    clientApi,
    ApiError,
    clearAuth,
    getStoredUser,
    type User,
    type UserRole,
    type UserProfile,
} from '@/lib/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROLE_BADGE: Record<UserRole, string> = {
    admin:
        'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400',
    adviser:
        'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
    client:
        'bg-blue-light-50 text-blue-light-700 dark:bg-blue-light-500/15 dark:text-blue-light-400',
};

const ROLE_LABELS: Record<UserRole, string> = {
    admin: 'Administrator',
    adviser: 'Adviser',
    client: 'Client',
};

function formatDate(iso?: string): string {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    } catch {
        return '—';
    }
}

function getFullName(user: User): string {
    const p = user.profile;
    if (p?.firstName || p?.lastName) {
        return [p.firstName, p.lastName].filter(Boolean).join(' ');
    }
    return user.email?.split('@')[0] || 'User';
}

function initials(user: User): string {
    const name = getFullName(user);
    return name.charAt(0).toUpperCase();
}

/** Profile.address may be a string or a nested object depending on backend. */
function readAddressField(
    profile: UserProfile | undefined,
    key: 'street' | 'city' | 'state' | 'country' | 'postalCode'
): string {
    if (!profile) return '';
    const addr = profile.address;
    if (addr && typeof addr === 'object' && !Array.isArray(addr)) {
        const value = (addr as Record<string, unknown>)[key];
        return typeof value === 'string' ? value : '';
    }
    if (key === 'street' && typeof addr === 'string') return addr;
    return '';
}

function parseMeResponse(res: unknown): User | null {
    if (!res || typeof res !== 'object') return null;
    const obj = res as Record<string, unknown>;
    const candidate =
        (obj.user as User | undefined) ??
        (obj.data as User | undefined) ??
        (obj as unknown as User);
    if (candidate && typeof candidate === 'object' && 'email' in candidate) {
        return candidate as User;
    }
    return null;
}

type ProfileFormState = {
    firstName: string;
    lastName: string;
    phone: string;
    dateOfBirth: string;
    nationality: string;
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
};

function formFromUser(user: User): ProfileFormState {
    const profile = user.profile || {};
    const dob =
        typeof profile.dateOfBirth === 'string'
            ? profile.dateOfBirth.split('T')[0]
            : '';
    return {
        firstName: String(profile.firstName ?? ''),
        lastName: String(profile.lastName ?? ''),
        phone: String(profile.phone ?? ''),
        dateOfBirth: dob,
        nationality: String(profile.nationality ?? ''),
        street: readAddressField(profile, 'street'),
        city: readAddressField(profile, 'city'),
        state: readAddressField(profile, 'state'),
        country: readAddressField(profile, 'country'),
        postalCode: readAddressField(profile, 'postalCode'),
    };
}

const EMPTY_FORM: ProfileFormState = {
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    nationality: '',
    street: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
};

// ---------------------------------------------------------------------------
// Small UI pieces
// ---------------------------------------------------------------------------

function Field({
                   label,
                   name,
                   value,
                   onChange,
                   disabled,
                   type = 'text',
                   placeholder,
               }: {
    label: string;
    name: keyof ProfileFormState;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    disabled: boolean;
    type?: string;
    placeholder?: string;
}) {
    return (
        <div>
            <label className="mb-1.5 block text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                {label}
            </label>
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled}
                placeholder={placeholder}
                className={`w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90 ${
                    disabled ? 'cursor-not-allowed opacity-60' : ''
                }`}
            />
        </div>
    );
}

function Alert({
                   variant,
                   message,
                   onDismiss,
               }: {
    variant: 'success' | 'error';
    message: string;
    onDismiss: () => void;
}) {
    const styles =
        variant === 'success'
            ? 'border-success-200 bg-success-50 text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400'
            : 'border-error-200 bg-error-50 text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400';

    return (
        <div className={`rounded-lg border px-4 py-3 text-sm ${styles}`}>
            {message}
            <button
                type="button"
                onClick={onDismiss}
                className="ml-3 font-medium underline hover:no-underline"
            >
                Dismiss
            </button>
        </div>
    );
}

function ModalShell({
                        title,
                        description,
                        onClose,
                        children,
                        danger,
                    }: {
    title: string;
    description?: string;
    onClose: () => void;
    children: React.ReactNode;
    danger?: boolean;
}) {
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
                className={`relative z-10 w-full max-w-md rounded-xl border bg-white p-6 shadow-theme-xl dark:bg-gray-dark ${
                    danger
                        ? 'border-error-200 dark:border-error-500/30'
                        : 'border-gray-200 dark:border-gray-800'
                }`}
            >
                <div className="mb-5 flex items-start justify-between">
                    <div>
                        <h2
                            className={`text-lg font-semibold ${
                                danger
                                    ? 'text-error-700 dark:text-error-400'
                                    : 'text-gray-800 dark:text-white/90'
                            }`}
                        >
                            {title}
                        </h2>
                        {description && (
                            <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                                {description}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5"
                    >
                        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ProfileManagementPage() {
    const router = useRouter();

    const [user, setUser] = useState<User | null>(null);
    const [form, setForm] = useState<ProfileFormState>(EMPTY_FORM);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [passwordOpen, setPasswordOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [passwordBusy, setPasswordBusy] = useState(false);

    // ----- load current user via /auth/me -----
    const loadProfile = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await authApi.me();
            const me = parseMeResponse(res);
            if (!me) {
                throw new ApiError('Could not load current user', 401);
            }
            setUser(me);
            setForm(formFromUser(me));
        } catch (err) {
            const message =
                err instanceof ApiError ? err.message : 'Failed to load profile';
            setError(message);
            setUser(null);
            if (err instanceof ApiError && err.status === 401) {
                clearAuth();
                router.replace('/signin');
            }
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        // Soft guard: if nothing in storage, still try /me (cookie/token may exist)
        void getStoredUser();
        loadProfile();
    }, [loadProfile]);

    // ----- form handlers -----
    const onFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const cancelEdit = () => {
        if (user) setForm(formFromUser(user));
        setEditing(false);
        setError(null);
    };

    const saveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            await clientApi.updateProfile({
                profile: {
                    firstName: form.firstName.trim() || undefined,
                    lastName: form.lastName.trim() || undefined,
                    phone: form.phone.trim() || undefined,
                    dateOfBirth: form.dateOfBirth || undefined,
                    nationality: form.nationality.trim() || undefined,
                    address: {
                        street: form.street.trim() || undefined,
                        city: form.city.trim() || undefined,
                        state: form.state.trim() || undefined,
                        country: form.country.trim() || undefined,
                        postalCode: form.postalCode.trim() || undefined,
                    },
                },
            });
            setSuccess('Profile updated successfully.');
            setEditing(false);
            await loadProfile();
        } catch (err) {
            setError(
                err instanceof ApiError ? err.message : 'Failed to update profile'
            );
        } finally {
            setSaving(false);
        }
    };

    // ----- password (no public API in Swagger yet) -----
    const submitPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (passwordForm.newPassword.length < 8) {
            setError('New password must be at least 8 characters.');
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setError('New passwords do not match.');
            return;
        }

        setPasswordBusy(true);
        try {
            // When backend adds e.g. PATCH /auth/password, call it here:
            // await authApi.changePassword({
            //   currentPassword: passwordForm.currentPassword,
            //   newPassword: passwordForm.newPassword,
            // });
            setError(
                'Password change is not available yet. The API does not expose a change-password endpoint.'
            );
        } catch (err) {
            setError(
                err instanceof ApiError ? err.message : 'Failed to change password'
            );
        } finally {
            setPasswordBusy(false);
        }
    };

    const closePasswordModal = () => {
        setPasswordOpen(false);
        setPasswordForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        });
    };

    // ----- delete (no public API in Swagger yet) -----
    const confirmDelete = async () => {
        setSaving(true);
        setError(null);
        try {
            setError(
                'Account deletion is not available via the API yet. Contact support if you need to close your account.'
            );
        } finally {
            setSaving(false);
        }
    };

    // ----- render states -----
    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <span className="size-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                    Loading profile…
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="p-4 md:p-6">
                <Alert
                    variant="error"
                    message={error || 'Failed to load profile'}
                    onDismiss={() => setError(null)}
                />
                <button
                    type="button"
                    onClick={loadProfile}
                    className="mt-4 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
                >
                    Retry
                </button>
            </div>
        );
    }

    const isEmailVerified = Boolean(
        (user as User & { isEmailVerified?: boolean }).isEmailVerified
    );
    const isActive = user.isActive !== false;

    return (
        <div className="space-y-6 p-4 md:p-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">
                        Profile
                    </h1>
                    <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                        View and update your account details
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {!editing ? (
                        <button
                            type="button"
                            onClick={() => {
                                setEditing(true);
                                setSuccess(null);
                                setError(null);
                            }}
                            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
                        >
                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                            </svg>
                            Edit profile
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={cancelEdit}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => {
                            setPasswordOpen(true);
                            setError(null);
                            setSuccess(null);
                        }}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                    >
                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                            />
                        </svg>
                        Change password
                    </button>
                </div>
            </div>

            {success && (
                <Alert variant="success" message={success} onDismiss={() => setSuccess(null)} />
            )}
            {error && !passwordOpen && !deleteOpen && (
                <Alert variant="error" message={error} onDismiss={() => setError(null)} />
            )}

            {/* Main card */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
                <div className="p-6">
                    {/* Identity */}
                    <div className="flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-center sm:justify-between dark:border-gray-700">
                        <div className="flex items-center gap-4">
                            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-brand-50 text-2xl font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                                {initials(user)}
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                                    {getFullName(user)}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                                <span
                                    className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_BADGE[user.role] ?? ROLE_BADGE.client}`}
                                >
                  {ROLE_LABELS[user.role] ?? user.role}
                </span>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-1.5">
                <span
                    className={`size-2 rounded-full ${isActive ? 'bg-success-500' : 'bg-error-500'}`}
                />
                  {isActive ? 'Active' : 'Inactive'}
              </span>
                            <span className="hidden h-4 w-px bg-gray-300 sm:block dark:bg-gray-700" />
                            <span>Joined {formatDate(user.createdAt)}</span>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={saveProfile} className="mt-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                                    Personal information
                                </h3>
                            </div>

                            <Field
                                label="First name"
                                name="firstName"
                                value={form.firstName}
                                onChange={onFieldChange}
                                disabled={!editing}
                            />
                            <Field
                                label="Last name"
                                name="lastName"
                                value={form.lastName}
                                onChange={onFieldChange}
                                disabled={!editing}
                            />
                            <Field
                                label="Phone"
                                name="phone"
                                type="tel"
                                value={form.phone}
                                onChange={onFieldChange}
                                disabled={!editing}
                            />
                            <Field
                                label="Date of birth"
                                name="dateOfBirth"
                                type="date"
                                value={form.dateOfBirth}
                                onChange={onFieldChange}
                                disabled={!editing}
                            />
                            <Field
                                label="Nationality"
                                name="nationality"
                                value={form.nationality}
                                onChange={onFieldChange}
                                disabled={!editing}
                            />

                            <div className="md:col-span-2 mt-2">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                                    Address
                                </h3>
                            </div>

                            <div className="md:col-span-2">
                                <Field
                                    label="Street address"
                                    name="street"
                                    value={form.street}
                                    onChange={onFieldChange}
                                    disabled={!editing}
                                />
                            </div>
                            <Field
                                label="City"
                                name="city"
                                value={form.city}
                                onChange={onFieldChange}
                                disabled={!editing}
                            />
                            <Field
                                label="State / province"
                                name="state"
                                value={form.state}
                                onChange={onFieldChange}
                                disabled={!editing}
                            />
                            <Field
                                label="Country"
                                name="country"
                                value={form.country}
                                onChange={onFieldChange}
                                disabled={!editing}
                            />
                            <Field
                                label="Postal code"
                                name="postalCode"
                                value={form.postalCode}
                                onChange={onFieldChange}
                                disabled={!editing}
                            />
                        </div>

                        {editing && (
                            <div className="mt-6 flex gap-3 border-t border-gray-200 pt-6 dark:border-gray-700">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                                >
                                    {saving ? 'Saving…' : 'Save changes'}
                                </button>
                                <button
                                    type="button"
                                    onClick={cancelEdit}
                                    disabled={saving}
                                    className="rounded-lg border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Role" value={ROLE_LABELS[user.role] ?? user.role} />
                <StatCard
                    label="Status"
                    value={isActive ? 'Active' : 'Inactive'}
                    valueClass={
                        isActive
                            ? 'text-success-600 dark:text-success-400'
                            : 'text-error-600 dark:text-error-400'
                    }
                />
                <StatCard label="Joined" value={formatDate(user.createdAt)} />
                <StatCard
                    label="Email"
                    value={isEmailVerified ? 'Verified' : 'Pending'}
                    valueClass={
                        isEmailVerified
                            ? 'text-success-600 dark:text-success-400'
                            : 'text-warning-600 dark:text-warning-400'
                    }
                />
            </div>

            {/* Danger zone */}
            <div className="rounded-xl border border-error-200 bg-error-50/50 p-6 dark:border-error-500/30 dark:bg-error-500/10">
                <h3 className="text-sm font-semibold text-error-700 dark:text-error-400">
                    Danger zone
                </h3>
                <p className="mt-1 text-sm text-error-600 dark:text-error-300">
                    Permanently delete your account and associated data. This cannot be undone.
                </p>
                <button
                    type="button"
                    onClick={() => {
                        setDeleteOpen(true);
                        setError(null);
                        setSuccess(null);
                    }}
                    className="mt-4 rounded-lg bg-error-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-error-600"
                >
                    Delete account
                </button>
            </div>

            {/* Change password modal */}
            {passwordOpen && (
                <ModalShell
                    title="Change password"
                    description="Enter your current password and choose a new one."
                    onClose={closePasswordModal}
                >
                    <form onSubmit={submitPassword} className="space-y-4">
                        {error && passwordOpen && (
                            <div className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
                                {error}
                            </div>
                        )}
                        <div>
                            <label className="mb-1.5 block text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                                Current password <span className="text-error-500">*</span>
                            </label>
                            <input
                                type="password"
                                required
                                autoComplete="current-password"
                                value={passwordForm.currentPassword}
                                onChange={(e) =>
                                    setPasswordForm((p) => ({
                                        ...p,
                                        currentPassword: e.target.value,
                                    }))
                                }
                                className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                                New password <span className="text-error-500">*</span>
                            </label>
                            <input
                                type="password"
                                required
                                minLength={8}
                                autoComplete="new-password"
                                value={passwordForm.newPassword}
                                onChange={(e) =>
                                    setPasswordForm((p) => ({
                                        ...p,
                                        newPassword: e.target.value,
                                    }))
                                }
                                className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                At least 8 characters
                            </p>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                                Confirm new password <span className="text-error-500">*</span>
                            </label>
                            <input
                                type="password"
                                required
                                autoComplete="new-password"
                                value={passwordForm.confirmPassword}
                                onChange={(e) =>
                                    setPasswordForm((p) => ({
                                        ...p,
                                        confirmPassword: e.target.value,
                                    }))
                                }
                                className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={closePasswordModal}
                                disabled={passwordBusy}
                                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={passwordBusy}
                                className="flex-1 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                            >
                                {passwordBusy ? 'Saving…' : 'Update password'}
                            </button>
                        </div>
                    </form>
                </ModalShell>
            )}

            {/* Delete account modal */}
            {deleteOpen && (
                <ModalShell
                    title="Delete account"
                    description="This action cannot be undone."
                    danger
                    onClose={() => setDeleteOpen(false)}
                >
                    <div className="space-y-4">
                        {error && deleteOpen && (
                            <div className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
                                {error}
                            </div>
                        )}
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Deleting your account may remove profile data, applications, documents,
                            consultations, and payment history.
                        </p>
                        <p className="text-sm font-medium text-error-600 dark:text-error-400">
                            This is irreversible.
                        </p>
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setDeleteOpen(false)}
                                disabled={saving}
                                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDelete}
                                disabled={saving}
                                className="flex-1 rounded-lg bg-error-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-error-600 disabled:opacity-50"
                            >
                                {saving ? 'Working…' : 'Delete account'}
                            </button>
                        </div>
                    </div>
                </ModalShell>
            )}
        </div>
    );
}

function StatCard({
                      label,
                      value,
                      valueClass,
                  }: {
    label: string;
    value: string;
    valueClass?: string;
}) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            <p
                className={`text-lg font-semibold text-gray-800 dark:text-white/90 ${valueClass ?? ''}`}
            >
                {value}
            </p>
        </div>
    );
}