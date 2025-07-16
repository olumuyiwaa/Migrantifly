import Link from 'next/link'
import { MapPin, Phone, Mail } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-primary-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-6">
              <img src="/logo/logo.png" alt="Migrantifly" className="w-6 h-6 rounded mr-2"/>
              <span className="text-xl font-bold">Migrantifly</span>
            </div>
            <p className="text-blue-100 mb-6">
                From dreaming to thriving — we guide you through every step of your migration journey.            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                <span>16 Nandi Lane, Ranui, Auckland, New Zealand </span>
              </div>
             {/* <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                <span>+234 xxx xxx xxxx</span>
              </div>*/}
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                <span>Migrantifly@gmail.com</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-6">QUICK LINKS</h3>
            <ul className="space-y-3">
              <li><Link href="/" className="text-blue-100 hover:text-white">Home</Link></li>
              <li><Link href="/contact" className="text-blue-100 hover:text-white">Contact</Link></li>
              <li><Link href="/about" className="text-blue-100 hover:text-white">About Us</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-6">OUR SERVICES</h3>
            <ul className="space-y-3">
              <li><Link href="/services" className="text-blue-100 hover:text-white">Services</Link></li>
              <li><Link href="/blog" className="text-blue-100 hover:text-white">Blog</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-6">LEGAL & SUPPORT</h3>
            <ul className="space-y-3">
              <li><Link href="/faq" className="text-blue-100 hover:text-white">FAQ</Link></li>
              <li><Link href="/privacy-policy" className="text-blue-100 hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-blue-100 hover:text-white">Terms</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-blue-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-blue-100 text-sm">
            © Copyright Migrantifly. All rights reserved.
          </div>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="https://x.com/migrantifly" target="_blank" rel="noopener noreferrer">
              <img src="/logo/x.png" alt="X (Twitter)" className="w-6 h-6 rounded mr-2 filter invert brightness-0" />
            </a>
            <a href="https://www.facebook.com/Migrantifly" target="_blank" rel="noopener noreferrer">
              <img src="/logo/facebook.png" alt="Facebook" className="w-6 h-6 rounded mr-2 filter invert brightness-0" />
            </a>
           <a href="https://linkedin.com/in/migrantifly" target="_blank" rel="noopener noreferrer">
              <img src="/logo/linkedin.png" alt="LinkedIn" className="w-6 h-6 rounded mr-2 filter invert brightness-0" />
            </a>
            <a href="https://www.instagram.com/migrantifly" target="_blank" rel="noopener noreferrer">
              <img src="/logo/insta.png" alt="Instagram" className="w-6 h-6 rounded mr-2 filter invert brightness-0" />
            </a>
            <a href="https://www.tiktok.com/@migrantifly" target="_blank" rel="noopener noreferrer">
              <img src="/logo/tiktok.png" alt="Tiktok" className="w-6 h-6 rounded mr-2 filter invert brightness-0" />
            </a>
          </div>

        </div>
      </div>

      {/* Chat Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        <button className="bg-gold-400 hover:bg-gold-500 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors">
          <span className="text-white text-xl">💬</span>
        </button>
      </div>
    </footer>
  )
}