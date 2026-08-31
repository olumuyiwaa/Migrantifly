'use client'
import { useState } from 'react'
import Link from 'next/link'
import BookNowModal from './BookNowModal.js';
import {CloseIcon} from "@/icons";

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
              Book a Consultation
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
            <Link
              href="/portal"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Sign In
            </Link>

          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-900 hover:text-primary-600"
            >
              {isMenuOpen ? <CloseIcon className="w-6 h-6" /> :
                  <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
              >
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M5.99902 10.4951C6.82745 10.4951 7.49902 11.1667 7.49902 11.9951V12.0051C7.49902 12.8335 6.82745 13.5051 5.99902 13.5051C5.1706 13.5051 4.49902 12.8335 4.49902 12.0051V11.9951C4.49902 11.1667 5.1706 10.4951 5.99902 10.4951ZM17.999 10.4951C18.8275 10.4951 19.499 11.1667 19.499 11.9951V12.0051C19.499 12.8335 18.8275 13.5051 17.999 13.5051C17.1706 13.5051 16.499 12.8335 16.499 12.0051V11.9951C16.499 11.1667 17.1706 10.4951 17.999 10.4951ZM13.499 11.9951C13.499 11.1667 12.8275 10.4951 11.999 10.4951C11.1706 10.4951 10.499 11.1667 10.499 11.9951V12.0051C10.499 12.8335 11.1706 13.5051 11.999 13.5051C12.8275 13.5051 13.499 12.8335 13.499 12.0051V11.9951Z"
                    fill="currentColor"
                />
              </svg>}
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
              <button
              onClick={() => setShowModal(true)}
              className="block px-3 py-2 bg-primary-600 text-white rounded-lg font-medium"
              >
              Book a Consultation
            </button>
              <Link
                href="/portal"
                className="block px-3 py-2 text-primary-600 font-medium"
              >
                Sign In
              </Link>
            </div>
          </div>
        )}
        {/* Modal */}
        {showModal && (
        <BookNowModal
          show={showModal}
          onClose={() => setShowModal(false)}
          formData={formData}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
        />
      )}
      </div>
    </header>
  )
}