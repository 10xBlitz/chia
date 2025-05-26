"use client";
import * as React from "react";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useQuery } from "@tanstack/react-query";
import { getPaginatedBanners } from "@/lib/supabase/services/banners.services";

export default function SubBannerCarousel() {
  // Fetch banners with type "sub"
  const { data, isLoading, error } = useQuery({
    queryKey: ["banners", "sub"],
    queryFn: async () => await getPaginatedBanners(1, 10, { type: "sub" }),
    staleTime: 1000 * 60 * 5,
  });

  const banners = data?.data || [];
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);

  // Sync carousel state with API
  React.useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
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
    }, 3000);
    return () => clearInterval(interval);
  }, [api, banners.length]);

  return (
    <div className="relative w-full p-4">
      {/* Dots indicator */}
      <div className="absolute top-6 right-8 z-10 flex gap-2">
        {banners.map((_: any, idx: number) => (
          <span
            key={idx}
            className={`w-2 h-2 rounded-full transition-all ${
              idx === current ? "bg-neutral-900" : "bg-neutral-300"
            }`}
          />
        ))}
      </div>
      <Carousel setApi={setApi} className="w-full">
        <CarouselContent>
          {isLoading && (
            <CarouselItem>
              <div className="flex items-center justify-center h-[120px]">
                Loading...
              </div>
            </CarouselItem>
          )}
          {error && (
            <CarouselItem>
              <div className="flex items-center justify-center h-[120px] text-red-500">
                {error.message}
              </div>
            </CarouselItem>
          )}
          {banners.map((banner: any, idx: number) => (
            <CarouselItem key={idx}>
              <div className="relative bg-[#d6d5d0] rounded-2xl h-[120px] w-full overflow-hidden">
                <Image
                  src={banner.image}
                  alt={banner.title || "Banner Image"}
                  fill
                  className="object-cover rounded-2xl"
                  priority={idx === 0}
                  sizes="100vw"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
