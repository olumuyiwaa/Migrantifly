// src/app/terms/page.js
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import Link from 'next/link'

export default function Terms() {
  return (
    <main>
      <Header />
      <div
        className="relative bg-slate-800 py-20 bg-cover bg-center min-h-[55vh]"
        style={{ backgroundImage: 'url("/images/bg.png")' }}
      >
        <div className="relative z-10 text-center text-white items-center pt-24">
          <h1 className="text-5xl font-bold mb-4">Terms of Service</h1>
          <p className="text-xl max-w-2xl mx-auto px-4">
            Please read these terms carefully before using our services
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
                These Terms of Service govern your use of Migrantifly's migration advisory services and website. By using our services, you agree to these terms.
              </p>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-primary-900">1. Acceptance of Terms</h2>
              <div className="space-y-3 text-gray-600">
                <p>By accessing our website or engaging our services, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use our services.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-primary-900">2. Our Services</h2>
              <div className="space-y-4 text-gray-600">
                <p>Migrantifly provides immigration advisory services including:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Visa eligibility assessments</li>
                  <li>Immigration application preparation and submission</li>
                  <li>Document review and verification</li>
                  <li>Settlement planning and support</li>
                  <li>Ongoing case management</li>
                </ul>
                <p><strong>Important:</strong> We provide advisory services only. Final immigration decisions are made by relevant government authorities, and we cannot guarantee specific outcomes.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-primary-900">3. Client Responsibilities</h2>
              <div className="space-y-4 text-gray-600">
                <p>As our client, you agree to:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Provide accurate, complete, and truthful information</li>
                  <li>Submit all required documents in a timely manner</li>
                  <li>Pay fees as agreed in your service agreement</li>
                  <li>Inform us immediately of any changes to your circumstances</li>
                  <li>Comply with all applicable laws and regulations</li>
                  <li>Follow our advice and recommendations</li>
                  <li>Maintain confidentiality of login credentials</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-primary-900">4. Fees and Payment</h2>
              <div className="space-y-4 text-gray-600">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Fee Structure</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Professional fees are outlined in your service agreement</li>
                  <li>Government fees and third-party costs are separate</li>
                  <li>Payment schedules are specified in your engagement letter</li>
                  <li>All fees are quoted in the currency specified in your agreement</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-6">Payment Terms</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Initial consultation fees are payable upfront</li>
                  <li>Ongoing fees are typically payable at key milestones</li>
                  <li>Government and third-party fees are payable when due</li>
                  <li>Late payment may result in service suspension</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-primary-900">5. Refund Policy</h2>
              <div className="space-y-3 text-gray-600">
                <p>Refunds are considered on a case-by-case basis:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Work already completed is generally non-refundable</li>
                  <li>Government fees and third-party costs are non-refundable</li>
                  <li>Refund requests must be made in writing</li>
                  <li>Refunds may be prorated based on work completed</li>
                  <li>Processing fees may apply to approved refunds</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-primary-900">6. Limitation of Liability</h2>
              <div className="space-y-4 text-gray-600">
                <p><strong>No Guarantee of Outcomes:</strong> Immigration outcomes depend on government decisions beyond our control. We cannot guarantee visa approvals or specific results.</p>

                <p><strong>Liability Limits:</strong> Our liability is limited to the fees you have paid for our services. We are not liable for:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Indirect, consequential, or punitive damages</li>
                  <li>Loss of income or business opportunities</li>
                  <li>Travel or accommodation costs</li>
                  <li>Government fee refunds or processing delays</li>
                  <li>Changes in immigration laws or policies</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-primary-900">7. Confidentiality</h2>
              <div className="space-y-3 text-gray-600">
                <p>We maintain strict confidentiality of your personal information and will not disclose it except:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>To government authorities as required for your application</li>
                  <li>To authorized service providers assisting with your case</li>
                  <li>When required by law or court order</li>
                  <li>With your written consent</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-primary-900">8. Termination</h2>
              <div className="space-y-4 text-gray-600">
                <p>Either party may terminate our services:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>With written notice as specified in your service agreement</li>
                  <li>Immediately for breach of these terms</li>
                  <li>If continuing service becomes impracticable</li>
                </ul>
                <p>Upon termination, you remain responsible for fees accrued and we will transfer your file as appropriate.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-primary-900">9. Intellectual Property</h2>
              <div className="space-y-3 text-gray-600">
                <p>All content on our website and in our materials is protected by copyright and other intellectual property rights. You may not:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Copy, distribute, or modify our content without permission</li>
                  <li>Use our trademarks or branding</li>
                  <li>Reverse engineer our systems or software</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-primary-900">10. Dispute Resolution</h2>
              <div className="space-y-4 text-gray-600">
                <p>In case of disputes:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>We encourage direct communication to resolve issues</li>
                  <li>Formal complaints should be made in writing</li>
                  <li>Unresolved disputes may be subject to mediation</li>
                  <li>Legal proceedings are subject to the jurisdiction specified in your service agreement</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-primary-900">11. Professional Standards</h2>
              <div className="space-y-3 text-gray-600">
                <p>Our licensed immigration advisers are bound by professional codes of conduct. We maintain:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Current professional registrations and licenses</li>
                  <li>Professional indemnity insurance</li>
                  <li>Compliance with regulatory requirements</li>
                  <li>Continuing professional development</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-primary-900">12. Changes to Terms</h2>
              <div className="space-y-3 text-gray-600">
                <p>We may update these terms periodically. Significant changes will be communicated via email or our website. Continued use of our services after changes constitutes acceptance of updated terms.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-primary-900">13. Contact Information</h2>
              <div className="space-y-3 text-gray-600">
                <p>For questions about these terms or our services, contact us:</p>
                <div className="bg-gray-50 p-4 rounded-lg mt-4">
                  <p><strong>Email:</strong> legal@migrantifly.com</p>
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
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Migration Journey?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Contact us today for a free consultation and let's discuss your options.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
      </div>

      <Footer />
    </main>
  )
}