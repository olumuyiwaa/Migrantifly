import React from "react";

const services = [
  {
    title: "Provision of Student Visas",
    description: "Study abroad with guidance from start to finish.",
  },
  {
    title: "Family & Partner Visas",
    description: "Reunite and build your future together.",
  },
  {
    title: "Skilled Worker Visas",
    description: "Navigate work pathways in high-demand industries.",
  },
  {
    title: "Settlement & Post-Arrival Support",
    description: "Study abroad with guidance from start to finish.",
  },
];

export default function Services() {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Explore Our Services</h2>
          <p className="text-lg text-gray-700">
            We Offer More Than Just Visa Help
          </p>
        </div>
        {/* Services Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {services.map((service, idx) => {
            const isEven = idx % 2 === 0;
            return (
              <div
                key={idx}
                className="flex items-center bg-white rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.18)] p-8 min-h-[200px]"
              >
                {!isEven && (
                  <div className="mr-6 flex-shrink-0">
                    <svg width="160" height="80" viewBox="0 0 160 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="0" y="0" width="70" height="80" rx="40" fill="#0B0C5A"/>
                      <rect x="90" y="0" width="70" height="80" rx="40" fill="#0B0C5A"/>
                      <circle cx="70" cy="40" r="24" fill="#E2C178"/>
                      <circle cx="90" cy="40" r="24" fill="#E2C178"/>
                    </svg>
                  </div>
                )}
                {/* Text */}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2 text-black leading-tight">
                    {service.title}
                  </h3>
                  <p className="text-gray-700 mb-6">{service.description}</p>
                  <button className="font-bold text-black hover:underline tracking-tight">
                    LEARN MORE
                  </button>
                </div>
                {isEven && (
                  <div className="ml-6 flex-shrink-0">
                    <svg width="160" height="80" viewBox="0 0 160 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="0" y="0" width="70" height="80" rx="40" fill="#0B0C5A"/>
                      <rect x="90" y="0" width="70" height="80" rx="40" fill="#0B0C5A"/>
                      <circle cx="70" cy="40" r="24" fill="#E2C178"/>
                      <circle cx="90" cy="40" r="24" fill="#E2C178"/>
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}