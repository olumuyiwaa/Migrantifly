import React, { useState } from "react";

export default function BookNowModal({ show, onClose }) {
  if (!show) return null;

  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    preferredDate: "",
    preferredTime: "",
    method: "",
    message: "",
  });

  const methods = ["zoom", "phone", "in-person", "google-meet"];

  const onInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("https://migrantifly-backend.onrender.com/api/consultation/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Booking failed");
      const data = await res.json();
      alert("Consultation booked successfully!");
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error booking consultation");
    }
  };

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-black/60 backdrop-blur-sm border border-white/20 rounded-2xl p-8 max-w-4xl w-full m-4 relative text-white">
          {/* Close Button */}
          <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white text-xl font-bold"
          >
            &times;
          </button>

          <h2 className="text-4xl font-bold mb-2">Book a Consultation</h2>
          <p className="text-blue-100 text-lg mb-4">
            Select your consultation type and preferred time.
          </p>

          <form
              onSubmit={onSubmit}
              className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl space-y-6"
          >
            {/* Name, Phone */}
            <div className="grid md:grid-cols-2 gap-4">
              <input
                  type="text"
                  name="clientName"
                  placeholder="Full Name"
                  value={formData.clientName}
                  onChange={onInputChange}
                  className="px-4 py-3 bg-white/90 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-400"
                  required
              />
              <input
                  type="tel"
                  name="clientPhone"
                  placeholder="Phone Number"
                  value={formData.clientPhone}
                  onChange={onInputChange}
                  className="px-4 py-3 bg-white/90 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-400"
                  required
              />
            </div>

            {/* Email & Visa Type */}
            <div className="grid md:grid-cols-2 gap-4">
              <input
                  type="email"
                  name="clientEmail"
                  placeholder="Email Address"
                  value={formData.clientEmail}
                  onChange={onInputChange}
                  className="px-4 py-3 bg-white/90 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-400"
                  required
              />
              <select
                  name="method"
                  value={formData.method}
                  onChange={onInputChange}
                  className="w-full px-4 py-3 bg-white/90 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-400"
                  required
              >
                <option value="">Select Consultation Method</option>
                {methods.map((m, idx) => (
                    <option key={idx} value={m}>
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </option>
                ))}
              </select>
            </div>

            {/* Date & Time */}
            <div className="grid md:grid-cols-2 gap-4">
              <input
                  type="date"
                  name="preferredDate"
                  value={formData.preferredDate}
                  onChange={onInputChange}
                  className="px-4 py-3 bg-white/90 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-400"
                  required
              />
              <input
                  type="time"
                  name="preferredTime"
                  value={formData.preferredTime}
                  onChange={onInputChange}
                  className="px-4 py-3 bg-white/90 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-400"
                  required
              />
            </div>
            {/* Message */}
            <textarea
                name="message"
                placeholder="Tell us about your migration goals and any specific questions you have..."
                rows="4"
                value={formData.message}
                onChange={onInputChange}
                className="w-full px-4 py-3 bg-white/90 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-400 resize-none"
            ></textarea>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
              >
                Book Consultation
              </button>
              <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 border-2 border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
  );
}
