import Link from 'next/link'

export default function PaymentOptions() {
  return (
    <section className="relative">
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