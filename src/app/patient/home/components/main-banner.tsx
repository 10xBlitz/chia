"use client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { getPaginatedBanners } from "@/lib/supabase/services/banners.services";
import { useEffect, useState } from "react";

export default function MainBannerCarousel() {
  // Fetch banners with type "main"

  const { data, isLoading, error } = useQuery({
    queryKey: ["banners", "main"],
    queryFn: async () => await getPaginatedBanners(1, 10, { type: "main" }),
  });

  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  // Sync carousel state with API
  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  // Auto-scroll effect
  useEffect(() => {
    if (!api) return;
    if (!data?.data.length) return;
    const interval = setInterval(() => {
      if (api.selectedScrollSnap() === api.scrollSnapList().length - 1) {
        api.scrollTo(0);
      } else {
        api.scrollNext();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [api, data?.data.length]);

  // useEffect(() => {
  //   refetch();
  // }, []);

  return (
    <div className="relative max-w-[460px]">
      <Carousel setApi={setApi} className="w-full">
        <CarouselContent className="w-full">
          {isLoading && (
            <CarouselItem>
              <div className="flex items-center justify-center h-[200px]">
                Loading...
              </div>
            </CarouselItem>
          )}
          {error && (
            <CarouselItem>
              <div className="flex items-center justify-center h-[200px] text-red-500">
                {error.message}
              </div>
            </CarouselItem>
          )}
          {data?.data.map((banner, index: number) => (
            <CarouselItem key={index} className="w-full">
              <div className="relative w-screen h-[200px]">
                <Image
                  src={banner.image}
                  alt={banner.title || "Banner Image"}
                  fill
                  className="object-cover "
                  priority={index === 0}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <div className="absolute bottom-2 right-2 rounded-full bg-black text-white px-3 py-1 text-sm z-10">
        {data?.data.length ? `${current + 1} / ${data?.totalItems || 0}` : ""}
      </div>
    </div>
  );
}
