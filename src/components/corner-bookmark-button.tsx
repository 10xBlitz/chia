import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

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
  const controls = useAnimation();
  const prevActive = useRef(isActive);

  // Default, bounce, and elongated positions (reduced height, narrower width)
  const BOOKMARK_WIDTH = 38;
  const TAIL_NORMAL = { tailY: 48, tailMidY: 40 };
  const TAIL_BOUNCE = { tailY: 43, tailMidY: 35 }; // Retract
  const TAIL_ELONGATED = { tailY: 62, tailMidY: 58 };

  // Animate bounce on activation
  useEffect(() => {
    if (!prevActive.current && isActive) {
      // Only bounce when going from inactive to active
      controls.set({
        d: `M2 2 Q2 0 6 0 H${BOOKMARK_WIDTH - 6} Q${BOOKMARK_WIDTH - 2} 0 ${
          BOOKMARK_WIDTH - 2
        } 2 V${TAIL_NORMAL.tailY} L${BOOKMARK_WIDTH / 2} ${
          TAIL_NORMAL.tailMidY
        } L2 ${TAIL_NORMAL.tailY} Z`,
      });
      controls
        .start({
          d: `M2 2 Q2 0 6 0 H${BOOKMARK_WIDTH - 6} Q${BOOKMARK_WIDTH - 2} 0 ${
            BOOKMARK_WIDTH - 2
          } 2 V${TAIL_BOUNCE.tailY} L${BOOKMARK_WIDTH / 2} ${
            TAIL_BOUNCE.tailMidY
          } L2 ${TAIL_BOUNCE.tailY} Z`,
          transition: { duration: 0.12, ease: "easeIn" },
        })
        .then(() =>
          controls.start({
            d: `M2 2 Q2 0 6 0 H${BOOKMARK_WIDTH - 6} Q${BOOKMARK_WIDTH - 2} 0 ${
              BOOKMARK_WIDTH - 2
            } 2 V${TAIL_ELONGATED.tailY} L${BOOKMARK_WIDTH / 2} ${
              TAIL_ELONGATED.tailMidY
            } L2 ${TAIL_ELONGATED.tailY} Z`,
            transition: { type: "spring", stiffness: 200, damping: 22 },
          })
        );
    } else if (prevActive.current && !isActive) {
      // Animate back to normal when going from active to inactive
      controls.start({
        d: `M2 2 Q2 0 6 0 H${BOOKMARK_WIDTH - 6} Q${BOOKMARK_WIDTH - 2} 0 ${
          BOOKMARK_WIDTH - 2
        } 2 V${TAIL_NORMAL.tailY} L${BOOKMARK_WIDTH / 2} ${
          TAIL_NORMAL.tailMidY
        } L2 ${TAIL_NORMAL.tailY} Z`,
        transition: { type: "spring", stiffness: 200, damping: 22 },
      });
    }
    prevActive.current = isActive;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  // For normal rendering (no bounce), pick the right tail
  const tailY = isActive ? TAIL_ELONGATED.tailY : TAIL_NORMAL.tailY;
  const tailMidY = isActive ? TAIL_ELONGATED.tailMidY : TAIL_NORMAL.tailMidY;

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
      style={{ width: BOOKMARK_WIDTH, height: 68 }}
      onClick={handleClick}
      tabIndex={0}
    >
      <svg
        width={BOOKMARK_WIDTH}
        height={68}
        viewBox={`0 0 ${BOOKMARK_WIDTH} 68`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-md"
      >
        {/* Animated bookmark shape: rounded top, pointed bottom */}
        <motion.path
          d={`M2 2 Q2 0 6 0 H${BOOKMARK_WIDTH - 6} Q${BOOKMARK_WIDTH - 2} 0 ${
            BOOKMARK_WIDTH - 2
          } 2 V${tailY} L${BOOKMARK_WIDTH / 2} ${tailMidY} L2 ${tailY} Z`}
          fill={isActive ? "#3B82F6" : "#F1F5F9"}
          stroke="#1E293B"
          strokeWidth="1.5"
          animate={controls}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
        />
        {/* Optional: top fold effect */}
        <path
          d={`M2 2 Q2 0 6 0 H${BOOKMARK_WIDTH - 6} Q${BOOKMARK_WIDTH - 2} 0 ${
            BOOKMARK_WIDTH - 2
          } 2`}
          fill="#fff"
          fillOpacity={0.18}
        />
      </svg>
      <AnimatePresence>
        {!isActive && (
          <motion.span
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="absolute left-1/2 top-3 -translate-x-1/2 text-blue-500"
          >
            <Plus size={19} strokeWidth={2.5} />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
