import { Skeleton } from "@/components/ui/skeleton";

export default function ClinicCardSkeleton({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div className={`p-4 border-b ${className}`}>
      <div className="relative w-full h-56 rounded-2xl overflow-hidden bg-gray-200 mb-3">
        <Skeleton className="absolute inset-0 w-full h-full rounded-2xl" />
        <Skeleton className="absolute top-2 right-2 w-8 h-8 rounded-full z-10" />
      </div>
      <Skeleton className="h-6 w-2/3 mb-2 rounded-md" />
      <div className="flex items-center text-base mt-1 gap-2">
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-5 w-10 rounded-md" />
        <Skeleton className="h-5 w-12 rounded-md" />
      </div>
    </div>
  );
}
