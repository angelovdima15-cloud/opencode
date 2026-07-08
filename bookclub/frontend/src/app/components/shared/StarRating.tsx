import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  size?: number;
  showValue?: boolean;
}

export function StarRating({ rating, size = 14, showValue = true }: StarRatingProps) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          fill={i <= Math.round(rating) ? "#F59E0B" : "transparent"}
          color={i <= Math.round(rating) ? "#F59E0B" : "#8888AA"}
        />
      ))}
      {showValue && (
        <span className="text-[#F59E0B] text-xs ml-1 font-semibold">{rating.toFixed(1)}</span>
      )}
    </div>
  );
}
