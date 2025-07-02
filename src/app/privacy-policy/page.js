// src/app/privacy-policy/page.js
import Header from '../../components/Header'
import Footer from '../../components/Footer'

export default function PrivacyPolicy() {
  return (
    <main>
      <Header />
      <div
        className="relative bg-slate-800 py-20 bg-cover bg-center min-h-[55vh]"
        style={{ backgroundImage: 'url("/images/bg.png")' }}
      >
        <div className="relative z-10 text-center text-white items-center pt-24">
          <h1 className="text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-xl max-w-2xl mx-auto px-4">
            Your privacy and data security are our top priorities
          </p>
        </div>
      </div>

      <div className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <div className="bg-blue-50 p-6 rounded-lg mb-8">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Last Updated:</strong> January 1, 2025
              </p>
              <p className="text-gray-700">
                This Privacy Policy explains how Migrantifly collects, uses, and protects your personal information when you use our migration services and website.
              </p>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-primary-900">1. Information We Collect</h2>
              <div className="space-y-4 text-gray-600">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Personal Information</h3>
                  <p>We collect personal information that you provide to us, including:</p>
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>Full name, date of birth, and contact details</li>
                    <li>Passport and identification documents</li>
                    <li>Educational and professional qualifications</li>
                    <li>Financial information for visa applications</li>
                    <li>Family and relationship details</li>
                    <li>Medical information as required for immigration</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Usage Information</h3>
                  <p>We automatically collect information about how you use our website and services, including IP addresses, browser type, pages visited, and time spent on our site.</p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-primary-900">2. How We Use Your Information</h2>
              <div className="space-y-3 text-gray-600">
                <p>We use your personal information to:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Assess your eligibility for various visa programs</li>
                  <li>Prepare and submit immigration applications</li>
                  <li>Communicate with you about your case progress</li>
                  <li>Provide settlement and post-arrival support</li>
                  <li>Comply with legal and regulatory requirements</li>
                  <li>Improve our services and website functionality</li>
                  <li>Send you relevant updates about immigration policies</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-primary-900">3. Information Sharing and Disclosure</h2>
              <div className="space-y-4 text-gray-600">
                <p>We may share your information with:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li><strong>Government Authorities:</strong> Immigration departments and other relevant government agencies</li>
                  <li><strong>Service Providers:</strong> Trusted third parties who assist with document translation, medical examinations, and other services</li>
                  <li><strong>Legal Compliance:</strong> When required by law or to protect our legal rights</li>
                  <li><strong>Business Partners:</strong> Licensed immigration advisers and settlement service providers</li>
                </ul>
                <p className="mt-4">We never sell your personal information to third parties for marketing purposes.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-primary-900">4. Data Security</h2>
              <div className="space-y-3 text-gray-600">
                <p>We implement robust security measures to protect your personal information:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Encrypted data transmission and storage</li>
                  <li>Secure client portal with multi-factor authentication</li>
                  <li>Regular security audits and updates</li>
                  <li>Restricted access to personal information</li>
                  <li>Staff training on data protection protocols</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-primary-900">5. Data Retention</h2>
              <div className="space-y-3 text-gray-600">
                <p>We retain your personal information for as long as necessary to:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Provide ongoing immigration services</li>
                  <li>Comply with legal and regulatory requirements</li>
                  <li>Resolve any disputes or legal issues</li>
                </ul>
                <p>Generally, we retain client files for 7 years after case completion, unless legal requirements specify otherwise.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-primary-900">6. Your Rights</h2>
              <div className="space-y-3 text-gray-600">
                <p>You have the right to:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate or incomplete information</li>
                  <li>Request deletion of your information (subject to legal requirements)</li>
                  <li>Object to processing of your information</li>
                  <li>Receive a copy of your information in a portable format</li>
                  <li>Withdraw consent where processing is based on consent</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-primary-900">7. Cookies and Tracking</h2>
              <div className="space-y-3 text-gray-600">
                <p>Our website uses cookies to improve your experience. We use:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li><strong>Essential Cookies:</strong> Required for website functionality</li>
                  <li><strong>Analytics Cookies:</strong> To understand how you use our website</li>
                  <li><strong>Marketing Cookies:</strong> To show relevant content and advertisements</li>
                </ul>
                <p>You can control cookie settings through your browser preferences.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-primary-900">8. Changes to This Policy</h2>
              <div className="space-y-3 text-gray-600">
                <p>We may update this Privacy Policy periodically. We will notify you of significant changes by email or through our website. Your continued use of our services after changes are posted constitutes acceptance of the updated policy.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-primary-900">9. Contact Information</h2>
              <div className="space-y-3 text-gray-600">
                <p>If you have questions about this Privacy Policy or your personal information, please contact us:</p>
                <div className="bg-gray-50 p-4 rounded-lg mt-4">
                  <p><strong>Email:</strong> privacy@migrantifly.com</p>
                  <p><strong>Phone:</strong> [Your Phone Number]</p>
                  <p><strong>Address:</strong> [Your Business Address]</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <div className="bg-primary-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Questions About Our Privacy Policy?</h2>
          <p className="text-xl text-blue-100 mb-8">
            We're committed to transparency and protecting your privacy.
          </p>
          <Link
              href="/contact"
              className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg font-semibold text-center transition-colors"
            >
              Contact Us
            </Link>
        </div>
      </div>

      <Footer />
    </main>
  )
}