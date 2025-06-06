"use client";

import ClinicReviewCard from "@/components/clinic-review-card";
import HeaderWithBackButton from "@/components/header-with-back-button";
import MobileLayout from "@/components/layout/mobile-layout";
import ClinicReviewCardSkeleton from "@/components/loading-skeletons/clinic-review-skeleton";
import { getPaginatedReviews } from "@/lib/supabase/services/reviews.services";
import { useUserStore } from "@/providers/user-store-provider";
import { useQuery } from "@tanstack/react-query";
import React from "react";

function ViewReviewsPage() {
  const user = useUserStore((state) => state.user);

  const {
    data: reviews,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["reviews", user?.id],
    queryFn: () => getPaginatedReviews(1, 1000, { patient_id: user?.id }),
    enabled: !!user?.id,
  });

  return (
    <MobileLayout>
      <HeaderWithBackButton title="리뷰 보기" />

      {error && (
        <div className="bg-red-500/20 p-4 rounded-md">{error.message}</div>
      )}

      {isLoading &&
        Array.from({ length: 3 }).map((_, i) => (
          <ClinicReviewCardSkeleton key={i} />
        ))}

      {reviews &&
        reviews.data.map((review) => {
          return (
            <ClinicReviewCard
              key={review.id}
              id={review.id}
              full_name={user?.full_name}
              images={review.images || []}
              rating={review.rating}
              created_at={review.created_at}
              review={review.review || ""}
            />
          );
        })}
    </MobileLayout>
  );
}

export default ViewReviewsPage;
