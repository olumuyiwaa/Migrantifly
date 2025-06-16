'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, ChevronDown, User } from 'lucide-react'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });

  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData);
    setShowModal(false);
  };

  return (
    <header className="bg-white shadow-sm fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <img src="/logo/logo.png" alt="Migrantifly" className="w-6 h-6 rounded mr-2"/>
              <span className="text-xl font-bold text-gray-900">Migrantifly</span>
            </Link>
          </div>

          <nav className="hidden md:flex space-x-8">
            <Link href="/" className="text-gray-900 hover:text-primary-600 font-medium">
              Home
            </Link>
            <Link href="/about" className="text-gray-900 hover:text-primary-600 font-medium">
              About
            </Link>
            <Link href="/services" className="text-gray-900 hover:text-primary-600 font-medium">
              Services
            </Link>
            <Link href="/contact" className="text-gray-900 hover:text-primary-600 font-medium">
              Contact
            </Link>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={() => setShowModal(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
              Book Now
            </button>
            {/* <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center text-gray-700 hover:text-primary-600"
              >
                <User className="w-5 h-5 mr-1" />
                <ChevronDown className="w-4 h-4" />
              </button>
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                  <div className="px-4 py-2 text-sm text-gray-700">Admin Panel</div>
                  <div className="px-4 py-2 text-sm text-gray-700">Dashboard</div>
                  <div className="px-4 py-2 text-sm text-gray-700">Account Settings</div>
                  <div className="px-4 py-2 text-sm text-gray-700">Sign out</div>
                </div>
              )}
            </div> */}
            {/* <Link
              href="/signup"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Sign Up
            </Link> */}

          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-900 hover:text-primary-600"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              <Link
                href="/"
                className="block px-3 py-2 text-gray-900 hover:text-primary-600 font-medium"
              >
                Home
              </Link>
              <Link
                href="/about"
                className="block px-3 py-2 text-gray-900 hover:text-primary-600 font-medium"
              >
                About
              </Link>
              <Link
                href="/services"
                className="block px-3 py-2 text-gray-900 hover:text-primary-600 font-medium"
              >
                Services
              </Link>
              <Link
                href="/contact"
                className="block px-3 py-2 text-gray-900 hover:text-primary-600 font-medium"
              >
                Contact
              </Link>
              <Link
                href="/book"
                className="block px-3 py-2 bg-primary-600 text-white rounded-lg font-medium"
              >
                Book Now
              </Link>
              <Link
                href="/signup"
                className="block px-3 py-2 text-primary-600 font-medium"
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}
        {/* Modal */}
        {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-black/60 backdrop-blur-sm border border-white/20 rounded-2xl p-8 max-w-4xl w-full m-4 relative text-white">
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
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

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-4">
                {["name", "phone", "email"].map((field) => (
                  <input
                    key={field}
                    type={field === "email" ? "email" : "text"}
                    name={field}
                    placeholder={field[0].toUpperCase() + field.slice(1)}
                    value={formData[field]}
                    onChange={handleInputChange}
                    className="px-4 py-3 bg-white/90 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  />
                ))}
              </div>

              <textarea
                name="message"
                placeholder="Message"
                rows="4"
                value={formData.message}
                onChange={handleInputChange}
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
                  Check Visa
                </button>
                <button
                  type="button"
                  className="border-2 border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white px-8 py-3 rounded-xl font-semibold transition-colors"
                >
                  Book a Call
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </header>
  )
}