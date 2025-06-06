import { Skeleton } from "../ui/skeleton";

export function QuotationListItemSkeleton() {
  return (
    <div
      className="flex text-sm items-center w-full py-1"
      style={{ minHeight: 48 }}
    >
      <Skeleton className="h-5 w-12 mr-4" />
      <Skeleton className="h-5 flex-1 mr-4" />
      <Skeleton className="h-9 w-20 rounded-md" />
    </div>
  );
}
