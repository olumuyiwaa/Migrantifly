import Link from 'next/link'

export default function Hero() {
  return (
    <section className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 pt-16">
      <div className="absolute inset-0 bg-black/50"></div>
<div className="relative min-h-[75vh] overflow-hidden">
  {/* Video Background */}
  <video
    autoPlay
    muted
    loop
    playsInline
    className="absolute inset-0 w-full h-full object-cover z-0"
  >
    <source src="/MigrationJourney.mp4" type="video/mp4" />
    Your browser does not support the video tag.
  </video>
  
  {/* Dark overlay for better text readability */}
  <div className="absolute inset-0 bg-black bg-opacity-50 z-5"></div>
  
  {/* Your existing content with updated z-index */}
  <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-48">
    <div className="grid lg:grid-cols-2 gap-12 items-center">
      <div className="text-white">
        <h1 className="text-5xl lg:text-6xl font-bold mb-6">
          Your Migration Journey Starts Here.
        </h1>
        <p className="text-xl mb-8 text-gray-300">
          From dreaming to thriving — we guide you through every step of your migration journey.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/contact"
            className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg font-semibold text-center transition-colors"
          >
            Contact Us
          </Link>
          <Link
            href="/services"
            className="border-2 border-white text-white hover:bg-white hover:text-slate-900 px-8 py-4 rounded-lg font-semibold text-center transition-colors"
          >
            Check Services
          </Link>
        </div>
      </div>
      <div className="relative">
        {/* You can add additional content here if needed */}
      </div>
    </div>
  </div>
</div>
    </section>
  )
}