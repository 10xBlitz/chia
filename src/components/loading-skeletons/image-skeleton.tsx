import { Skeleton } from "@/components/ui/skeleton";

export default function ImageSkeleton() {
  return (
    <div className="flex items-center justify-center h-[200px] w-full">
      <Skeleton className="w-full h-full rounded-xl" />
    </div>
  );
}
