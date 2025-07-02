export default function CallToAction() {
  return (
    <section className="bg-primary-900 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between min-h-[400px]">
        {/* Left Side */}
        <div className="w-full md:w-1/2 text-center md:text-left flex flex-col items-center md:items-start justify-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Start Your<br className="hidden md:block" /> Migration Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Book a free consultation or explore your visa options now.
          </p>
          <div className="flex gap-4 justify-center md:justify-start">
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
            Check Eligibility
          </Link>
          </div>
        </div>
        {/* Right Side */}
        <div className="w-full md:w-1/2 flex justify-center md:justify-end mt-12 md:mt-0">
          <div className="rounded-full bg-blue-600" style={{ width: 320, height: 320 }}>
          <img
            src="/images/features/migration1.png"
            alt=""
            className="w-full h-full object-contain rounded-full"
          />
          </div>
        </div>
      </div>
    </section>
  )
}