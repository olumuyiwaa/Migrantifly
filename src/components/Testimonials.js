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

  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsToShow, setCardsToShow] = useState(1);

  const sliderRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setCardsToShow(3);
      } else if (window.innerWidth >= 640) {
        setCardsToShow(2);
      } else {
        setCardsToShow(1);
      }
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.ceil(testimonials.length / cardsToShow));
    }, 7000);
    return () => clearInterval(interval);
  }, [cardsToShow]);

  const totalWidth = testimonials.length * (100 / cardsToShow);

  return (
    <section className="py-20 bg-gray-50">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold mb-4">What Our Clients Are Saying</h2>
        </div>

        <div className="relative overflow-hidden">
          <div
            ref={sliderRef}
            className="flex transition-transform duration-700 ease-in-out"
            style={{
              width: `${totalWidth}%`,
              transform: `translateX(-${(100 / testimonials.length) * currentIndex * cardsToShow}%)`,
            }}
          >
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className={`px-4 flex-shrink-0 w-full sm:w-1/2 lg:w-1/3`}
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
      </div>
    </section>
  );
}
