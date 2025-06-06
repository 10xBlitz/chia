import { Skeleton } from "../ui/skeleton";

export function ReservationListSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="flex items-center w-full py-1"
          style={{ minHeight: 48 }}
        >
          <Skeleton className="h-6 w-12 mr-4" />
          <Skeleton className="h-6 flex-1 mr-4" />
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}
