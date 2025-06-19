export default function CountryOptions() {
  const countries = [
    {
      name: "USA",
      flag: "🇺🇸",
      description:
        "Explore a wide range of immigration opportunities in the United States, including work, study, and family-based visa programs designed for professionals, students, and families seeking a better future.",
    },
    {
      name: "UK",
      flag: "🇬🇧",
      description:
        "Discover multiple immigration pathways to the United Kingdom, from skilled worker visas to student routes and permanent settlement options for those looking to live, work, or study in the UK.",
    },
    {
      name: "Brazil",
      flag: "🇧🇷",
      description:
        "Learn about Brazil’s growing immigration programs, offering residency options for remote workers, entrepreneurs, and investors interested in experiencing life in South America’s largest economy.",
    },
    {
      name: "USA",
      flag: "🇺🇸",
      description:
        "Access detailed insights into specialized U.S. immigration programs, including diversity visas, employment-based green cards, and business visas for innovators and investors.",
    },
    {
      name: "UK",
      flag: "🇬🇧",
      description:
        "Explore the expanding categories of UK visas, such as the Global Talent Visa, Start-up Visa, and Health & Care Worker Visa, designed to attract skilled individuals from around the world.",
    },
    {
      name: "Brazil",
      flag: "🇧🇷",
      description:
        "Discover Brazil’s extended residence and citizenship options, including pathways for digital nomads, retirees, and those with family or business ties to the country.",
    },
  ];


  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Immigration Choose Your Country</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {countries.map((country, index) => (
             <div
                          key={index}
                          className="bg-[#00094B] text-white rounded-xl p-6 flex items-start space-x-4 hover:shadow-lg transition-all cursor-pointer"
                        >
                          <div className="text-3xl">{country.flag}</div>

                          <div>
                            <h3 className="text-lg font-semibold mb-1">{country.name}</h3>
                            <p className="text-sm text-blue-100 leading-relaxed">
                              {country.description}
                            </p>
                          </div>
                        </div>
          ))}
        </div>
      </div>
    </section>
  )
}