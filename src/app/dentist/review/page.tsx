"use client";

import { useQuery } from "@tanstack/react-query";
import HeaderWithBackButton from "@/components/header-with-back-button";
import { Star } from "lucide-react";
import Image from "next/image";
import { getClinicReviews } from "@/lib/supabase/services/reviews.services";
import { useUserStore } from "@/providers/user-store-provider";

export default function DentistReviewPage() {
  const user = useUserStore((state) => state.user);
  const clinicId = user?.clinic_id;

  const { data, isLoading } = useQuery({
    queryKey: ["clinic-reviews", clinicId],
    queryFn: async () => {
      if (!clinicId) return { reviews: [], views: 0 };
      return await getClinicReviews(clinicId);
    },
    enabled: !!clinicId,
  });

  const reviews = (data?.reviews || []).map((review) => ({
    ...review,
    review: review.review ?? "", // Ensure review is always a string
    images: review.images ?? [],
  }));
  const views = data?.views ?? 0;

  return (
    <div className="flex flex-col">
      <HeaderWithBackButton title="병원 정보" /> {/* Hospital Info */}
      <main className="flex-1 flex flex-col mt-2">
        <ReviewCard views={views} />
        <div className="border-t my-6" />
        <div className="text-lg font-semibold text-black mt-6 mb-2">
          리뷰 목록 {/* Review List */}
        </div>
        <div>
          {isLoading ? (
            <div className="text-center py-8 text-gray-400">
              로딩 중... {/* Loading... */}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-gray-400 text-center py-8">
              아직 리뷰가 없습니다. {/* No reviews yet. */}
            </div>
          ) : (
            reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))
          )}
        </div>
      </main>
    </div>
  );
}

// Reusable: Review Card (with images and patient info)
function ReviewCard({
  review,
  views,
}: {
  review?: {
    id: string;
    rating: number;
    review: string;
    images?: string[];
    created_at?: string;
    user?: { full_name?: string };
  };
  views?: number;
}) {
  if (!review) {
    // InfoRow for views
    return (
      <div className="flex items-center py-2">
        <span className="text-sm text-gray-500 min-w-[72px]">조회수</span>
        <span className="text-base text-black font-medium ml-2">
          {views?.toLocaleString() ?? "0"}
        </span>
      </div>
    );
  }
  return (
    <div className="bg-[#F6FAFF] rounded-xl px-4 py-6 mb-4">
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
            {review.user?.full_name || "김00" /* Kim 00 */}
          </div>
        </div>
      </div>
      {/* Images */}
      {Array.isArray(review.images) && review.images.length > 0 && (
        <div className="flex gap-3 mb-3 flex-wrap">
          {review.images.map((img: string, i: number) => (
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
          {review.rating?.toFixed(1)}
        </span>
        <span className="text-xs text-gray-400 ml-2">
          {review.created_at
            ? (() => {
                const d = new Date(review.created_at);
                return `${d.getFullYear()}. ${
                  d.getMonth() + 1
                }. ${d.getDate()}`;
              })()
            : ""}
        </span>
      </div>
      <div className="text-[15px] leading-relaxed whitespace-pre-line">
        {review.review}
      </div>
    </div>
  );
}
