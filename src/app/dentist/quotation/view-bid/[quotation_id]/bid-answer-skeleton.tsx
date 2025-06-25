import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loader for the bid answer section in the quotation view page.
 * Matches the form layout for a consistent loading experience.
 */
export function BidAnswerSkeleton() {
  return (
    <div className="border-t pt-6 mt-2 animate-pulse">
      <Skeleton className="font-semibold mb-3 h-5 w-20 rounded" />
      <div className="mb-2">
        <span className="block text-xs text-gray-500 mb-1">
          병원명 {/* Clinic Name */}
        </span>
        <Skeleton className="h-5 w-32 rounded" />
      </div>
      <div className="mb-2">
        <span className="block text-xs text-gray-500 mb-1">
          추천 시술 {/* Recommended Treatment */}
        </span>
        <Skeleton className="h-5 w-32 rounded" />
      </div>
      <div className="mb-2">
        <span className="block text-xs text-gray-500 mb-1">
          예상 견적 {/* Estimated Price */}
        </span>
        <Skeleton className="h-5 w-24 rounded" />
      </div>
      <div className="mb-2">
        <span className="block text-xs text-gray-500 mb-1">
          추가 설명 {/* Additional Explanation */}
        </span>
        <Skeleton className="border rounded-lg px-3 py-2 min-h-[56px] w-full" />
      </div>
      <div className="flex items-center gap-2 mt-2">
        <Skeleton className="w-4 h-4 rounded" />
        <Skeleton className="h-4 w-24 rounded" />
      </div>
    </div>
  );
}
