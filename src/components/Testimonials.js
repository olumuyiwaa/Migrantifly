"use client";
import { useState, useEffect, useRef } from "react";

export default function Testimonials() {
  const testimonials = [
    {
      text: "Migrantifly made the entire process smooth. I’m now studying in New Zealand!",
      author: "Chinaza O"
    },
    {
      text: "The team was so helpful and professional. Highly recommend Migrantifly!",
      author: "Charles O"
    },
    {
      text: "I got my visa approved quickly thanks to their expert guidance.",
      author: "Christie G"
    },
    {
      text: "From start to finish, Migrantifly exceeded my expectations.",
      author: "Alex M"
    },
    {
      text: "Their support team was always available. 5 stars!",
      author: "Damilola E"
    }
  ];

  const cardsToShow = 4;
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalSlides = Math.ceil(testimonials.length / cardsToShow);
  const sliderRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, 7000);
    return () => clearInterval(interval);
  }, [totalSlides]);

  const prev = () => {
    setCurrentIndex((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  };

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  return (
    <section className="py-20 bg-gray-50 overflow-hidden">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold mb-4">What Our Clients Are Saying</h2>
        </div>

        <div className="relative">
          {/* Slide Wrapper */}
          <div className="overflow-hidden">
            <div
              ref={sliderRef}
              className="flex transition-transform duration-700 ease-in-out"
              style={{
                transform: `translateX(-${currentIndex * (100 / cardsToShow)}%)`,
                width: `${(testimonials.length / cardsToShow) * 100}%`,
              }}
            >
              {testimonials.map((t, idx) => (
                <div
                  key={idx}
                  className="w-full px-4 md:w-1/3 flex-shrink-0"
                >
                  <div className="bg-yellow-300 rounded-[24px] p-8 shadow-lg h-full flex flex-col">
                    <div className="flex items-center mb-4">
                      <svg className="w-8 h-8 text-gold-500 mr-4" viewBox="0 0 24 24">
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-10zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                      </svg>
                      <span className="flex-1 border-t border-black opacity-40 ml-2"></span>
                    </div>
                    <p className="text-black text-lg mb-6 text-center">{t.text}</p>
                    <div className="flex items-center mt-auto">
                      <div className="w-14 h-14 bg-gray-300 rounded-full mr-4"></div>
                      <span className="font-bold text-black text-lg">{t.author}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-6">
            <button onClick={prev} className="px-4 py-2 bg-yellow-500 rounded-full text-white hover:bg-yellow-600">
              ‹
            </button>
            <div className="flex space-x-2">
              {Array.from({ length: totalSlides }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-3 h-3 rounded-full ${currentIndex === idx ? "bg-yellow-600" : "bg-gray-300"}`}
                />
              ))}
            </div>
            <button onClick={next} className="px-4 py-2 bg-yellow-500 rounded-full text-white hover:bg-yellow-600">
              ›
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
