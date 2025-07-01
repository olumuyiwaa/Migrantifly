import React from "react";

export default function BookNowModal({
  show,
  onClose,
  formData,
  onInputChange,
  onSubmit,
  visaTypes = [],
}) {
  if (!show) return null;

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

        <h2 className="text-4xl font-bold mb-2">
          Let's Build Your Future Together
        </h2>
        <p className="text-blue-100 text-lg mb-4">
          Start with a free assessment or talk to one of our migration specialists today.
        </p>

        <form
          onSubmit={onSubmit}
          className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl space-y-6"
        >
          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={onInputChange}
              className="px-4 py-3 bg-white/90 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all duration-300"
              required
            />
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={onInputChange}
              className="px-4 py-3 bg-white/90 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all duration-300"
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={onInputChange}
              className="px-4 py-3 bg-white/90 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all duration-300"
              required
            />
            <select
              name="visaType"
              value={formData.visaType}
              onChange={onInputChange}
              className="px-4 py-3 bg-white/90 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all duration-300"
            >
              <option value="">Select Visa Type</option>
              {visaTypes.map((visa, idx) => (
                <option key={idx} value={visa.title}>
                  {visa.title}
                </option>
              ))}
            </select>
          </div>

          <textarea
            name="message"
            placeholder="Tell us about your migration goals and any specific questions you have..."
            rows="4"
            value={formData.message}
            onChange={onInputChange}
            className="w-full px-4 py-3 bg-white/90 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-400 focus:outline-none resize-none transition-all duration-300"
          ></textarea>

          <div className="space-y-3">
            <label className="block text-white font-medium">
              CV / Resume Upload (Optional)
            </label>
            <input
              type="file"
              multiple
              accept=".txt,.doc,.docx,.pdf,.jpg,.png"
              className="w-full text-sm text-blue-100 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer transition-all duration-300"
            />
            <p className="text-xs text-blue-200">
              Accepted: txt, doc, docx, pdf, jpg, png. Max: 32 MB per file, 5
              files total.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
            >
              Get Free Assessment
            </button>
            <button
              type="button"
              className="flex-1 border-2 border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
              onClick={onClose}
            >
              Book Consultation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
