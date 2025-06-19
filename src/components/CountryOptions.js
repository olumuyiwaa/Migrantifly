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
    name: "Canada",
    flag: "🇨🇦",
    description:
      "Explore Canada’s inclusive immigration system, with options like Express Entry, Provincial Nominee Programs (PNPs), and pathways for students, skilled workers, and family sponsorships.",
  },
  {
    name: "Australia",
    flag: "🇦🇺",
    description:
      "Learn about Australia’s diverse immigration streams, including skilled migration, employer sponsorship, student visas, and permanent residency for those seeking a new life Down Under.",
  },
  {
    name: "New Zealand",
    flag: "🇳🇿",
    description:
      "Discover New Zealand’s welcoming immigration options for skilled professionals, students, and families—offering a balanced lifestyle, natural beauty, and long-term residency pathways.",
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