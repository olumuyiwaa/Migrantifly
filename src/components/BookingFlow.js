"use client";
import React, { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { CheckCircleIcon, TimeIcon } from "@/icons";
// If you have an AlertCircle icon, use it, otherwise use a different icon
// import { AlertCircleIcon } from "@/icons"; // Uncomment if available

// Custom AlertCircle icon as inline SVG if not available in your icons
const AlertCircleIcon = ({ className = "w-5 h-5" }) => (
    <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
    </svg>
);

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY||"pk_test_51SKZtKD3g7MoYNaI33fLyF5m4heLMOFHfNgFaIUtNR8vvc0vDn2oijlblz1v5b4QpkCTX97nYOV26cFLWa7cpcsR004RA7L2WA");

export default function BookingFlow({ initialData = {}, onClose }) {
    const [step, setStep] = useState(1); // 1: Info, 2: Slot Selection, 3: Review, 4: Payment
    const [loading, setLoading] = useState(false);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [availableSlots, setAvailableSlots] = useState([]);
    const [consultationData, setConsultationData] = useState(null);

    const [formData, setFormData] = useState({
        clientName: initialData.clientName || "",
        clientEmail: initialData.clientEmail || "",
        clientPhone: initialData.clientPhone || "",
        preferredDate: "",
        preferredTime: "",
        method: "zoom",
        message: initialData.message || "",
    });

    const methods = [
        { value: "zoom", label: "Zoom (Online)", icon: "🎥" },
        { value: "phone", label: "Phone Call", icon: "☎️" },
        { value: "in-person", label: "In-Person", icon: "👤" },
        { value: "google-meet", label: "Google Meet", icon: "📹" },
    ];

    const CONSULTATION_FEE = 50;
    const API_BASE = "https://migrantifly-backend.onrender.com/api";

    const onInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError("");
    };

    useEffect(() => {
        if (formData.preferredDate) {
            fetchAvailableSlots(formData.preferredDate);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.preferredDate]);

    const fetchAvailableSlots = async (date) => {
        setSlotsLoading(true);
        setError("");
        try {
            const res = await fetch(`${API_BASE}/consultation/available-slots?date=${date}`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to fetch slots");
            }

            setAvailableSlots(data.data.availableSlots || []);
            setFormData((prev) => ({ ...prev, preferredTime: "" }));
        } catch (err) {
            setError(err.message || "Failed to fetch slots");
            setAvailableSlots([]);
        } finally {
            setSlotsLoading(false);
        }
    };

    const validateStep1 = () => {
        if (!formData.clientName.trim()) {
            setError("Full name is required");
            return false;
        }
        if (!formData.clientEmail.trim()) {
            setError("Email is required");
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail)) {
            setError("Please enter a valid email");
            return false;
        }
        if (!formData.clientPhone.trim()) {
            setError("Phone number is required");
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        if (!formData.preferredDate) {
            setError("Please select a date");
            return false;
        }
        if (!formData.preferredTime) {
            setError("Please select a time");
            return false;
        }
        if (!formData.method) {
            setError("Please select a consultation method");
            return false;
        }
        return true;
    };

    const handleNextStep = async () => {
        setError("");
        if (step === 1) {
            if (validateStep1()) setStep(2);
        } else if (step === 2) {
            if (validateStep2()) setStep(3);
        } else if (step === 3) {
            await handleBooking();
        }
    };

    const handleBooking = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`${API_BASE}/consultation/book`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    clientName: formData.clientName,
                    clientEmail: formData.clientEmail,
                    clientPhone: formData.clientPhone,
                    preferredDate: formData.preferredDate,
                    preferredTime: formData.preferredTime,
                    method: formData.method,
                    message: formData.message,
                }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || "Booking failed");

            setConsultationData(data.data);
            setStep(4);
        } catch (err) {
            setError(err.message || "Booking failed");
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        setLoading(true);
        setError("");

        try {
            const res = await fetch(`${API_BASE}/payments/create-consultation-payment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    consultationId: consultationData.consultationId,
                    paymentId: consultationData.paymentId,
                    amount: CONSULTATION_FEE,
                    email: formData.clientEmail,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to initialize payment");

            const stripe = await stripePromise;
            if (!stripe) throw new Error("Stripe failed to initialize. Please try again.");

            const checkoutUrl =
                data?.data?.checkoutUrl || data?.data?.url || data?.data?.sessionUrl;

            if (!checkoutUrl) throw new Error("Checkout URL was not returned by the server.");

            window.location.assign(checkoutUrl);
        } catch (err) {
            setError(err.message || "Payment initialization failed");
            setLoading(false);
        }
    };

    const resetFlow = () => {
        setStep(1);
        setFormData({
            clientName: initialData.clientName || "",
            clientEmail: initialData.clientEmail || "",
            clientPhone: initialData.clientPhone || "",
            preferredDate: "",
            preferredTime: "",
            method: "zoom",
            message: initialData.message || "",
        });
        setError("");
        setSuccess("");
        setConsultationData(null);
        if (onClose) onClose();
    };

    const formatDate = (dateStr) =>
        new Date(`${dateStr}T00:00:00Z`).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            timeZone: "UTC",
        });

    const getMethodLabel = (value) => methods.find((m) => m.value === value)?.label || value;

    const getTodayMinDate = () => {
        const today = new Date();
        return today.toISOString().split("T")[0];
    };

    const LoadingSpinner = () => (
        <span className="size-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
    );

    return (
        <div className="bg-white dark:bg-gray-dark rounded-2xl border border-gray-200 dark:border-gray-800 w-full shadow-theme-lg overflow-hidden">
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-gray-800 p-6 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
                        Book a Consultation
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        Step {step} of 4
                    </p>
                </div>
                <button
                    onClick={resetFlow}
                    className="text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300 text-xl font-bold transition"
                    aria-label="Close booking"
                >
                    ×
                </button>
            </div>

            {/* Progress */}
            <div className="h-1 bg-gray-200 dark:bg-gray-700">
                <div
                    className="h-full bg-brand-500 transition-all duration-300"
                    style={{ width: `${(step / 4) * 100}%` }}
                />
            </div>

            {/* Body */}
            <div className="p-6 md:p-8">
                {error && (
                    <div className="mb-6 p-4 bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/30 rounded-lg flex items-start gap-3">
                        <AlertCircleIcon className="w-5 h-5 text-error-500 dark:text-error-400 flex-shrink-0 mt-0.5" />
                        <p className="text-error-700 dark:text-error-400">{error}</p>
                    </div>
                )}

                {success && (
                    <div className="mb-6 p-4 bg-success-50 dark:bg-success-500/10 border border-success-200 dark:border-success-500/30 rounded-lg flex items-start gap-3">
                        <CheckCircleIcon className="w-5 h-5 text-success-500 dark:text-success-400 flex-shrink-0 mt-0.5" />
                        <p className="text-success-700 dark:text-success-400">{success}</p>
                    </div>
                )}

                {/* Step 1 - Personal Information */}
                {step === 1 && (
                    <div className="space-y-5">
                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                name="clientName"
                                placeholder="John Doe"
                                value={formData.clientName}
                                onChange={onInputChange}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                                    Email Address *
                                </label>
                                <input
                                    type="email"
                                    name="clientEmail"
                                    placeholder="you@example.com"
                                    value={formData.clientEmail}
                                    onChange={onInputChange}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                                    Phone Number *
                                </label>
                                <input
                                    type="tel"
                                    name="clientPhone"
                                    placeholder="+1 (555) 123-4567"
                                    value={formData.clientPhone}
                                    onChange={onInputChange}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                                Consultation Method *
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {methods.map((m) => (
                                    <button
                                        key={m.value}
                                        type="button"
                                        onClick={() => {
                                            setFormData((prev) => ({ ...prev, method: m.value }));
                                            setError("");
                                        }}
                                        className={`p-3 rounded-lg border-2 transition ${
                                            formData.method === m.value
                                                ? "border-brand-500 bg-brand-50 dark:bg-brand-500/20 text-brand-700 dark:text-brand-400"
                                                : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                                        }`}
                                    >
                                        <div className="text-xl mb-1">{m.icon}</div>
                                        <div className="text-sm font-medium">{m.label}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2 - Date & Time Selection */}
                {step === 2 && (
                    <div className="space-y-5">
                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                                Preferred Date *
                            </label>
                            <input
                                type="date"
                                name="preferredDate"
                                min={getTodayMinDate()}
                                value={formData.preferredDate}
                                onChange={onInputChange}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                            />
                        </div>

                        {formData.preferredDate && (
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-gray-700 dark:text-gray-300 font-semibold">
                                        Available Times *
                                    </label>
                                    {slotsLoading && (
                                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                                            <LoadingSpinner />
                                            Loading times...
                                        </div>
                                    )}
                                </div>

                                {availableSlots.length > 0 ? (
                                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto custom-scrollbar">
                                        {availableSlots.map((hour) => {
                                            const timeLabel = `${String(hour).padStart(2, "0")}:00`;
                                            return (
                                                <button
                                                    key={hour}
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData((prev) => ({ ...prev, preferredTime: timeLabel }));
                                                        setError("");
                                                    }}
                                                    className={`p-3 rounded-lg border-2 transition font-semibold ${
                                                        formData.preferredTime === timeLabel
                                                            ? "border-brand-500 bg-brand-50 dark:bg-brand-500/20 text-brand-700 dark:text-brand-400"
                                                            : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                                                    }`}
                                                >
                                                    {timeLabel}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="p-4 bg-warning-50 dark:bg-warning-500/10 border border-warning-200 dark:border-warning-500/30 rounded-lg text-warning-700 dark:text-warning-400 text-sm">
                                        No available slots for this date. Please select another date.
                                    </div>
                                )}
                            </div>
                        )}

                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                                Additional Message
                            </label>
                            <textarea
                                name="message"
                                placeholder="Tell us about your migration goals and any specific questions..."
                                rows="4"
                                value={formData.message}
                                onChange={onInputChange}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition resize-none"
                            />
                        </div>
                    </div>
                )}

                {/* Step 3 - Review */}
                {step === 3 && (
                    <div className="space-y-6">
                        <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
                            <h3 className="text-gray-800 dark:text-white/90 font-semibold text-lg">
                                Booking Summary
                            </h3>

                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400 mb-1">Name</p>
                                    <p className="text-gray-800 dark:text-white font-medium">{formData.clientName}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400 mb-1">Email</p>
                                    <p className="text-gray-800 dark:text-white font-medium">{formData.clientEmail}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400 mb-1">Phone</p>
                                    <p className="text-gray-800 dark:text-white font-medium">{formData.clientPhone}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400 mb-1">Method</p>
                                    <p className="text-gray-800 dark:text-white font-medium">{getMethodLabel(formData.method)}</p>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                <div className="flex items-center gap-3">
                                    <TimeIcon className="w-5 h-5 text-brand-500 dark:text-brand-400" />
                                    <div>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm">Scheduled for</p>
                                        <p className="text-gray-800 dark:text-white font-semibold">
                                            {formatDate(formData.preferredDate)} at {formData.preferredTime}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {!!formData.message && (
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">Message</p>
                                    <p className="text-gray-700 dark:text-gray-300 text-sm italic">{formData.message}</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/30 rounded-lg p-6">
                            <h3 className="text-gray-800 dark:text-white/90 font-semibold mb-3">
                                Consultation Fee
                            </h3>
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-gray-600 dark:text-gray-400">Service Fee</p>
                                <p className="text-gray-800 dark:text-white font-semibold">${CONSULTATION_FEE.toFixed(2)}</p>
                            </div>
                            <div className="border-t border-brand-200 dark:border-brand-500/20 pt-3 mt-3 flex justify-between items-center">
                                <p className="text-gray-800 dark:text-white font-semibold">Total</p>
                                <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">${CONSULTATION_FEE.toFixed(2)}</p>
                            </div>
                        </div>

                        <p className="text-gray-500 dark:text-gray-400 text-xs">
                            By proceeding, you agree to pay the consultation fee. You will receive a confirmation email with meeting details.
                        </p>
                    </div>
                )}

                {/* Step 4 - Success */}
                {step === 4 && consultationData && (
                    <div className="space-y-6 text-center">
                        <div className="flex justify-center">
                            <div className="w-16 h-16 bg-success-50 dark:bg-success-500/20 border-2 border-success-500 rounded-full flex items-center justify-center">
                                <CheckCircleIcon className="w-8 h-8 text-success-500 dark:text-success-400" />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white/90 mb-2">
                                Slot Reserved!
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Your consultation slot has been reserved. Complete payment to confirm your booking.
                            </p>
                        </div>

                        <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-left">
                            <h4 className="text-gray-800 dark:text-white/90 font-semibold mb-4">
                                Booking Details
                            </h4>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Consultation ID</span>
                                    <span className="text-gray-800 dark:text-white font-medium">
                                        {consultationData.consultationId?.slice(-8)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Status</span>
                                    <span className="text-warning-500 dark:text-warning-400 font-medium">
                                        Pending Payment
                                    </span>
                                </div>
                                <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-3">
                                    <span className="text-gray-800 dark:text-white font-semibold">Amount Due</span>
                                    <span className="text-brand-600 dark:text-brand-400 font-bold">
                                        ${CONSULTATION_FEE.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-800 p-6 flex gap-4">
                {step > 1 && step < 4 && (
                    <button
                        type="button"
                        onClick={() => setStep(step - 1)}
                        className="flex-1 px-6 py-3 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition"
                    >
                        Back
                    </button>
                )}

                {step < 4 && (
                    <button
                        type="button"
                        onClick={handleNextStep}
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-brand-500 text-white rounded-lg font-semibold hover:bg-brand-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <LoadingSpinner />
                                {step === 3 ? "Booking..." : "Loading..."}
                            </>
                        ) : (
                            step === 3 ? "Book Consultation" : "Next"
                        )}
                    </button>
                )}

                {step === 4 && (
                    <>
                        <button
                            type="button"
                            onClick={resetFlow}
                            className="flex-1 px-6 py-3 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition"
                        >
                            Close
                        </button>
                        <button
                            type="button"
                            onClick={handlePayment}
                            className="flex-1 px-6 py-3 bg-success-500 text-white rounded-lg font-semibold hover:bg-success-600 transition"
                        >
                            Proceed to Payment
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}