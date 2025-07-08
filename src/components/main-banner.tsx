"use client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import ImageSkeleton from "./loading-skeletons/image-skeleton";
import { useRouter } from "next/navigation";
import { getPaginatedBanners } from "@/lib/supabase/services/banner.services";

export default function MainBannerCarousel() {
  // Fetch banners with type "main"

  const { data, isLoading, error } = useQuery({
    queryKey: ["banners", "main"],
    queryFn: () => getPaginatedBanners(1, 100, { banner_type: "main" }),
  });

  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const router = useRouter();

  // Track pointer down/up to distinguish click vs drag
  const [pointerDown, setPointerDown] = useState(false);
  const [dragged, setDragged] = useState(false);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

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

  return (
    <div className="relative max-w-[460px]">
      <Carousel setApi={setApi} className="w-full">
        <CarouselContent className="min-w-full">
          {isLoading && (
            <CarouselItem>
              <ImageSkeleton />
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
            <CarouselItem
              key={index}
              className="w-full"
              onPointerDown={(e) => {
                setPointerDown(true);
                setDragged(false);
                pointerStart.current = { x: e.clientX, y: e.clientY };
              }}
              onPointerMove={(e) => {
                if (!pointerDown || !pointerStart.current) return;
                const dx = Math.abs(e.clientX - pointerStart.current.x);
                const dy = Math.abs(e.clientY - pointerStart.current.y);
                if (dx > 5 || dy > 5) setDragged(true);
              }}
              onPointerUp={() => {
                setPointerDown(false);
                if (!dragged && banner.clinic_id) {
                  router.push(`/clinic/${banner.clinic_id}`);
                }
                setDragged(false);
                pointerStart.current = null;
              }}
              onPointerLeave={() => {
                setPointerDown(false);
                setDragged(false);
                pointerStart.current = null;
              }}
              style={{ cursor: banner.clinic_id ? "pointer" : undefined }}
            >
              <div className="relative h-[200px]">
                <Image
                  src={banner.image || "/images/fallback-image.png"}
                  alt={banner.title || "Banner Image"}
                  fill
                  className="object-cover "
                  priority={index === 0}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== window.location.origin + "/images/fallback-image.png") {
                      target.src = "/images/fallback-image.png";
                    }
                  }}
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
