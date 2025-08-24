import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Button } from './button';
import { Card } from './card';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  avatar: string;
}

interface TestimonialSliderProps {
  testimonials: Testimonial[];
  autoPlay?: boolean;
  interval?: number;
}

export function TestimonialSlider({ 
  testimonials, 
  autoPlay = true, 
  interval = 5000 
}: TestimonialSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!autoPlay || testimonials.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, testimonials.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? testimonials.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  if (!testimonials.length) return null;

  const currentTestimonial = testimonials[currentIndex];

  return (
    <div className="relative">
      <Card className="p-8 bg-card/50 backdrop-blur-sm border-border/50">
        <div className="flex items-start gap-4">
          <img
            src={currentTestimonial.avatar}
            alt={`${currentTestimonial.name} profile picture`}
            className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
            loading="lazy"
            decoding="async"
          />
          <div className="flex-1">
            <div className="flex items-center gap-1 mb-3">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < currentTestimonial.rating
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
            <blockquote className="text-lg text-foreground mb-4 leading-relaxed">
              "{currentTestimonial.content}"
            </blockquote>
            <div>
              <cite className="font-semibold text-foreground not-italic">
                {currentTestimonial.name}
              </cite>
              <p className="text-sm text-muted-foreground">
                {currentTestimonial.role} at {currentTestimonial.company}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {testimonials.length > 1 && (
        <>
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevious}
              className="rounded-full w-10 h-10 p-0"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex
                      ? 'bg-primary'
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={goToNext}
              className="rounded-full w-10 h-10 p-0"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}