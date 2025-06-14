export default function CountryOptions() {
  const countries = [
    { name: "USA", flag: "🇺🇸", description: "Explore opportunities in the United States" },
    { name: "UK", flag: "🇬🇧", description: "Discover pathways to the United Kingdom" },
    { name: "Brazil", flag: "🇧🇷", description: "Learn about Brazilian immigration options" },
    { name: "USA", flag: "🇺🇸", description: "Additional US immigration programs" },
    { name: "UK", flag: "🇬🇧", description: "More UK visa categories available" },
    { name: "Brazil", flag: "🇧🇷", description: "Extended Brazilian residence programs" }
  ]

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Immigration Choose Your Country</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {countries.map((country, index) => (
            <div key={index} className="bg-primary-600 text-white rounded-lg p-6 text-center hover:bg-primary-700 transition-colors cursor-pointer">
              <div className="text-4xl mb-4">{country.flag}</div>
              <h3 className="text-xl font-bold mb-2">{country.name}</h3>
              <p className="text-blue-100 text-sm">{country.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}