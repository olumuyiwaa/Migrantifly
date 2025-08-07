"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight, Users, Briefcase, Heart, MapPin, FileCheck } from "lucide-react";

const serviceCategories = [
  {
    id: "visa-advice",
    title: "Visa Advice and Application Services",
    icon: <FileCheck className="w-6 h-6" />,
    description: "Complete visa guidance from application to approval",
    color: "bg-blue-50 border-blue-200",
    iconColor: "text-blue-600",
    services: [
      {
        category: "Temporary Visas",
        items: [
          "Student visa advice and applications",
          "Visitor visa advice and applications",
          "Work visa applications"
        ]
      },
      {
        category: "Resident Visas",
        items: [
          "Skilled Migrant Category (SMC)",
          "Residence from Work",
          "Partner or family-sponsored residency",
          "Investor and Entrepreneur categories"
        ]
      },
      {
        category: "Visa Extensions and Variations",
        items: [
          "Extending current visas",
          "Varying conditions (change of employer, location, job title)"
        ]
      }
    ]
  },
  {
    id: "employer-services",
    title: "Employer Services (Business Immigration Support)",
    icon: <Briefcase className="w-6 h-6" />,
    description: "Supporting businesses with immigration compliance and staff visas",
    color: "bg-green-50 border-green-200",
    iconColor: "text-green-600",
    services: [
      {
        category: "Business Support",
        items: [
          "Supporting employer accreditation under the AEWV scheme",
          "Job check applications",
          "Labour market testing advice",
          "Work visa support for staff",
          "Immigration audits and compliance planning"
        ]
      }
    ]
  },
  {
    id: "family-partnership",
    title: "Family and Partnership Support",
    icon: <Heart className="w-6 h-6" />,
    description: "Guidance for family reunification and relationships",
    color: "bg-pink-50 border-pink-200",
    iconColor: "text-pink-600",
    services: [
      {
        category: "Family Reunification",
        items: [
          "Partner and spouse visa applications",
          "Parent residence visa advice",
          "Dependent children's visas",
          "Relationship evidence assessment and coaching"
        ]
      }
    ]
  },
  {
    id: "immigration-strategy",
    title: "Immigration Strategy and Settlement Planning",
    icon: <MapPin className="w-6 h-6" />,
    description: "Long-term planning for your immigration journey",
    color: "bg-purple-50 border-purple-200",
    iconColor: "text-purple-600",
    services: [
      {
        category: "Strategic Planning",
        items: [
          "Long-term immigration planning",
          "Pathways to residency and citizenship",
          "Advising students and graduates on post-study work/residency options",
          "Settlement support referrals (housing, schooling, health)"
        ]
      }
    ]
  },
  {
    id: "other-services",
    title: "Additional Support Services",
    icon: <Users className="w-6 h-6" />,
    description: "Comprehensive support for all your immigration needs",
    color: "bg-amber-50 border-amber-200",
    iconColor: "text-amber-600",
    services: [
      {
        category: "Administrative Support",
        items: [
          "Updating Immigration New Zealand on changes (address, employment)",
          "Immigration document checks and second opinions",
          "Assistance with English language requirements (IELTS, TOEFL, PTE)",
          "Skill assessments support (NZQA)",
          "Visa Checker services"
        ]
      }
    ]
  }
];

export default function ImmigrationServices() {
  const [expandedService, setExpandedService] = useState(null);

  const toggleService = (serviceId) => {
    setExpandedService(expandedService === serviceId ? null : serviceId);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Explore Our Services
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Comprehensive immigration solutions tailored to your unique journey. From visa applications to settlement planning, we're with you every step of the way.
          </p>
        </div>

        {/* Services Grid */}
        <div className="space-y-6">
          {serviceCategories.map((service) => (
            <div
              key={service.id}
              className={`${service.color} border-2 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg`}
            >
              {/* Service Header */}
              <div
                className="p-6 cursor-pointer"
                onClick={() => toggleService(service.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`${service.iconColor} bg-white p-3 rounded-lg shadow-sm`}>
                      {service.icon}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">
                        {service.title}
                      </h3>
                      <p className="text-gray-600">
                        {service.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button className="bg-gray-900 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-800 transition-colors">
                      Learn More
                    </button>
                    {expandedService === service.id ? (
                      <ChevronDown className="w-6 h-6 text-gray-600" />
                    ) : (
                      <ChevronRight className="w-6 h-6 text-gray-600" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedService === service.id && (
                <div className="px-6 pb-6">
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    {service.services.map((category, idx) => (
                      <div key={idx} className={idx > 0 ? "mt-6" : ""}>
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">
                          {category.category}
                        </h4>
                        <div className="grid md:grid-cols-2 gap-3">
                          {category.items.map((item, itemIdx) => (
                            <div
                              key={itemIdx}
                              className="flex items-start space-x-2"
                            >
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                              <span className="text-gray-700">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}