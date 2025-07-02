// src/app/services/[slug]/page.js
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import services from '../../../data/services';

export async function generateStaticParams() {
  return services.map(service => ({ slug: service.slug }));
}

export async function generateMetadata({ params }) {
  const service = services.find(s => s.slug === params.slug);
  if (!service) return { title: 'Service Not Found' };

  return {
    title: service.title,
    description: service.metaDescription || service.description,
  };
}

export default function ServiceDetail({ params }) {
  const service = services.find(s => s.slug === params.slug);

  if (!service) notFound();

  return (
    <main>
      <Header />

      {/* Hero Section */}
      <div className="relative bg-slate-800 py-20 bg-cover bg-center min-h-[55vh]"
          style={{ backgroundImage: service.image ? `url(${service.image})` : 'url("/images/bg.png")' }}>
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="relative z-10 text-center text-white items-center pt-32">
            <div className="text-6xl mb-4">{service.icon}</div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{service.title}</h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto px-4">{service.description}</p>
          </div>
      </div>

      {/* Content + Sidebar */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <article className="lg:col-span-2">
            {/* Introduction */}
            <div className="prose prose-lg max-w-none mb-12">
              <p className="text-xl text-gray-700 leading-relaxed">{service.content.introduction}</p>
            </div>

            {/* Key Features */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">What We Offer</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {service.features.map((feature, index) => (
                  <div key={index} className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                      <span className="text-white font-bold">✓</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{feature}</h3>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Sections */}
            <div className="space-y-10">
              {service.content.sections.map((section, index) => (
                <section key={index} className="border-b border-gray-200 pb-8 last:border-b-0">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">{section.title}</h2>
                  <div className="text-gray-800 leading-relaxed whitespace-pre-line mb-6">
                    {section.content}
                  </div>

                  {section.subsections && (
                    <div className="space-y-4">
                      {section.subsections.map((sub, i) => (
                        <div key={i} className="pl-6 border-l-4 border-blue-600 bg-blue-50 p-4 rounded-r">
                          <h3 className="font-semibold text-blue-700 mb-2">{sub.subtitle}</h3>
                          <p className="text-gray-700">{sub.details}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>

            {/* Conclusion */}
            {service.content.conclusion && (
              <div className="mt-12 bg-gray-50 p-8 rounded-lg">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Ready to Get Started?</h2>
                <p className="text-gray-800 mb-6">{service.content.conclusion}</p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                    Get Free Assessment
                  </button>
                  <button className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                    Book Consultation
                  </button>
                </div>
              </div>
            )}

            {/* Checklist */}
            {service.content.checklist && (
              <div className="mt-12">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Essential Checklist</h3>
                <div className="bg-green-50 p-6 rounded-lg">
                  <ul className="space-y-2">
                    {service.content.checklist.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <span className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                          <span className="text-white text-xs">✓</span>
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
            {/* Quick Info */}
            <div className="bg-blue-600 text-white rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-blue-700">
                <h3 className="text-lg font-bold">Quick Information</h3>
              </div>
              <div className="px-6 py-6 space-y-4">
                <div>
                  <p className="text-blue-100 text-sm">Processing Time</p>
                  <p className="font-semibold">{service.processingTime}</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Available Countries</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {service.countries.map((country, index) => (
                      <span key={index} className="bg-blue-500 px-2 py-1 rounded text-xs">
                        {country}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Expert Consultant</p>
                  <p className="font-semibold">{service.author}</p>
                </div>
              </div>
            </div>

            {/* Process Steps */}
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-gray-100">
                <h3 className="text-lg font-bold text-gray-900">Our Process</h3>
              </div>
              <div className="px-6 py-6">
                <ol className="space-y-4">
                  {service.processSteps.map((step, index) => (
                    <li key={index} className="flex items-start">
                      <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-gray-800 text-sm">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Other Services */}
            <div className="rounded-lg overflow-hidden">
              <div className="bg-gray-800 px-6 py-4">
                <h3 className="text-white text-lg font-bold">Other Services</h3>
              </div>
              <div className="bg-gray-700 px-6 py-6 space-y-4">
                {services.filter(s => s.slug !== service.slug).map(s => (
                  <Link
                    key={s.slug}
                    href={`/services/${s.slug}`}
                    className="block text-white hover:text-blue-300 transition-colors"
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{s.icon}</span>
                      <span>{s.title}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Contact CTA */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-700 text-white p-6 rounded-lg">
              <h3 className="text-lg font-bold mb-2">Need Expert Advice?</h3>
              <p className="text-blue-100 text-sm mb-4">
                Get personalized guidance from our migration experts.
              </p>
              <Link
              href="/contact"
              className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg font-semibold text-center transition-colors">
              Contact Us Today
            </Link>
            </div>
          </aside>
        </div>
      </section>

      <Footer />
    </main>
  );
}