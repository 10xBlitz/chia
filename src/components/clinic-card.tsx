"use client";

import Image from "next/image";

interface ClinicCardProps {
  id: number;
  name: string;
  rating: number;
  reviewCount: number;
  image: string;
}

export default function ClinicCard({
  id,
  name,
  rating,
  reviewCount,
  image,
}: ClinicCardProps) {
  return (
    <div className="p-4 border-b">
      <div className="relative w-full h-40 rounded-lg overflow-hidden bg-gray-200 mb-2">
        {/* Using a placeholder if image fails to load */}
        <div className="w-full h-full relative">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover"
            onError={(e) => {
              // Replace with a default image if loading fails
              const target = e.target as HTMLImageElement;
              target.src = "/images/clinic-placeholder.jpg";
            }}
          />
        </div>
      </div>
      <div className="font-medium">{name}</div>
      <div className="flex items-center text-sm">
        <span className="text-yellow-500">★</span>
        <span>{rating.toFixed(1)}</span>
        <span className="text-gray-500 ml-1">({reviewCount})</span>
      </div>
    </div>
  );
}
