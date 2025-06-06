import { Skeleton } from "@/components/ui/skeleton";

export default function ClinicReviewCardSkeleton() {
  return (
    <div className="bg-[#F6FAFF] rounded-xl px-4 py-6">
      <div className="flex items-center gap-4 mb-3">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-5 w-24 mb-1" />
        </div>
      </div>
      {/* Images skeleton */}
      <div className="flex gap-3 mb-3 flex-wrap">
        {[...Array(2)].map((_, i) => (
          <Skeleton key={i} className="w-20 h-20 rounded-lg" />
        ))}
      </div>
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-4 w-20 ml-2" />
      </div>
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}
