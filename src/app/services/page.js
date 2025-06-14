"use client";
import React, { useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function Services() {
  const services = [
    {
      title: "Skilled Migration Visas",
      description: "Move abroad based on your skills, qualifications, and work experience.",
      features: [
        "General Skilled Migration",
        "Employer Sponsored Visas",
        "Regional Opportunities"
      ]
    },
    {
      title: "Student Visas",
      description: "Study abroad with support on visa applications and education pathways.",
      features: [
        "University Admissions",
        "Visa Application Assistance",
        "Post-Study Work Options"
      ]
    },
    {
      title: "Family & Partner Visas",
      description: "Reunite with your loved ones and build a future together.",
      features: [
        "Partner Visas",
        "Parent Visas",
        "Child Visas"
      ]
    }
  ];

  const visaTypes = [
    "I WANT AN Employer Sponsorship Visa",
    "I WANT A Skilled Independent Visa",
    "I WANT A Student Visa",
    "I WANT A Family Reunion Visa"
  ];

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  });

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
    // Handle form submission logic (e.g., API call)
  };

  return (
    <main>
      <Header />

      {/* Hero */}
      <div className="relative bg-slate-800 py-20">
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 text-center text-white">
          <h1 className="text-5xl font-bold mb-4">Services</h1>
          <p className="text-xl max-w-3xl mx-auto px-4">
            At Migrantifly, we offer a complete range of migration services to help you realize your dream of living, studying, or working abroad.
          </p>
        </div>
      </div>

      {/* Services */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Explore the visa and settlement pathways we support:
          </h2>

          <div className="grid md:grid-cols-3 gap-32">
            {services.map((service, index) => (
              <div key={index} className="text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-gold-400 rounded-full mx-auto mb-6"></div>
                <h3 className="text-xl font-bold mb-4">{service.title}</h3>
                <p className="text-gray-600 mb-6">{service.description}</p>
                <ul className="space-y-2 mb-6 max-w-xs">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center justify-center">
                      <span className="w-2 h-2 bg-primary-600 rounded-full mr-2"></span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors">
                  LEARN MORE
                </button>
              </div>
            ))}
          </div>

          <div className="text-center my-12">
            <button className="text-primary-600 font-semibold">
              Explore by Country ⓘ
            </button>
          </div>

          {/* Visa Types */}
          <div className="grid md:grid-cols-4 gap-4">
            {visaTypes.map((visa, index) => (
              <div key={index} className="bg-primary-600 text-white p-6 rounded-lg text-center">
                <div className="w-16 h-16 bg-gold-400 rounded-full mx-auto mb-4"></div>
                <p className="font-semibold mb-4">{visa}</p>
                <button className="bg-primary-700 hover:bg-primary-800 px-4 py-2 rounded transition-colors">
                  LEARN MORE
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

            {/* Contact Form */}
            <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white py-16 overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-20 left-10 w-32 h-32 bg-blue-400 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 left-20 w-24 h-24 bg-purple-400 rounded-full blur-2xl"></div>
                <div className="absolute top-40 right-32 w-16 h-16 bg-cyan-400 rounded-full blur-xl"></div>
              </div>

              <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-3 gap-16 items-center">
                  {/* Form */}
                  <div className="col-span-2 w-full">
                    <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                      Let's Build Your Future Together
                    </h2>
                    <p className="text-blue-100 text-lg mb-8">
                      Start with a free assessment or talk to one of our migration specialists today.
                    </p>

                    <form
                      onSubmit={handleSubmit}
                      className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 space-y-6"
                    >
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
                      ></textarea>

                      <div className="text-center">
                        <p className="text-white font-medium mb-4">CV/Resume Upload</p>
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

                  {/* Circular Image */}
                  <div className="col-span-1 relative h-[500px] flex items-center justify-center">
                    <div className="absolute w-[424px] h-[424px] bg-[#D9D9D9] rounded-full left-0 top-0 z-0">
                      <img src="" alt="" className="w-full h-full object-contain rounded-full" />
                    </div>
                    <div className="absolute w-[224px] h-[224px] bg-[#B3B3B3] rounded-full left-0 top-64 z-10">
                      <img src="" alt="" className="w-full h-full object-contain rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>


      <Footer />
    </main>
  );
}
