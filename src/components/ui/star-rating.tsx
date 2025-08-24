import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  showCount?: boolean;
  count?: number;
  className?: string;
}

export function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  showValue = false,
  showCount = false,
  count,
  className = ''
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center">
        {Array.from({ length: maxRating }, (_, i) => {
          const starRating = i + 1;
          const isFilled = starRating <= rating;
          const isPartial = starRating - 0.5 <= rating && starRating > rating;

          return (
            <Star
              key={i}
              className={`${sizeClasses[size]} ${
                isFilled
                  ? 'text-yellow-400 fill-yellow-400'
                  : isPartial
                  ? 'text-yellow-400 fill-yellow-400/50'
                  : 'text-muted-foreground/30'
              }`}
            />
          );
        })}
      </div>
      
      {showValue && (
        <span className={`font-medium text-foreground ${textSizeClasses[size]}`}>
          {rating.toFixed(1)}
        </span>
      )}
      
      {showCount && count && (
        <span className={`text-muted-foreground ${textSizeClasses[size]}`}>
          ({count.toLocaleString()})
        </span>
      )}
    </div>
  );
}