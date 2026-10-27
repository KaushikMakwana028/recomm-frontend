import React, { useState, useEffect, useRef } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const DEFAULT_FALLBACK =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=700";

const HeroSlider = ({ slides = [], fallbackImg = DEFAULT_FALLBACK }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // Normalize slide list to ensure valid data
  const validSlides =
    Array.isArray(slides) && slides.length > 0
      ? slides
      : [{ id: "default", image_url: fallbackImg, title: "Fresh Food" }];

  const total = validSlides.length;

  // Auto-play interval
  useEffect(() => {
    if (total <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, 4500);

    return () => clearInterval(timer);
  }, [total, isPaused]);

  // Reset index if slides list changes
  useEffect(() => {
    if (currentIndex >= total) {
      setCurrentIndex(0);
    }
  }, [total, currentIndex]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const handleDotClick = (index) => {
    setCurrentIndex(index);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      handleNext();
    } else if (distance < -minSwipeDistance) {
      handlePrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div
      className="hero-slider-container position-relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        borderRadius: "18px",
        overflow: "hidden",
        boxShadow: "0 20px 44px rgba(0, 0, 0, 0.35)",
        aspectRatio: "4 / 3",
        background: "#031527",
      }}
    >
      {/* Slides */}
      {validSlides.map((slide, index) => {
        const isActive = index === currentIndex;
        return (
          <div
            key={slide.id || index}
            className="hero-slide-item position-absolute top-0 start-0 w-100 h-100"
            style={{
              opacity: isActive ? 1 : 0,
              transform: isActive ? "scale(1)" : "scale(1.04)",
              transition: "opacity 0.8s ease-in-out, transform 0.8s ease-out",
              pointerEvents: isActive ? "auto" : "none",
              zIndex: isActive ? 2 : 1,
            }}
          >
            <img
              src={slide.image_url || fallbackImg}
              alt={slide.title || "Hero banner"}
              className="w-100 h-100"
              style={{
                objectFit: "cover",
                display: "block",
              }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = fallbackImg;
              }}
            />
            {slide.title && (
              <div
                className="position-absolute bottom-0 start-0 w-100 p-3 text-white"
                style={{
                  background:
                    "linear-gradient(180deg, transparent 0%, rgba(0, 32, 78, 0.75) 100%)",
                  pointerEvents: "none",
                }}
              >
                <span
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                    textShadow: "0 2px 4px rgba(0,0,0,0.6)",
                  }}
                >
                  {slide.title}
                </span>
              </div>
            )}
          </div>
        );
      })}

      {/* Navigation Arrows (Only shown when > 1 slide) */}
      {total > 1 && (
        <>
          <button
            type="button"
            className="hero-slider-arrow hero-slider-prev position-absolute start-0 top-50 translate-middle-y btn"
            onClick={handlePrev}
            aria-label="Previous Slide"
            style={{
              marginLeft: "12px",
              zIndex: 10,
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "rgba(0, 32, 78, 0.65)",
              backdropFilter: "blur(4px)",
              color: "#fff",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <FaChevronLeft size={16} />
          </button>

          <button
            type="button"
            className="hero-slider-arrow hero-slider-next position-absolute end-0 top-50 translate-middle-y btn"
            onClick={handleNext}
            aria-label="Next Slide"
            style={{
              marginRight: "12px",
              zIndex: 10,
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "rgba(0, 32, 78, 0.65)",
              backdropFilter: "blur(4px)",
              color: "#fff",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <FaChevronRight size={16} />
          </button>

          {/* Dots Indicator */}
          <div
            className="hero-slider-dots position-absolute bottom-0 start-50 translate-middle-x d-flex gap-2"
            style={{
              marginBottom: "14px",
              zIndex: 10,
              background: "rgba(0, 20, 48, 0.45)",
              backdropFilter: "blur(6px)",
              padding: "5px 10px",
              borderRadius: "20px",
            }}
          >
            {validSlides.map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                onClick={() => handleDotClick(dotIdx)}
                aria-label={`Go to slide ${dotIdx + 1}`}
                style={{
                  width: dotIdx === currentIndex ? "24px" : "8px",
                  height: "8px",
                  borderRadius: "4px",
                  border: "none",
                  padding: 0,
                  background:
                    dotIdx === currentIndex ? "#34A129" : "rgba(255, 255, 255, 0.5)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default HeroSlider;
