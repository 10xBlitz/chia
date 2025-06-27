import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Bookmark } from "lucide-react";
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
      className={cn(className, "group hover:bg-transparent")}
      onClick={handleBookmarkClick}
      aria-label={isActive ? "Remove from favorites" : "Add to favorites"}
      {...props}
    >
      {isActive ? (
        <Bookmark
          strokeWidth={1}
          className={`fill-blue-500  min-h-6 min-w-6 text-black ${activeStyle}`}
        />
      ) : (
        <Bookmark
          className={`min-h-6 min-w-6 group-hover:fill-blue-600 text-black ${notActiveStyle}`}
        />
      )}
    </Button>
  );
}
