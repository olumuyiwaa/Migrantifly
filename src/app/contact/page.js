import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { MapPin, Phone, Mail } from 'lucide-react'

export default function Contact() {
  return (
    <main>
      <Header />
      <div
        className="relative bg-slate-800 py-20 bg-cover bg-center min-h-[55vh]"
          style={{ backgroundImage: 'url("/images/bg.png")' }}
      >
        {/* <div className="absolute inset-0 bg-black/50"></div> */}
        <div className="relative z-10 text-center text-white items-center pt-32">
          <h1 className="text-5xl font-bold mb-4">Contact</h1>
        </div>
      </div>

      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-4">Ready to Start Your Journey? Let's Talk.</h2>
              <p className="text-gray-600 mb-8">
                Whether you have a question, need guidance, or want to book a consultation — we're here for you.
                Reach out and let's make your migration dreams a reality.
              </p>

              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">Follow us</h3>
                <div className="flex space-x-4">
                  <img src="/logo/x.png" alt="x" className="w-10 h-10 rounded mr-2"/>
                  <img src="/logo/facebook.png" alt="faceboo" className="w-10 h-10 rounded mr-2"/>
                  <img src="/logo/linkedin.png" alt="linkedin" className="w-10 h-10 rounded mr-2"/>
                  <img src="/logo/insta.png" alt="instagram" className="w-10 h-10 rounded mr-2"/>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8">
              <form className="space-y-6">
                <input
                  type="text"
                  placeholder="Full Name*"
                  className="w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-primary-500"
                  required
                />
                <input
                  type="email"
                  placeholder="Email*"
                  className="w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-primary-500"
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone number*"
                  className="w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-primary-500"
                  required
                />
                <textarea
                  placeholder="Message"
                  rows="4"
                  className="w-full px-4 py-3 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-primary-500"
                ></textarea>
                <div className="flex flex-col sm:flex-row gap-4">
                 {/* <button
                    type="submit"
                    className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-semibold transition-colors"
                  >
                    Check Visa
                  </button>*/}
                  <button
                    type="button"
                    className="flex-1 border border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white py-3 rounded-lg font-semibold transition-colors"
                  >
                    Book a Call
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="mt-16 grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <form className="space-y-4">
                <input
                  type="text"
                  placeholder="Full Name*"
                  className="w-full px-4 py-3 bg-gray-100 rounded-lg border-0"
                  required
                />
                <input
                  type="email"
                  placeholder="Email*"
                  className="w-full px-4 py-3 bg-gray-100 rounded-lg border-0"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  Subscribe
                </button>
              </form>
            </div>

            <div className="flex flex-col items-center text-center py-10 px-4 bg-white">
              <div className="mb-6">
                <img
                  src="/logo/logo.png"
                  alt="Migrantifly"
                  className="w-24 h-24 rounded-full object-cover"
                />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Subscribe to our newsletter
              </h3>
              <h2 className="text-3xl font-bold text-primary-600 mb-6 max-w-xl">
                To get the latest immigration and Visa news
              </h2>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-primary-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="bg-white rounded-lg p-4">
              <div className="rounded-lg overflow-hidden h-64 w-full">
                <iframe
                  title="Uyo, Akwa Ibom, Nigeria Map"
                  src="https://www.google.com/maps?q=Uyo,+Akwa+Ibom,+Nigeria&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full"
                ></iframe>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gold-400 mb-6">
                Contact us via our Head office
              </h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 mr-3 text-gold-400" />
                  <span className="text-xl">Uyo, Akwa Ibom, Nigeria</span>
                </div>
                <div className="flex items-center">
                  <Phone className="w-5 h-5 mr-3 text-gold-400" />
                  <span className="text-xl">+234 xxx xxx xxxx</span>
                </div>
                <div className="flex items-center">
                  <Mail className="w-5 h-5 mr-3 text-gold-400" />
                  <span className="text-xl">info@migrantifly.com</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}