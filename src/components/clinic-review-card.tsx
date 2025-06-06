import { Star } from "lucide-react";
import Image from "next/image";
import React from "react";

interface ClinicReviewCardProps {
  id: string | number;
  full_name?: string;
  images?: string[];
  rating?: number | string;
  created_at?: string | Date;
  review?: string;
}

function ClinicReviewCard(props: ClinicReviewCardProps) {
  return (
    <div key={props.id} className="bg-[#F6FAFF] rounded-xl px-4 py-6">
      <div className="flex items-center gap-4 mb-3">
        <div className="w-12 h-12 rounded-full bg-[#E9EEF3] flex items-center justify-center">
          <span className="text-2xl text-gray-400">
            {/* User icon */}
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="4" fill="#B0B8C1" />
              <rect x="4" y="16" width="16" height="6" rx="3" fill="#B0B8C1" />
            </svg>
          </span>
        </div>
        <div className="flex-1">
          <div className="font-semibold text-base">
            {props?.full_name || "김00"}
          </div>
        </div>
      </div>
      {/* Images */}
      {Array.isArray(props.images) && props.images.length > 0 && (
        <div className="flex gap-3 mb-3 flex-wrap">
          {props.images.map((img: string, i: number) => (
            <div
              key={i}
              className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0"
            >
              <Image
                src={img}
                alt={`review-img-${i}`}
                width={128}
                height={128}
                className="object-cover w-full h-full"
              />
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-yellow-500 flex items-center gap-1 font-medium text-base">
          <Star size={18} fill="currentColor" />
          {props.rating || "4.2"}
        </span>
        <span className="text-xs text-gray-400 ml-2">
          {props.created_at
            ? (() => {
                const d = new Date(props.created_at);
                return `${d.getFullYear()}. ${
                  d.getMonth() + 1
                }. ${d.getDate()}`;
              })()
            : ""}
        </span>
      </div>
      <div className="text-[15px] leading-relaxed whitespace-pre-line">
        {props.review}
      </div>
    </div>
  );
}

export default ClinicReviewCard;
