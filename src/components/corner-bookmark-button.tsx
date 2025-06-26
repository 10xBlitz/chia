import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CornerBookmarkButtonProps {
  isActive: boolean;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
  ariaLabel?: string;
}

/**
 * A visually improved bookmark ribbon button for the top right corner.
 * 북마크 리본 버튼 (상단 우측, 더 현실적인 리본 모양)
 */
export default function CornerBookmarkButton({
  isActive,
  onClick,
  className = "",
  ariaLabel = "Bookmark this clinic",
}: CornerBookmarkButtonProps) {
  // Animation values for elongation (only the tail moves)
  const tailY = isActive ? 76 : 56;
  const tailMidY = isActive ? 72 : 48;

  const handleClick = (e: React.MouseEvent) => {
    onClick(e);
  };

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={cn(
        "absolute top-0 right-0 z-10 group focus:outline-none",
        className
      )}
      style={{ width: 44, height: 80 }}
      onClick={handleClick}
      tabIndex={0}
    >
      <svg
        width="44"
        height={80}
        viewBox="0 0 44 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-md"
      >
        {/* Animated bookmark shape: rounded top, pointed bottom */}
        <motion.path
          d={`M2 2 Q2 0 6 0 H38 Q42 0 42 2 V${tailY} L22 ${tailMidY} L2 ${tailY} Z`}
          fill={isActive ? "#3B82F6" : "#F1F5F9"}
          stroke="#1E293B"
          strokeWidth="1.5"
          animate={{
            d: `M2 2 Q2 0 6 0 H38 Q42 0 42 2 V${tailY} L22 ${tailMidY} L2 ${tailY} Z`,
          }}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
        />
        {/* Optional: top fold effect */}
        <path d="M2 2 Q2 0 6 0 H38 Q42 0 42 2" fill="#fff" fillOpacity={0.18} />
      </svg>
      <AnimatePresence>
        {!isActive && (
          <motion.span
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="absolute left-1/2 top-4 -translate-x-1/2 text-blue-500"
          >
            <Plus size={20} strokeWidth={2.2} />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
