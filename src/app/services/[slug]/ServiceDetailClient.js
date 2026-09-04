'use client';

import { useState } from 'react';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import Link from 'next/link';
import BookNowModal from '../../../components/BookNowModal';

export default function ServiceDetailClient({ service, otherServices = [] }) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
  });

  const handleInputChange = (e) =>
      setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert('Thank you! We will contact you soon.');
    setFormData({ name: '', phone: '', email: '', message: '' });
    setShowModal(false);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ name: '', phone: '', email: '', message: '' });
  };

  const content = service.content ?? {};
  const features = service.features ?? [];
  const countries = service.countries ?? [];
  const processSteps = service.processSteps ?? [];
  const sections = content.sections ?? [];
  const checklist = content.checklist ?? [];

  return (
      <main>
        <Header />

        {/* Hero */}
        <div
            className="relative min-h-[55vh] bg-cover bg-center bg-slate-800 py-20"
            style={{
              backgroundImage: service.image
                  ? `url(${service.image})`
                  : 'url("/images/bg.png")',
            }}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 items-center pt-32 text-center text-white">
            {service.icon && <div className="mb-4 text-6xl">{service.icon}</div>}
            <h1 className="mb-4 text-4xl font-bold md:text-5xl">{service.title}</h1>
            <p className="mx-auto max-w-2xl px-4 text-lg text-gray-300">
              {service.description}
            </p>
          </div>
        </div>

        <section className="bg-white py-16">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
            {/* Main */}
            <article className="lg:col-span-2">
              {content.introduction && (
                  <div className="prose prose-lg mb-12 max-w-none">
                    <p className="text-xl leading-relaxed text-gray-700">
                      {content.introduction}
                    </p>
                  </div>
              )}

              {features.length > 0 && (
                  <div className="mb-12">
                    <h2 className="mb-6 text-2xl font-bold text-gray-900">
                      What We Offer
                    </h2>
                    <div className="grid gap-6 md:grid-cols-3">
                      {features.map((feature, index) => (
                          <div
                              key={index}
                              className="rounded-lg border border-blue-100 bg-blue-50 p-6"
                          >
                            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600">
                              <span className="font-bold text-white">✓</span>
                            </div>
                            <h3 className="mb-2 font-semibold text-gray-900">
                              {feature}
                            </h3>
                          </div>
                      ))}
                    </div>
                  </div>
              )}

              <div className="space-y-10">
                {sections.map((section, index) => (
                    <section
                        key={index}
                        className="border-b border-gray-200 pb-8 last:border-b-0"
                    >
                      {section.title && (
                          <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                            {section.title}
                          </h2>
                      )}
                      {section.content && (
                          <div className="mb-6 whitespace-pre-line leading-relaxed text-gray-800">
                            {section.content}
                          </div>
                      )}
                      {section.subsections?.length > 0 && (
                          <div className="space-y-4">
                            {section.subsections.map((sub, i) => (
                                <div
                                    key={i}
                                    className="rounded-r border-l-4 border-blue-600 bg-blue-50 p-4 pl-6"
                                >
                                  {sub.subtitle && (
                                      <h3 className="mb-2 font-semibold text-blue-700">
                                        {sub.subtitle}
                                      </h3>
                                  )}
                                  {sub.details && (
                                      <p className="text-gray-700">{sub.details}</p>
                                  )}
                                </div>
                            ))}
                          </div>
                      )}
                    </section>
                ))}
              </div>

              {content.conclusion && (
                  <div className="mt-12 rounded-lg bg-gray-50 p-8">
                    <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                      Ready to Get Started?
                    </h2>
                    <p className="mb-6 text-gray-800">{content.conclusion}</p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="rounded-lg border-2 border-blue-600 px-8 py-3 font-semibold text-blue-600 transition-colors hover:bg-blue-600 hover:text-white"
                    >
                      Book Consultation
                    </button>
                  </div>
              )}

              {checklist.length > 0 && (
                  <div className="mt-12">
                    <h3 className="mb-4 text-xl font-semibold text-gray-900">
                      Essential Checklist
                    </h3>
                    <div className="rounded-lg bg-green-50 p-6">
                      <ul className="space-y-2">
                        {checklist.map((item, index) => (
                            <li key={index} className="flex items-start">
                        <span className="mr-3 mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-600">
                          <span className="text-xs text-white">✓</span>
                        </span>
                              <span className="text-gray-800">{item}</span>
                            </li>
                        ))}
                      </ul>
                    </div>
                  </div>
              )}
            </article>

            {/* Sidebar */}
            <aside className="space-y-8">
              <div className="overflow-hidden rounded-lg bg-blue-600 text-white">
                <div className="bg-blue-700 px-6 py-4">
                  <h3 className="text-lg font-bold">Quick Information</h3>
                </div>
                <div className="space-y-4 px-6 py-6">
                  {service.processingTime && (
                      <div>
                        <p className="text-sm text-blue-100">Processing Time</p>
                        <p className="font-semibold">{service.processingTime}</p>
                      </div>
                  )}
                  {countries.length > 0 && (
                      <div>
                        <p className="text-sm text-blue-100">Available Countries</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {countries.map((country, index) => (
                              <span
                                  key={index}
                                  className="rounded bg-blue-500 px-2 py-1 text-xs"
                              >
                          {country}
                        </span>
                          ))}
                        </div>
                      </div>
                  )}
                  {service.author && (
                      <div>
                        <p className="text-sm text-blue-100">Expert Consultant</p>
                        <p className="font-semibold">{service.author}</p>
                      </div>
                  )}
                </div>
              </div>

              {processSteps.length > 0 && (
                  <div className="overflow-hidden rounded-lg bg-gray-50">
                    <div className="bg-gray-100 px-6 py-4">
                      <h3 className="text-lg font-bold text-gray-900">Our Process</h3>
                    </div>
                    <div className="px-6 py-6">
                      <ol className="space-y-4">
                        {processSteps.map((step, index) => (
                            <li key={index} className="flex items-start">
                        <span className="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                          {index + 1}
                        </span>
                              <span className="text-sm text-gray-800">{step}</span>
                            </li>
                        ))}
                      </ol>
                    </div>
                  </div>
              )}

              {otherServices.length > 0 && (
                  <div className="overflow-hidden rounded-lg">
                    <div className="bg-gray-800 px-6 py-4">
                      <h3 className="text-lg font-bold text-white">Other Services</h3>
                    </div>
                    <div className="space-y-4 bg-gray-700 px-6 py-6">
                      {otherServices.map((s) => (
                          <Link
                              key={s.slug}
                              href={`/services/${s.slug}`}
                              className="block text-white transition-colors hover:text-blue-300"
                          >
                            <div className="flex items-center">
                              {s.icon && (
                                  <span className="mr-3 text-2xl">{s.icon}</span>
                              )}
                              <span>{s.title}</span>
                            </div>
                          </Link>
                      ))}
                    </div>
                  </div>
              )}

              <div className="rounded-lg bg-gradient-to-br from-blue-600 to-purple-700 p-6 text-white">
                <h3 className="mb-2 text-lg font-bold">Need Expert Advice?</h3>
                <p className="mb-4 text-sm text-blue-100">
                  Get personalized guidance from our migration experts.
                </p>
                <Link
                    href="/contact"
                    className="block rounded-lg bg-white px-6 py-3 text-center font-semibold text-blue-600 transition-colors hover:bg-gray-100"
                >
                  Contact Us Today
                </Link>
              </div>
            </aside>
          </div>
        </section>

        <Footer />

        {showModal && (
            <BookNowModal
                show={showModal}
                onClose={handleCloseModal}
                formData={formData}
                onInputChange={handleInputChange}
                onSubmit={handleSubmit}
            />
        )}
      </main>
  );
}