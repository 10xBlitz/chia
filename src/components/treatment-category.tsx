"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { getPaginatedTreatments } from "@/lib/supabase/services/treatments.services";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";

export default function TreatmentCategoryScroll() {
  const treatmentQuery = useQuery({
    queryKey: ["treatments"],
    queryFn: async () => await getPaginatedTreatments(1, 100),
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Mouse event handlers for drag-to-scroll
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

    container.addEventListener("mousedown", mouseDown);
    container.addEventListener("mousemove", mouseMove);
    container.addEventListener("mouseup", mouseUp);
    container.addEventListener("mouseleave", mouseLeave);

    return () => {
      container.removeEventListener("mousedown", mouseDown);
      container.removeEventListener("mousemove", mouseMove);
      container.removeEventListener("mouseup", mouseUp);
      container.removeEventListener("mouseleave", mouseLeave);
    };
  }, [isDragging, startX, scrollLeft]);

  return (
    <div
      ref={scrollContainerRef}
      style={{
        scrollbarWidth: "none",
        cursor: isDragging ? "grabbing" : "grab",
      }}
      className="flex space-x-4 px-4 py-4 overflow-x-scroll"
    >
      {treatmentQuery.isLoading && <p>Loading treatments...</p>}
      {treatmentQuery.error && (
        <p>Error loading treatments: {treatmentQuery.error.message}</p>
      )}
      {treatmentQuery.data &&
        treatmentQuery.data.data.map((treatment) => (
          <Link
            href={`/clinics/${treatment.id}`}
            key={treatment.id}
            className="flex flex-col items-center flex-shrink-0"
          >
            <div className="relative w-13 h-13 rounded-full overflow-hidden">
              {treatment.image_url ? (
                <Image
                  draggable={false}
                  src={treatment.image_url}
                  alt={treatment.treatment_name || "treatment"}
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="text-xs text-gray-500">Icon</span>
              )}
            </div>
            <span className="text-xs mt-1 w-16 text-center ">
              {treatment.treatment_name}
            </span>
          </Link>
        ))}
    </div>
  );
}
