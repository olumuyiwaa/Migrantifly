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
            href="/services"
            className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg font-semibold text-center transition-colors"
          >
            Book Now
          </Link>
          <Link
            href="/contact"
            className="border-2 border-white text-white hover:bg-white hover:text-slate-900 px-8 py-4 rounded-lg font-semibold text-center transition-colors"
          >
            Check Eligibility
          </Link>
        </div>
      </div>
      <div className="relative">
        {/* You can add additional content here if needed */}
      </div>
    </div>
  </div>
</div>

      {/* Payment Partners */}
      <div className="relative z-10 bg-white py-12">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex flex-wrap justify-center items-center gap-8 opacity-80">
      {/* MasterCard */}
      <img
        src="/images/payments/trusted.png"
        alt="Trusted Payment Services we use"
        className="h-6 w-auto"
      />

      {/* MasterCard */}
      <img
        src="/images/payments/mastercard.png"
        alt="MasterCard"
        className="h-10 w-auto"
      />

      {/* VISA */}
      <img
        src="/images/payments/visa.png"
        alt="VISA"
        className="h-10 w-auto"
      />

      {/* Verve */}
      <img
        src="/images/payments/verve.png"
        alt="Verve"
        className="h-10 w-auto"
      />

      {/* Bitcoin */}
      <img
        src="/images/payments/bitcoin.png"
        alt="Bitcoin"
        className="h-10 w-auto"
      />

      {/* Flutterwave */}
      <img
        src="/images/payments/flutterwave.png"
        alt="Flutterwave"
        className="h-10 w-auto"
      />
    </div>
  </div>
</div>

    </section>
  )
}