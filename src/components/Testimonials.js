"use client";
import { useState, useEffect, useRef } from "react";

export default function Testimonials() {
  const testimonials = [
    { text: "Migrantifly made the entire process smooth. I'm now studying in New Zealand!", author: "Chinaza O" },
    { text: "The team was so helpful and professional. Highly recommend Migrantifly!", author: "Charles O" },
    { text: "I got my visa approved quickly thanks to their expert guidance.", author: "Christie G" },
    { text: "From start to finish, Migrantifly exceeded my expectations.", author: "Alex M" },
    { text: "Their support team was always available. 5 stars!", author: "Damilola E" }
  ];

  const sliderRef = useRef(null);

  const [cardsToShow, setCardsToShow] = useState(3);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);

  const totalSlides = testimonials.length;

  // Handle responsive layout
  useEffect(() => {
    const updateCardsToShow = () => {
      const width = window.innerWidth;
      if (width < 640) return setCardsToShow(1);
      if (width < 1024) return setCardsToShow(2);
      return setCardsToShow(3);
    };
    updateCardsToShow();
    window.addEventListener("resize", updateCardsToShow);
    return () => window.removeEventListener("resize", updateCardsToShow);
  }, []);

  // Autoplay
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % totalSlides);
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, totalSlides]);

  // Drag logic
  const handleDragStart = (e) => {
    setIsDragging(true);
    setIsAutoPlaying(false);
    const clientX = e.type === "mousedown" ? e.clientX : e.touches[0].clientX;
    setStartX(clientX);
    setCurrentX(clientX);
    e.preventDefault();
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;
    const clientX = e.type === "mousemove" ? e.clientX : e.touches[0].clientX;
    setCurrentX(clientX);
    setDragOffset(clientX - startX);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    const diff = currentX - startX;
    const threshold = 50;
    if (diff > threshold && currentIndex > 0) setCurrentIndex(prev => prev - 1);
    else if (diff < -threshold && currentIndex < totalSlides - 1) setCurrentIndex(prev => prev + 1);
    setIsDragging(false);
    setDragOffset(0);
    setTimeout(() => setIsAutoPlaying(true), 2000);
  };

  useEffect(() => {
    const handleMouseMove = (e) => handleDragMove(e);
    const handleMouseUp = () => handleDragEnd();

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, startX, currentX]);

  // Manual controls
  const prev = () => {
    setCurrentIndex(prev => (prev === 0 ? totalSlides - 1 : prev - 1));
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 2000);
  };

  const next = () => {
    setCurrentIndex(prev => (prev + 1) % totalSlides);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 2000);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 2000);
  };

  const getTransform = () => {
    const base = -currentIndex * (100 / cardsToShow);
    const dragPercent = isDragging && sliderRef.current
      ? (dragOffset / sliderRef.current.offsetWidth) * 100
      : 0;
    return base + dragPercent;
  };

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">What Our Clients Are Saying</h2>
        </div>

        <div className="relative">
          {/* Navigation */}
          <button onClick={prev} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow flex items-center justify-center group">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 group-hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button onClick={next} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow flex items-center justify-center group">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 group-hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Slider */}
          <div className="overflow-hidden rounded-2xl">
            <div
              ref={sliderRef}
              className={`flex ${isDragging ? '' : 'transition-transform duration-700 ease-in-out'} cursor-grab active:cursor-grabbing`}
              style={{
                transform: `translateX(${getTransform()}%)`,
                width: `${100}%`,
              }}
              onMouseDown={handleDragStart}
              onTouchStart={handleDragStart}
              onTouchMove={handleDragMove}
              onTouchEnd={handleDragEnd}
            >
              {testimonials.map((t, idx) => (
                <div
                  key={idx}
                  className="flex-shrink-0 px-2 sm:px-3 lg:px-4"
                  style={{ width: `${100 / cardsToShow}%` }}
                >
                  <div className="bg-yellow-300 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg h-full flex flex-col min-h-[280px] sm:min-h-[320px] select-none">
                    <div className="flex items-center mb-4 sm:mb-6">
                      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-700 mr-3 sm:mr-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-10zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z" />
                      </svg>
                      <span className="flex-1 border-t border-gray-700 opacity-40"></span>
                    </div>
                    <p className="text-gray-900 text-base sm:text-lg leading-relaxed mb-6 sm:mb-8 text-center flex-grow">"{t.text}"</p>
                    <div className="flex items-center mt-auto">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-400 rounded-full mr-3 sm:mr-4"></div>
                      <span className="font-bold text-gray-900 text-base sm:text-lg">{t.author}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots */}
          <div className="flex justify-center mt-6 sm:mt-8 space-x-2">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToSlide(idx)}
                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-colors duration-200 ${idx === currentIndex ? "bg-yellow-500" : "bg-gray-300 hover:bg-gray-400"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
