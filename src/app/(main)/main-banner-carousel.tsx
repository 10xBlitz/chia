"use client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import Image from "next/image";
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { getPaginatedBanners } from "@/lib/supabase/services/banners.services";

export default function MainBannerCarousel() {
  // Fetch banners with type "main"
  const { data, isLoading, error } = useQuery({
    queryKey: ["banners", "main"],
    queryFn: async () => await getPaginatedBanners(1, 10, { type: "main" }),
    staleTime: 1000 * 60 * 5,
  });

  const banners = data?.data || [];
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);

  // Sync carousel state with API
  React.useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  // Auto-scroll effect
  React.useEffect(() => {
    if (!api) return;
    if (!banners.length) return;
    const interval = setInterval(() => {
      if (api.selectedScrollSnap() === api.scrollSnapList().length - 1) {
        api.scrollTo(0);
      } else {
        api.scrollNext();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [api, banners.length]);

  return (
    <div className="w-full ">
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
          {banners.map((banner: any, index: number) => (
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
        <div className="absolute bottom-2 rounded-full right-4 bg-black text-white px-3 py-1 text-sm z-10">
          {banners.length ? `${current + 1} / ${data?.totalItems || 0}` : ""}
        </div>
      </Carousel>
    </div>
  );
}
