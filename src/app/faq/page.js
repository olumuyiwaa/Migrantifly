// src/app/faq/page.js
'use client'
import Link from 'next/link'

import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { useState } from 'react'

export default function FAQ() {
  const [openItems, setOpenItems] = useState({})

  const toggleItem = (index) => {
    setOpenItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const faqData = [
    {
      category: "General Questions",
      questions: [
        {
          question: "What countries does Migrantifly help with migration to?",
          answer: "We specialize in migration to New Zealand, Australia, Fiji, and other Pacific nations. Our team has extensive local knowledge and experience in these regions' immigration processes."
        },
        {
          question: "How long does the migration process typically take?",
          answer: "The timeline varies depending on the destination country, visa type, and individual circumstances. Generally, it can range from 6 months to 2 years. We provide realistic timelines during your initial consultation."
        },
        {
          question: "Do you offer services in languages other than English?",
          answer: "Yes, our multilingual team can assist you in various languages. Please contact us to confirm availability for your preferred language."
        }
      ]
    },
    {
      category: "Visa & Documentation",
      questions: [
        {
          question: "What documents do I need for my visa application?",
          answer: "Required documents vary by visa type and destination country. Common requirements include passport, educational certificates, work experience letters, medical examinations, and financial statements. We provide a comprehensive checklist tailored to your specific case."
        },
        {
          question: "Can you help with document translation and certification?",
          answer: "Yes, we can assist with document translation and certification through our network of certified translators and notaries. This ensures all your documents meet the immigration authorities' requirements."
        },
        {
          question: "What happens if my visa application is rejected?",
          answer: "If your application is rejected, we'll review the reasons and advise on next steps. This may include appealing the decision, reapplying with additional documentation, or exploring alternative visa pathways."
        }
      ]
    },
    {
      category: "Services & Pricing",
      questions: [
        {
          question: "What is included in your migration services?",
          answer: "Our comprehensive services include visa assessment, application preparation, document review, submission tracking, settlement planning, and post-arrival support. We provide end-to-end assistance throughout your migration journey."
        },
        {
          question: "Do you offer a free initial consultation?",
          answer: "Yes, we offer a free initial assessment to evaluate your eligibility and discuss your migration options. This helps you understand the process and our services before making any commitments."
        },
        {
          question: "How are your fees structured?",
          answer: "Our fees are transparent and competitive, structured based on the complexity of your case and services required. We provide detailed fee schedules upfront with no hidden costs."
        }
      ]
    },
    {
      category: "Settlement Support",
      questions: [
        {
          question: "Do you provide support after I arrive in my new country?",
          answer: "Yes, we offer comprehensive settlement support including assistance with bank account opening, school enrollment, job search guidance, and connecting with local communities to help you integrate smoothly."
        },
        {
          question: "Can you help with finding accommodation?",
          answer: "We provide guidance on accommodation options and can connect you with trusted real estate agents and temporary accommodation providers in your destination city."
        },
        {
          question: "Do you assist with job placement?",
          answer: "While we don't guarantee job placement, we provide career guidance, resume preparation assistance, interview coaching, and connections with recruitment agencies in your field."
        }
      ]
    }
  ]

  return (
    <main>
      <Header />
      <div
        className="relative bg-slate-800 py-20 bg-cover bg-center min-h-[55vh]"
        style={{ backgroundImage: 'url("/images/bg.png")' }}
      >
        <div className="relative z-10 text-center text-white items-center pt-24">
          <h1 className="text-5xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-xl max-w-2xl mx-auto px-4">
            Find answers to common questions about our migration services
          </p>
        </div>
      </div>

      <div className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {faqData.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-primary-900">{category.category}</h2>
              <div className="space-y-4">
                {category.questions.map((item, questionIndex) => {
                  const itemIndex = `${categoryIndex}-${questionIndex}`
                  return (
                    <div key={itemIndex} className="border border-gray-200 rounded-lg">
                      <button
                        className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                        onClick={() => toggleItem(itemIndex)}
                      >
                        <span className="font-semibold text-gray-900">{item.question}</span>
                        <span className={`transform transition-transform ${openItems[itemIndex] ? 'rotate-180' : ''}`}>
                          ▼
                        </span>
                      </button>
                      {openItems[itemIndex] && (
                        <div className="px-6 pb-4">
                          <p className="text-gray-600 leading-relaxed">{item.answer}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-primary-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Still Have Questions?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Can't find what you're looking for? Our migration specialists are here to help.
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
                Check Services
              </Link>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}