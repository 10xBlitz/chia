import MobileLayout from "@/components/layout/mobile-layout";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClinicDetailSkeleton() {
  return (
    <MobileLayout>
      <div className="flex flex-col !px-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-2 bg-white z-20">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        {/* Banner Image */}
        <div className="w-full h-[180px] relative">
          <Skeleton className="w-full h-full rounded-none" />
        </div>
        {/* Clinic Card Section */}
        <div
          className="bg-white px-6 pb-6"
          style={{ zIndex: 1, position: "relative" }}
        >
          <div className="pt-8 pb-2">
            <Skeleton className="h-8 w-1/2 mb-2" />
            <div className="flex items-center gap-2 mt-1">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-5 w-10" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
          <div className="flex flex-col gap-2 text-gray-700 text-[15px] mt-4">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-5 w-1/4" />
          </div>
        </div>
        {/* Tabs */}
        <div className="flex border-b mt-4 bg-white sticky top-0 z-10">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="flex-1 h-8 mx-2" />
          ))}
        </div>
        {/* Content */}
        <div className="flex-1 overflow-auto px-4 pb-20">
          {/* Info Section */}
          <div className="mt-6">
            <Skeleton className="h-6 w-24 mb-4" />
            <Skeleton className="h-16 w-full rounded-xl mb-4" />
            <Skeleton className="h-24 w-full rounded-xl mb-4" />
            <Skeleton className="h-6 w-24 mb-4" />
            <Skeleton className="h-40 w-full rounded-lg mb-2" />
            <Skeleton className="h-5 w-1/2 mb-2" />
          </div>
          {/* Photos Section */}
          <div className="mt-10">
            <Skeleton className="h-6 w-24 mb-2" />
            <div className="grid grid-cols-3 gap-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="aspect-square w-full rounded-lg" />
              ))}
            </div>
          </div>
          {/* Reviews Section */}
          <div className="mt-10">
            <Skeleton className="h-6 w-24 mb-2" />
            <div className="flex flex-col gap-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <Skeleton className="h-5 w-1/4 mb-1" />
                  <Skeleton className="h-4 w-3/4 mb-1" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
              <Skeleton className="h-10 w-32 mx-auto mt-4 rounded-md" />
            </div>
          </div>
        </div>
        {/* Bottom actions */}
        <div className="max-w-[460px] w-full mx-auto bg-white flex gap-2 px-4 py-3 mb-20">
          <Skeleton className="h-10 flex-1 rounded-md" />
          <Skeleton className="h-10 flex-1 rounded-md" />
        </div>
        {/* Floating review button */}
        <Skeleton className="fixed bottom-24 right-6 z-30 h-12 w-40 rounded-full" />
      </div>
    </MobileLayout>
  );
}
