import { Button } from "@/components/ui/button";
import { Bookmark, BookmarkCheck } from "lucide-react";
import React from "react";

interface BookmarkButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive: boolean;
  notActiveStyle?: string;
  activeStyle?: string;
  handleBookmarkClick: (e: React.MouseEvent) => void;
}

export default function BookmarkButton({
  isActive,
  handleBookmarkClick,
  className,
  notActiveStyle = "",
  activeStyle = "",
  ...props
}: BookmarkButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      className={className}
      onClick={handleBookmarkClick}
      aria-label={isActive ? "Remove from favorites" : "Add to favorites"}
      {...props}
    >
      {isActive ? (
        <BookmarkCheck
          strokeWidth={1}
          className={`fill-yellow-300 min-h-6 min-w-6 text-black ${activeStyle}`}
        />
      ) : (
        <Bookmark className={`min-h-6 min-w-6 text-black ${notActiveStyle}`} />
      )}
    </Button>
  );
}
