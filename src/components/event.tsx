"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { supabaseClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function EventCarousel() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const {
    data: events,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabaseClient
        .from("event")
        .select("*, clinic_treatment!inner(*, clinic!inner(*), treatment(*))")
        .neq("status", "deleted")
        .neq("clinic_treatment.clinic.status", "deleted");
      if (error) throw error;
      return data;
    },
    retry: 1,
  });

  // Add touch and mouse event listeners for scrolling
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Touch event handlers
    const touchStart = (e: TouchEvent) => {
      setStartX(e.touches[0].pageX - container.offsetLeft);
      setScrollLeft(container.scrollLeft);
    };

    const touchMove = (e: TouchEvent) => {
      if (!startX) return;
      const x = e.touches[0].pageX - container.offsetLeft;
      const dist = x - startX;
      container.scrollLeft = scrollLeft - dist;
    };

    // Mouse event handlers for PC
    const mouseDown = (e: MouseEvent) => {
      setIsDragging(true);
      setStartX(e.pageX - container.offsetLeft);
      setScrollLeft(container.scrollLeft);
      container.style.cursor = "grabbing";
      container.style.userSelect = "none";
    };

    const mouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const dist = x - startX;
      container.scrollLeft = scrollLeft - dist;
    };

    const mouseUp = () => {
      setIsDragging(false);
      container.style.cursor = "grab";
      container.style.removeProperty("user-select");
    };

    const mouseLeave = () => {
      if (isDragging) {
        setIsDragging(false);
        container.style.cursor = "grab";
        container.style.removeProperty("user-select");
      }
    };

    // Add event listeners
    container.addEventListener("touchstart", touchStart);
    container.addEventListener("touchmove", touchMove);
    container.addEventListener("mousedown", mouseDown);
    container.addEventListener("mousemove", mouseMove);
    container.addEventListener("mouseup", mouseUp);
    container.addEventListener("mouseleave", mouseLeave);

    return () => {
      // Remove event listeners on cleanup
      container.removeEventListener("touchstart", touchStart);
      container.removeEventListener("touchmove", touchMove);
      container.removeEventListener("mousedown", mouseDown);
      container.removeEventListener("mousemove", mouseMove);
      container.removeEventListener("mouseup", mouseUp);
      container.removeEventListener("mouseleave", mouseLeave);
    };
  }, [isDragging, startX, scrollLeft]);

  if (isLoading) return <p>Loading events...</p>;
  if (error) return <p>Error loading events: {error.message}</p>;
  // // 이벤트가 없습니다 (No events available)
  // if (!events || events.length === 0) return <p>이벤트가 없습니다</p>;

  if (!events || events.length === 0) return <></>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">
        지금 진행 중인 이벤트 {/**Current Events */}
      </h2>

      <div
        ref={scrollContainerRef}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          cursor: isDragging ? "grabbing" : "grab",
        }}
        className="flex space-x-4 overflow-x-auto pb-4 scroll-smooth"
      >
        {events &&
          events.map((event) => (
            <div key={event.id} className="flex-shrink-0 w-[180px]">
              <Link
                href={`/event/${event.id}`}
                className="block"
                draggable={false}
              >
                <div className="space-y-3">
                  {/* Image */}
                  <div className="bg-gray-100 rounded-lg overflow-hidden aspect-square relative">
                    {event.thumbnail_url || event.image_url ? (
                      <Image
                        src={
                          event.thumbnail_url ||
                          event.image_url ||
                          "/images/fallback-image.png"
                        }
                        alt={event.title || "event"}
                        width={300}
                        height={300}
                        className="object-cover w-full h-full"
                        draggable={false}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-gray-500">No Image</span>
                      </div>
                    )}

                    {/* Discount Badge */}
                    {event.discount > 0 && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-medium">
                        {event.discount}% 할인
                      </div>
                    )}
                  </div>

                  {/* Title Below Image */}
                  <div className="space-y-1">
                    <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 leading-tight">
                      {event.title}
                    </h3>
                    <p className="text-xs text-gray-600 truncate">
                      {event.clinic_treatment.clinic.clinic_name}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          ))}
      </div>
    </div>
  );
}
