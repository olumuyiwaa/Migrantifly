"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { contentApi } from "@/lib/api";

export default function ImmigrationServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    contentApi.services()
        .then((res) => {
          if (!cancelled) setServices(res?.data || []);
        })
        .catch(() => {
          if (!cancelled) setServices([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    return () => { cancelled = true; };
  }, []);

  if (!loading && services.length === 0) return null;

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
          {loading ? (
              <div className="space-y-6">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="border-2 rounded-2xl p-6 animate-pulse">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-slate-200 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <div className="h-5 bg-slate-200 rounded w-1/3" />
                          <div className="h-4 bg-slate-200 rounded w-2/3" />
                        </div>
                      </div>
                    </div>
                ))}
              </div>
          ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service) => (
                    <div key={service.slug || index} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group hover:-translate-y-2">
                        <div className="p-8">
                            <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">
                                {service.icon || '📋'}
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">{service.title}</h3>
                            <p className="text-gray-600 mb-6 leading-relaxed">{service.description || service.excerpt}</p>

                            {service.features && service.features.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="font-semibold text-gray-900 mb-3">What's Included:</h4>
                                    <ul className="space-y-2">
                                        {service.features.slice(0, 5).map((feature, idx) => (
                                            <li key={idx} className="flex items-center text-gray-700">
                                                <div className="w-2 h-2 bg-blue-600 rounded-full mr-3 flex-shrink-0"></div>
                                                <span className="text-sm">{feature}</span>
                                            </li>
                                        ))}
                                        {service.features.length > 5 && (
                                            <li className="text-sm text-blue-600 font-medium">
                                                + {service.features.length - 5} more services
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            )}

                            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                                {service.processingTime && (
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-700">Processing Time:</span>
                                        <span className="text-sm font-bold text-blue-600">{service.processingTime}</span>
                                    </div>
                                )}
                                {service.countries && service.countries.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {service.countries.slice(0, 3).map((country, idx) => (
                                            <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {country}
                            </span>
                                        ))}
                                        {service.countries.length > 3 && (
                                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              +{service.countries.length - 3} more
                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            <Link
                                href={`/services/${service.slug}`}
                                className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-center px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
                            >
                                Learn More
                            </Link>
                        </div>
                    </div>
                ))}
              </div>
          )}
        </div>
      </section>
  );
}