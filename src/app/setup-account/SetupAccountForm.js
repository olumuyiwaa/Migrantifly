'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function SetupAccountForm({ token }) {
    const router = useRouter();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const hasToken = Boolean(token);

    const validate = () => {
        if (!hasToken) return 'Invalid or missing setup link.';
        if (!firstName.trim()) return 'First name is required.';
        if (!lastName.trim()) return 'Last name is required.';
        if (!password || password.trim().length < 8)
            return 'Password must be at least 8 characters.';
        if (password !== confirmPassword)
            return 'Passwords do not match.';
        return '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

        setError('');
        setSuccess('');

        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);

        try {
            const payload = {
                token: token?.trim(),
                password: password.trim(),
                profile: {
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                },
            };

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/setup-account`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            let data = {};
            try {
                data = await res.json();
            } catch {
                data = {};
            }

            if (!res.ok) {
                const message =
                    data?.message ||
                    (Array.isArray(data?.errors)
                        ? data.errors.map((e) => e.msg).join(', ')
                        : '') ||
                    'Could not complete account setup.';
                setError(message);
                return;
            }

            setSuccess('✅ Account setup completed! Redirecting...');
            setTimeout(() => {
                router.replace('/portal');
            }, 1500);
        } catch (err) {
            setError('A network error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!hasToken) {
        return (
            <div className="bg-white shadow rounded-lg p-6">
                <h1 className="text-xl font-semibold mb-2">Invalid link</h1>
                <p className="text-sm text-gray-600">
                    The setup link is missing or invalid. Please request a new setup email.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white shadow rounded-lg p-6 max-w-md mx-auto">
            <h1 className="text-2xl font-semibold mb-1">Complete your account</h1>
            <p className="text-sm text-gray-600 mb-6">
                Set your password and finish your profile to get started.
            </p>

            {error && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm animate-fadeIn">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-4 rounded-md border border-green-200 bg-green-50 text-green-700 px-3 py-2 text-sm animate-fadeIn">
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">First name</label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className={`mt-1 block w-full rounded-md border ${
                                error && !firstName.trim()
                                    ? 'border-red-400'
                                    : 'border-gray-300'
                            } px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:bg-primary-900`}
                            placeholder="First name"
                            autoComplete="given-name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Last name</label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className={`mt-1 block w-full rounded-md border ${
                                error && !lastName.trim()
                                    ? 'border-red-400'
                                    : 'border-gray-300'
                            } px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:bg-primary-900`}
                            placeholder="Last name"
                            autoComplete="family-name"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <div className="mt-1 relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`block w-full rounded-md border ${
                                error && password.trim().length < 8
                                    ? 'border-red-400'
                                    : 'border-gray-300'
                            } px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:bg-primary-900`}
                            placeholder="At least 8 characters"
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((s) => !s)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Confirm password</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`mt-1 block w-full rounded-md border ${
                            error && password !== confirmPassword
                                ? 'border-red-400'
                                : 'border-gray-300'
                        } px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:bg-primary-900`}
                        autoComplete="new-password"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center rounded-md bg-primary-900 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:bg-primary-900 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin mr-2" size={16} />
                            Completing…
                        </>
                    ) : (
                        'Complete setup'
                    )}
                </button>
            </form>
        </div>
    );
}
