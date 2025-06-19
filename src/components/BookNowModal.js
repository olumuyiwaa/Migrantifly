import React from "react";

export default function BookNowModal({
  show,
  onClose,
  formData,
  onInputChange,
  onSubmit,
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

        <h2 className="text-4xl lg:text-5xl font-bold mb-6">
          Let's Build Your Future Together
        </h2>
        <p className="text-blue-100 text-lg mb-8">
          Start with a free assessment or talk to one of our migration specialists today.
        </p>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-4">
            {["name", "phone", "email"].map((field) => (
              <input
                key={field}
                type={field === "email" ? "email" : "text"}
                name={field}
                placeholder={field[0].toUpperCase() + field.slice(1)}
                value={formData[field]}
                onChange={onInputChange}
                className="px-4 py-3 bg-white/90 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
            ))}
          </div>

          <textarea
            name="message"
            placeholder="Message"
            rows="4"
            value={formData.message}
            onChange={onInputChange}
            className="w-full px-4 py-3 bg-white/90 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-400 focus:outline-none resize-none"
          />

          <div>
            <p className="text-white font-medium mb-4">CV / Resume Upload</p>
            <input
              type="file"
              multiple
              accept=".txt,.doc,.docx,.pdf,.jpg,.png"
              className="text-sm text-blue-100 file:bg-blue-600 file:text-white file:px-4 file:py-2 file:rounded-xl file:cursor-pointer"
            />
            <p className="text-xs text-blue-200 mt-2">
              Accepted file types: txt, doc, docx, pdf, jpg, png. Max file size: 32 MB. Max files: 5.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-8 justify-center pt-4">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}