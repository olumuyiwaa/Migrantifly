"use client";
import { useState, useEffect, useRef } from "react";

export default function Testimonials() {
  const testimonials = [
    {
      text: "Migrantifly made the entire process smooth. I'm now studying in New Zealand!",
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

  // Responsive cards per view
  const getCardsToShow = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 640) return 1; // mobile
      if (window.innerWidth < 1024) return 2; // tablet
      return 3; // desktop
    }
    return 3;
  };

  const [cardsToShow, setCardsToShow] = useState(getCardsToShow);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const sliderRef = useRef(null);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);

  // Calculate total slides based on current cardsToShow
  const totalSlides = Math.max(1, testimonials.length - cardsToShow + 1);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const newCardsToShow = getCardsToShow();
      setCardsToShow(newCardsToShow);
      setCurrentIndex(0); // Reset to first slide on resize
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-slide functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = prev + 1;
        if (nextIndex >= totalSlides) {
          return 0;
        }
        return nextIndex;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [totalSlides, isAutoPlaying]);

  // Drag handlers
  const handleDragStart = (e) => {
    setIsDragging(true);
    setIsAutoPlaying(false); // Stop auto-play when dragging
    const clientX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
    setStartX(clientX);
    setCurrentX(clientX);

    // Prevent text selection during drag
    e.preventDefault();
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;

    const clientX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
    setCurrentX(clientX);
    const diff = clientX - startX;
    setDragOffset(diff);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;

    setIsDragging(false);
    const diff = currentX - startX;
    const threshold = 50; // Minimum drag distance to trigger slide change

    if (Math.abs(diff) > threshold) {
      if (diff > 0 && currentIndex > 0) {
        // Dragged right, go to previous slide
        setCurrentIndex(prev => prev - 1);
      } else if (diff < 0 && currentIndex < totalSlides - 1) {
        // Dragged left, go to next slide
        setCurrentIndex(prev => prev + 1);
      }
    }

    setDragOffset(0);

    // Resume auto-play after a delay
    setTimeout(() => {
      setIsAutoPlaying(true);
    }, 2000);
  };

  // Mouse event handlers
  useEffect(() => {
    const handleMouseMove = (e) => handleDragMove(e);
    const handleMouseUp = () => handleDragEnd();

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startX, currentX, currentIndex, totalSlides]);

  const prev = () => {
    setCurrentIndex((prev) => prev === 0 ? totalSlides - 1 : prev - 1);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 2000);
  };

  const next = () => {
    setCurrentIndex((prev) => prev >= totalSlides - 1 ? 0 : prev + 1);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 2000);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 2000);
  };

  // Calculate transform with drag offset
  const getTransform = () => {
    const baseTransform = -currentIndex * (100 / cardsToShow);
    const dragTransform = isDragging ? (dragOffset / sliderRef.current?.offsetWidth) * 100 : 0;
    return baseTransform + dragTransform;
  };

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 text-gray-900">
            What Our Clients Are Saying
          </h2>
        </div>

        <div className="relative">
          {/* Navigation Buttons */}
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 sm:-translate-x-6 z-10 w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200 flex items-center justify-center group"
            aria-label="Previous testimonials"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 sm:translate-x-6 z-10 w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200 flex items-center justify-center group"
            aria-label="Next testimonials"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Testimonials Container */}
          <div className="overflow-hidden rounded-2xl">
            <div
              ref={sliderRef}
              className={`flex ${isDragging ? '' : 'transition-transform duration-700 ease-in-out'} cursor-grab active:cursor-grabbing`}
              style={{
                transform: `translateX(${getTransform()}%)`,
                width: `${(testimonials.length / cardsToShow) * 100}%`,
              }}
              onMouseDown={handleDragStart}
              onTouchStart={handleDragStart}
              onTouchMove={handleDragMove}
              onTouchEnd={handleDragEnd}
            >
              {testimonials.map((testimonial, idx) => (
                <div
                  key={idx}
                  className="flex-shrink-0 px-2 sm:px-3 lg:px-4"
                  style={{ width: `${100 /cardsToShow}%` }}
                >
                  <div className="bg-yellow-300 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 h-full flex flex-col min-h-[280px] sm:min-h-[320px] select-none">
                    {/* Quote Icon and Divider */}
                    <div className="flex items-center mb-4 sm:mb-6">
                      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-700 mr-3 sm:mr-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-10zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                      </svg>
                      <span className="flex-1 border-t border-gray-700 opacity-40"></span>
                    </div>

                    {/* Testimonial Text */}
                    <p className="text-black text-lg mb-6">{t.text}</p>
                    <div className="flex items-center mt-auto">
                      <div className="w-14 h-14 bg-gray-300 rounded-full mr-4"></div>
                      <span className="font-bold text-black text-lg">{t.author}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center mt-6 sm:mt-8 space-x-2">
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToSlide(idx)}
                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-colors duration-200 ${
                  idx === currentIndex ? 'bg-yellow-500' : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}