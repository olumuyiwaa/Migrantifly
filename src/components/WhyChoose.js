export default function WhyChoose() {
  const features = [
    {
      title: "Full Journey Support",
      description: "From initial consultation to settling in your new country",
      icon: "/images/features/journey.png"
    },
    {
      title: "Legal Expertise",
      description: "Licensed immigration lawyers and consultants",
      icon: "/images/features/legal.png"
    },
    {
      title: "Safe & Secure Platform",
      description: "Your documents and data are protected with bank-level security",
      icon: "/images/features/secure.png"
    },
    {
      title: "24/7 Client Support",
      description: "Round-the-clock assistance whenever you need help",
      icon: "/images/features/support.png"
    }
  ];

  return (
    <section className="bg-[#08076A] py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Why Choose Migrantifly?
          </h2>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center text-white">
              <div className="w-[224px] h-[224px] bg-yellow-400 rounded-full mx-auto mb-6 flex items-center justify-center overflow-hidden">
                <img
                  src={feature.icon}
                  alt={feature.title}
                  className="w-[120px] h-[120px] object-contain"
                />
              </div>
              <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
              <p className="text-blue-100">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
