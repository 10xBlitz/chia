import { Skeleton } from "@/components/ui/skeleton";

// Skeleton for a single bid item
export function BidSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4 border-b">
      {/* Bidder name */}
      <Skeleton className="h-4 w-24 mb-1" />
      {/* Bid amount */}
      <Skeleton className="h-10 w-1/3 rounded" />
      {/* Explanation field */}
      <Skeleton className="h-4 w-20 mb-1" />
      <Skeleton className="h-10 w-full rounded" />
      {/* Action button */}
      <Skeleton className="h-9 w-24 rounded mt-2" />
    </div>
  );
}

// Skeleton for the quotation info at the top (matching input fields)
export function QuotationSkeleton() {
  return (
    <div className="p-4 border-b flex flex-col gap-4">
      {/* Name field */}
      <div>
        <Skeleton className="h-4 w-20 mb-1" />
        <Skeleton className="h-10 w-full rounded" />
      </div>
      {/* Region field */}
      <div>
        <Skeleton className="h-4 w-20 mb-1" />
        <Skeleton className="h-10 w-full rounded" />
      </div>
      {/* Treatment field */}
      <div>
        <Skeleton className="h-4 w-20 mb-1" />
        <Skeleton className="h-10 w-full rounded" />
      </div>
      {/* Date field */}
      <div>
        <Skeleton className="h-4 w-20 mb-1" />
        <Skeleton className="h-10 w-1/2 rounded" />
      </div>
      {/* Any other fields as needed */}
    </div>
  );
}
