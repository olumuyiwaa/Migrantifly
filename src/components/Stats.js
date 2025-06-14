export default function Stats() {
  const stats = [
    { number: "5k+", label: "Successful Applications" },
    { number: "10k+", label: "Happy Clients" },
    { number: "25+", label: "Countries Supported" },
    { number: "80+", label: "Expert Consultants" }
  ]

  return (
    <section className="bg-primary-600 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 text-center text-white">
          {stats.map((stat, index) => (
            <div key={index}>
              <div className="text-4xl font-bold mb-2">{stat.number}</div>
              <div className="text-blue-100">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
