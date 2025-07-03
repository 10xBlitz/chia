"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { getPaginatedTreatments } from "@/lib/supabase/services/treatments.services";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useTreatmentCarouselStore } from "@/stores/treatment-carousel-store";
import { useRef } from "react";

export default function TreatmentCategoryScroll({
  activeId,
}: {
  activeId?: string;
}) {
  const treatmentQuery = useQuery({
    queryKey: ["treatments"],
    queryFn: () => getPaginatedTreatments(1, 100),
  });

  const { setScrollSnap, scrollSnap } = useTreatmentCarouselStore();
  const hasInitialized = useRef(false);

  const treatments = treatmentQuery.data?.data;

  // When the api is set for the first time, scroll to the correct index and set up the event listener
  const handleSetApi = (carouselApi: CarouselApi | undefined) => {
    if (!carouselApi) return;
    if (!hasInitialized.current) {
      // Only scroll on first mount or re-render
      let targetIndex = 0;
      if (typeof scrollSnap === "number") {
        targetIndex = scrollSnap;
      }
      carouselApi.scrollTo(targetIndex, true);
      hasInitialized.current = true;
    }

    carouselApi.on("select", () => {
      setScrollSnap(carouselApi.selectedScrollSnap());
    });
  };

  return (
    <Carousel
      className="px-4 py-4 mt-2"
      opts={{
        dragFree: true,
      }}
      setApi={handleSetApi}
    >
      <CarouselContent className="flex space-x-0">
        {treatmentQuery.isLoading && (
          <CarouselItem className="basis-24">
            <p>치료 항목을 불러오는 중...</p> {/* Loading treatments... */}
          </CarouselItem>
        )}
        {treatmentQuery.error && (
          <CarouselItem className="basis-24">
            <p>
              치료 항목을 불러오는 중 오류가 발생했습니다:{" "}
              {treatmentQuery.error.message}
            </p>
          </CarouselItem>
        )}
        {treatmentQuery.data &&
          treatments?.map((treatment) => (
            <CarouselItem key={treatment.id} className="basis-20 w-auto">
              <Link
                href={`/clinics/${treatment.id}`}
                className={cn(
                  "flex flex-col items-center flex-shrink-0",
                  activeId === treatment.id && "text-blue-500 font-bold"
                )} // Active treatment color
                draggable={false}
                onClick={(e) => e.stopPropagation()} // Prevent carousel from handling click
              >
                <div
                  className={cn(
                    "relative w-13 h-13 rounded-full overflow-hidden"
                  )}
                  draggable={false}
                >
                  {treatment.image_url ? (
                    <Image
                      draggable={false}
                      src={treatment.image_url}
                      alt={treatment.treatment_name || "치료 항목"} // treatment
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-xs text-gray-500">
                      아이콘
                    </span> /* Icon */
                  )}
                </div>
                <span className="text-xs mt-1 w-16 text-center ">
                  {treatment.treatment_name}
                </span>
              </Link>
            </CarouselItem>
          ))}
      </CarouselContent>
    </Carousel>
  );
}
