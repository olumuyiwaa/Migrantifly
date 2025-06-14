export default function MigrationProcess() {
  const steps = [
    {
      step: "STEP 1",
      title: "Book a Consultation",
      description: "Schedule your initial assessment with our experts"
    },
    {
      step: "STEP 2",
      title: "Full Journey Support",
      description: "Get comprehensive guidance through every phase"
    },
    {
      step: "STEP 3",
      title: "Let Us Handle the Process",
      description: "We manage all paperwork and applications for you"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Your Migration Made Simple</h2>
          <p className="text-xl text-gray-600">Our process in 3 easy steps</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-center">
          {/* Left Circles */}
          <div className="relative w-full h-[500px]">
            {/* Big circle */}
            <div className="absolute w-[424px] h-[424px] bg-[#D9D9D9] rounded-full left-0 top-0 z-0">
              <img
                src=""
                alt=""
                className="w-full h-full object-contain rounded-full"
              />
            </div>

            {/* Small circle */}
            <div className="absolute w-[224px] h-[224px] bg-[#B3B3B3] rounded-full left-64 top-64 z-10">
              <img
                src=""
                alt=""
                className="w-full h-full object-contain rounded-full"
              />
            </div>
          </div>


          {/* Vertical Stepper */}
          <div className="flex flex-col items-center relative">
            {steps.map((_, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg border-4 border-white shadow-lg z-10">
                  {`0${index + 1}`}
                </div>
                {index < steps.length - 1 && (
                  <div className="h-16 border-l-2 border-dashed border-blue-600"></div>
                )}
              </div>
            ))}
          </div>

          {/* Text Descriptions */}
          <div className="space-y-12">
            {steps.map((step, index) => (
              <div key={index}>
                <span className="text-blue-600 font-semibold text-sm">{step.step}</span>
                <h3 className="text-xl font-bold mt-2 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
