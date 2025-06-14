export default function Testimonials() {
  const testimonials = [
    {
      text: "Migrantifly made my entire immigration process seamless. Their expertise and support were invaluable in securing my visa to New Zealand.",
      author: "Charles O"
    },
    {
      text: "I couldn't have asked for better guidance. The team was professional, knowledgeable, and always available when I needed help with my Australian visa.",
      author: "Christie G"
    },
    {
      text: "From start to finish, Migrantifly exceeded my expectations. They turned what seemed like an impossible dream into reality.",
      author: "Alex M"
    }
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">What Our Clients Are Saying</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-gold-100 rounded-lg p-8">
              <div className="mb-6">
                <svg className="w-8 h-8 text-gold-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-10zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                </svg>
              </div>
              <p className="text-gray-700 mb-6">{testimonial.text}</p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
                <span className="font-semibold">{testimonial.author}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}