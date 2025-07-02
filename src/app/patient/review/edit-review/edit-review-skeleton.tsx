import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditReviewSkeleton() {
  return (
    <div className="animate-pulse">
      <Skeleton className="h-12 w-32 rounded mb-4 mx-4" />
      {/* Header skeleton */}
      <div className="px-4">
        <Skeleton className="h-5 w-24 rounded mb-2" />
        {/* Treatment label */}
        <Skeleton className="h-10 w-full rounded mb-6" />
        {/* Treatment select */}
      </div>
      <div className="px-4 mt-6">
        <Skeleton className="h-5 w-32 rounded mb-2" />
        {/* Image label */}
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-20 rounded" />
          ))}
        </div>
      </div>
      <div className="px-4 mt-6">
        <Skeleton className="h-5 w-20 rounded mb-2" />
        {/* Review label */}
        <Skeleton className="h-32 w-full rounded" />
        {/* Review textarea */}
      </div>
      <div className="px-4 mt-6">
        <Skeleton className="h-5 w-16 rounded mb-2" />
        {/* Rating label */}
        <div className="flex gap-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-6 w-6 rounded-full" />
          ))}
        </div>
      </div>
      <div className="px-4 mt-8 mb-4">
        <Skeleton className="h-12 w-full rounded" />
        {/* Submit button */}
      </div>
    </div>
  );
}
