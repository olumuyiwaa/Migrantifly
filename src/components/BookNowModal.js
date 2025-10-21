import React, { useState, useEffect } from "react";
import { AlertCircle, Clock, CheckCircle, Loader } from "lucide-react";

export default function BookNowModal({ show, onClose }) {
  if (!show) return null;

  const [step, setStep] = useState(1); // 1: Info, 2: Slot Selection, 3: Review, 4: Payment
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    preferredDate: "",
    preferredTime: "",
    method: "zoom",
    message: "",
  });

  const [availableSlots, setAvailableSlots] = useState([]);
  const [consultationData, setConsultationData] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);

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

  // Fetch available slots when date changes
  useEffect(() => {
    if (formData.preferredDate) {
      fetchAvailableSlots(formData.preferredDate);
    }
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

      setAvailableSlots(data.data.availableSlots);
      setFormData((prev) => ({ ...prev, preferredTime: "" }));
    } catch (err) {
      setError(err.message);
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
      if (validateStep1()) {
        setStep(2);
      }
    } else if (step === 2) {
      if (validateStep2()) {
        setStep(3);
      }
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

      if (!res.ok) {
        throw new Error(data.message || "Booking failed");
      }

      setConsultationData(data.data);
      setStep(4);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Call backend to create Stripe payment intent
      const res = await fetch(`${API_BASE}/payment/create-consultation-payment`, {
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

      if (!res.ok) {
        throw new Error(data.message || "Failed to initialize payment");
      }

      // Initialize Stripe and show payment modal
      const stripe = window.Stripe("pk_test_51SKZtKD3g7MoYNaI33fLyF5m4heLMOFHfNgFaIUtNR8vvc0vDn2oijlblz1v5b4QpkCTX97nYOV26cFLWa7cpcsR004RA7L2WA"); // to later be Set this in env
      const { error } = await stripe.redirectToCheckout({
        sessionId: data.data.sessionId,
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (err) {
      setError(err.message || "Payment initialization failed");
      setLoading(false);
    }
  };

  const confirmBookingAfterPayment = async (consultationId, email) => {
    try {
      const res = await fetch(`${API_BASE}/consultation/${consultationId}/confirm-booking`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to confirm booking");
      }

      return data.data;
    } catch (err) {
      console.error("Error confirming booking:", err);
      throw err;
    }
  };

  const resetModal = () => {
    setStep(1);
    setFormData({
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      preferredDate: "",
      preferredTime: "",
      method: "zoom",
      message: "",
    });
    setError("");
    setSuccess("");
    setConsultationData(null);
    onClose();
  };

  const formatDate = (dateStr) => {
    return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      timeZone: "UTC"
    });
  };

  const getMethodLabel = (value) => {
    const method = methods.find((m) => m.value === value);
    return method ? method.label : value;
  };

  const getTodayMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-white/10 p-6 flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-white">Book a Consultation</h2>
              <p className="text-blue-200 text-sm mt-1">Step {step} of 4</p>
            </div>
            <button
                onClick={resetModal}
                className="text-gray-400 hover:text-white text-2xl font-bold transition"
            >
              ×
            </button>
          </div>

          {/* Progress Bar */}
          <div className="h-1 bg-slate-700">
            <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>

          {/* Content */}
          <div className="p-8">
            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-200">{error}</p>
                </div>
            )}

            {success && (
                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-green-200">{success}</p>
                </div>
            )}

            {/* Step 1: Personal Info */}
            {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-white font-semibold mb-2">Full Name *</label>
                    <input
                        type="text"
                        name="clientName"
                        placeholder="John Doe"
                        value={formData.clientName}
                        onChange={onInputChange}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-semibold mb-2">Email Address *</label>
                      <input
                          type="email"
                          name="clientEmail"
                          placeholder="you@example.com"
                          value={formData.clientEmail}
                          onChange={onInputChange}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-semibold mb-2">Phone Number *</label>
                      <input
                          type="tel"
                          name="clientPhone"
                          placeholder="+1 (555) 123-4567"
                          value={formData.clientPhone}
                          onChange={onInputChange}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-2">Consultation Method *</label>
                    <div className="grid grid-cols-2 gap-3">
                      {methods.map((m) => (
                          <button
                              key={m.value}
                              onClick={() => {
                                setFormData((prev) => ({ ...prev, method: m.value }));
                                setError("");
                              }}
                              className={`p-3 rounded-lg border-2 transition ${
                                  formData.method === m.value
                                      ? "border-blue-500 bg-blue-500/20 text-white"
                                      : "border-white/20 bg-white/5 text-gray-300 hover:border-white/40"
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

            {/* Step 2: Date & Time Selection */}
            {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-white font-semibold mb-2">Preferred Date *</label>
                    <input
                        type="date"
                        name="preferredDate"
                        min={getTodayMinDate()}
                        value={formData.preferredDate}
                        onChange={onInputChange}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>

                  {formData.preferredDate && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-white font-semibold">Available Times *</label>
                          {slotsLoading && <Loader className="w-4 h-4 animate-spin text-blue-400" />}
                        </div>

                        {availableSlots.length > 0 ? (
                            <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                              {availableSlots.map((hour) => (
                                  <button
                                      key={hour}
                                      onClick={() => {
                                        setFormData((prev) => ({
                                          ...prev,
                                          preferredTime: `${String(hour).padStart(2, "0")}:00`,
                                        }));
                                        setError("");
                                      }}
                                      className={`p-3 rounded-lg border-2 transition font-semibold ${
                                          formData.preferredTime === `${String(hour).padStart(2, "0")}:00`
                                              ? "border-blue-500 bg-blue-500/20 text-white"
                                              : "border-white/20 bg-white/5 text-gray-300 hover:border-white/40"
                                      }`}
                                  >
                                    {String(hour).padStart(2, "0")}:00
                                  </button>
                              ))}
                            </div>
                        ) : (
                            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-200 text-sm">
                              No available slots for this date. Please select another date.
                            </div>
                        )}
                      </div>
                  )}

                  <div>
                    <label className="block text-white font-semibold mb-2">Additional Message</label>
                    <textarea
                        name="message"
                        placeholder="Tell us about your migration goals and any specific questions..."
                        rows="4"
                        value={formData.message}
                        onChange={onInputChange}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                    />
                  </div>
                </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
                <div className="space-y-6">
                  <div className="bg-white/5 border border-white/20 rounded-lg p-6 space-y-4">
                    <h3 className="text-white font-semibold text-lg">Booking Summary</h3>

                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400 mb-1">Name</p>
                        <p className="text-white font-medium">{formData.clientName}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-1">Email</p>
                        <p className="text-white font-medium">{formData.clientEmail}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-1">Phone</p>
                        <p className="text-white font-medium">{formData.clientPhone}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-1">Method</p>
                        <p className="text-white font-medium">{getMethodLabel(formData.method)}</p>
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-4">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-blue-400" />
                        <div>
                          <p className="text-gray-400 text-sm">Scheduled for</p>
                          <p className="text-white font-semibold">
                            {formatDate(formData.preferredDate)} at {formData.preferredTime}
                          </p>
                        </div>
                      </div>
                    </div>

                    {formData.message && (
                        <div className="border-t border-white/10 pt-4">
                          <p className="text-gray-400 text-sm mb-2">Message</p>
                          <p className="text-gray-200 text-sm italic">{formData.message}</p>
                        </div>
                    )}
                  </div>

                  <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg p-6">
                    <h3 className="text-white font-semibold mb-3">Consultation Fee</h3>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-gray-300">Service Fee</p>
                      <p className="text-white font-semibold">${CONSULTATION_FEE.toFixed(2)}</p>
                    </div>
                    <div className="border-t border-white/10 pt-3 mt-3 flex justify-between items-center">
                      <p className="text-white font-semibold">Total</p>
                      <p className="text-2xl font-bold text-blue-300">${CONSULTATION_FEE.toFixed(2)}</p>
                    </div>
                  </div>

                  <p className="text-gray-400 text-xs">
                    By proceeding, you agree to pay the consultation fee. You will receive a confirmation email with meeting details.
                  </p>
                </div>
            )}

            {/* Step 4: Payment Confirmation */}
            {step === 4 && consultationData && (
                <div className="space-y-6 text-center">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-green-500/20 border-2 border-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Slot Reserved!</h3>
                    <p className="text-gray-300">
                      Your consultation slot has been reserved. Complete payment to confirm your booking.
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/20 rounded-lg p-6 text-left">
                    <h4 className="text-white font-semibold mb-4">Booking Details</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Consultation ID</span>
                        <span className="text-white font-medium">{consultationData.consultationId.slice(-8)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status</span>
                        <span className="text-yellow-400 font-medium">Pending Payment</span>
                      </div>
                      <div className="flex justify-between border-t border-white/10 pt-3">
                        <span className="text-white font-semibold">Amount Due</span>
                        <span className="text-blue-300 font-bold">${CONSULTATION_FEE.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-slate-900/50 border-t border-white/10 p-6 flex gap-4">
            {step > 1 && step < 4 && (
                <button
                    onClick={() => setStep(step - 1)}
                    className="flex-1 px-6 py-3 border-2 border-white/20 text-white rounded-lg font-semibold hover:bg-white/10 transition"
                >
                  Back
                </button>
            )}

            {step < 4 && (
                <button
                    onClick={handleNextStep}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading && <Loader className="w-4 h-4 animate-spin" />}
                  {step === 3 ? "Book Consultation" : "Next"}
                </button>
            )}

            {step === 4 && (
                <>
                  <button
                      onClick={resetModal}
                      className="flex-1 px-6 py-3 border-2 border-white/20 text-white rounded-lg font-semibold hover:bg-white/10 transition"
                  >
                    Close
                  </button>
                  <button
                      onClick={handlePayment}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-green-500/50 transition"
                  >
                    Proceed to Payment
                  </button>
                </>
            )}
          </div>
        </div>
      </div>
  );
}