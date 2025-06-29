"use client";
import React, { useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Link from 'next/link';

export default function Services() {
  const services = [
    {
      slug: 'skilled-migration-visas',
      title: "Skilled Migration Visas",
      description: "Move abroad based on your skills, qualifications, and work experience.",
      icon: "🏢",
      features: [
        "General Skilled Migration",
        "Employer Sponsored Visas",
        "Regional Opportunities"
      ],
      processingTime: "6-12 months",
      countries: ["Australia", "Canada", "New Zealand", "UK"]
    },
    {
      slug: 'student-visas',
      title: "Student Visas",
      description: "Study abroad with support on visa applications and education pathways.",
      icon: "🎓",
      features: [
        "University Admissions",
        "Visa Application Assistance",
        "Post-Study Work Options"
      ],
      processingTime: "4-8 weeks",
      countries: ["Australia", "Canada", "UK", "US", "New Zealand"]
    },
    {
      slug: 'family-partner-visas',
      title: "Family & Partner Visas",
      description: "Reunite with your loved ones and build a future together.",
      icon: "❤️",
      features: [
        "Partner Visas",
        "Parent Visas",
        "Child Visas"
      ],
      processingTime: "12-36 months",
      countries: ["Australia", "Canada", "New Zealand", "UK"]
    }
  ];

  const visaTypes = [
    {
      title: "Skilled Independent Visa",
      description: "Migrate based on your skills and qualifications",
      icon: "⚡",
      color: "from-green-600 to-green-700"
    },
    {
      title: "Student Visa",
      description: "Study at world-class institutions",
      icon: "📚",
      color: "from-purple-600 to-purple-700"
    },
    {
      title: "Family Reunion Visa",
      description: "Bring your family together",
      icon: "❤️",
      color: "from-pink-600 to-pink-700"
    }
  ];

  const countries = [
    { name: "Australia", flag: "🇦🇺", visas: 12 },
    { name: "Canada", flag: "🇨🇦", visas: 15 },
    { name: "New Zealand", flag: "🇳🇿", visas: 8 },
    { name: "United Kingdom", flag: "🇬🇧", visas: 10 },
    { name: "United States", flag: "🇺🇸", visas: 6 }
  ];

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
    visaType: ''
  });

  const [showCountries, setShowCountries] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Handle form submission logic
  };

  return (
    <main className="overflow-x-hidden">
      <Header />

      {/* Enhanced Hero Section */}
      <div className="relative bg-gradient-to-br from-slate-800 via-slate-700 to-blue-900 py-20 min-h-[60vh] overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/bg.png')] bg-cover bg-center"></div>

        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-40 right-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
        </div>

        <div className="relative z-10 text-center text-white pt-20">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
              Our Services
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              At Migrantifly, we offer a complete range of migration services to help you realize your dream of living, studying, or working abroad.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <div className="bg-white/10 backdrop-blur-sm px-6 py-2 rounded-full border border-white/20">
                <span className="text-blue-200">✓ Expert Guidance</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-6 py-2 rounded-full border border-white/20">
                <span className="text-blue-200">✓ 95% Success Rate</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-6 py-2 rounded-full border border-white/20">
                <span className="text-blue-200">✓ 1000+ Happy Clients</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Services Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Explore Our Visa & Settlement Pathways
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose from our comprehensive range of migration services, each designed to meet your specific needs and goals.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8 mb-16">
            {services.map((service, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group hover:-translate-y-2">
                <div className="p-8">
                  <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">
                    {service.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{service.title}</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">{service.description}</p>

                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">What's Included:</h4>
                    <ul className="space-y-2">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-gray-700">
                          <div className="w-2 h-2 bg-blue-600 rounded-full mr-3 flex-shrink-0"></div>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Processing Time:</span>
                      <span className="text-sm font-bold text-blue-600">{service.processingTime}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {service.countries.slice(0, 3).map((country, idx) => (
                        <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {country}
                        </span>
                      ))}
                      {service.countries.length > 3 && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          +{service.countries.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/services/${service.slug}`}
                    className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-center px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Country Explorer */}
          <div className="text-center mb-8">
            <button
              onClick={() => setShowCountries(!showCountries)}
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold text-lg transition-colors duration-300"
            >
              <span>Explore by Country</span>
              <svg className={`ml-2 w-5 h-5 transform transition-transform duration-300 ${showCountries ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {showCountries && (
            <div className="grid md:grid-cols-5 gap-6 mb-16 animate-fadeIn">
              {countries.map((country, index) => (
                <div key={index} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6 text-center group hover:-translate-y-1">
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                    {country.flag}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{country.name}</h3>
                  <p className="text-sm text-gray-600">{country.visas} visa types</p>
                  <button className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium">
                    View Options →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Contact Form */}
      <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white py-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-32 h-32 bg-blue-400 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 left-20 w-24 h-24 bg-purple-400 rounded-full blur-2xl animate-pulse animation-delay-2000"></div>
          <div className="absolute top-40 right-32 w-16 h-16 bg-cyan-400 rounded-full blur-xl animate-pulse animation-delay-4000"></div>
          <div className="absolute bottom-40 right-20 w-20 h-20 bg-pink-400 rounded-full blur-2xl animate-pulse animation-delay-1000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-12 items-center">
            {/* Enhanced Form */}
            <div className="lg:col-span-2">
              <div className="mb-8">
                <h2 className="text-4xl lg:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
                  Let's Build Your Future Together
                </h2>
                <p className="text-blue-100 text-lg leading-relaxed">
                  Start with a free assessment or talk to one of our migration specialists today.
                  Our expert team is ready to guide you through every step of your migration journey.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="px-4 py-3 bg-white/90 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all duration-300"
                    required
                  />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={handleInputChange}
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
                    onChange={handleInputChange}
                    className="px-4 py-3 bg-white/90 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all duration-300"
                    required
                  />
                  <select
                    name="visaType"
                    value={formData.visaType}
                    onChange={handleInputChange}
                    className="px-4 py-3 bg-white/90 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all duration-300"
                  >
                    <option value="">Select Visa Type</option>
                    {visaTypes.map((visa, idx) => (
                      <option key={idx} value={visa.title}>{visa.title}</option>
                    ))}
                  </select>
                </div>

                <textarea
                  name="message"
                  placeholder="Tell us about your migration goals and any specific questions you have..."
                  rows="4"
                  value={formData.message}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/90 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-400 focus:outline-none resize-none transition-all duration-300"
                ></textarea>

                <div className="space-y-3">
                  <label className="block text-white font-medium">CV / Resume Upload (Optional)</label>
                  <input
                    type="file"
                    multiple
                    accept=".txt,.doc,.docx,.pdf,.jpg,.png"
                    className="w-full text-sm text-blue-100 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer transition-all duration-300"
                  />
                  <p className="text-xs text-blue-200">
                    Accepted: txt, doc, docx, pdf, jpg, png. Max: 32 MB per file, 5 files total.
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
                  >
                    Book Consultation
                  </button>
                </div>
              </form>
            </div>

            {/* Enhanced Image Section */}
            <div className="lg:col-span-1">
              <div className="relative h-[500px] flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
                <div className="relative">
                  <div className="w-[240px] h-[240px] bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-full border border-white/20 flex items-center justify-center mb-4">
                    <img
                      src="/images/about2.png"
                      alt="Migration Consultant"
                      className="w-[200px] h-[200px] object-cover rounded-full shadow-2xl"
                      loading="lazy"
                    />
                  </div>
                  <div className="text-center mt-6">
                    <h3 className="text-2xl font-bold text-white mb-2">Expert Guidance</h3>
                    <p className="text-blue-200">Professional migration consultants ready to help</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </main>
  );
}