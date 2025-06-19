"use client";

import ClinicReviewCard from "@/components/clinic-review-card";
import HeaderWithBackButton from "@/components/header-with-back-button";
import MobileLayout from "@/components/layout/mobile-layout";
import ClinicReviewCardSkeleton from "@/components/loading-skeletons/clinic-review-skeleton";
import { getPaginatedReviews } from "@/lib/supabase/services/reviews.services";
import { useUserStore } from "@/providers/user-store-provider";
import { useInfiniteQuery } from "@tanstack/react-query";
import React from "react";

const MAX_REVIEWS_PER_PAGE = 3; // Maximum reviews per page
function ViewReviewsPage() {
  const user = useUserStore((state) => state.user);

  // Infinite query for paginated reviews
  const {
    data: infiniteReviewsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["reviews-infinite", user?.id],
    queryFn: async ({ pageParam = 1 }) =>
      getPaginatedReviews(pageParam, MAX_REVIEWS_PER_PAGE, {
        patient_id: user?.id,
      }),
    enabled: !!user?.id,
    getNextPageParam: (lastPage, allPages) => {
      // If the last page has less than 10 reviews, no more pages
      if (!lastPage?.data || lastPage.data.length < MAX_REVIEWS_PER_PAGE)
        return undefined;
      return allPages.length + 1;
    },
    initialPageParam: 1,
    refetchOnWindowFocus: false,
  });

  // Flatten all loaded reviews
  const allReviews =
    infiniteReviewsData?.pages.flatMap((page) => page.data) || [];

  return (
    <MobileLayout>
      <HeaderWithBackButton title="리뷰 보기" />

      {error && (
        <div className="bg-red-500/20 p-4 rounded-md">{error.message}</div>
      )}

      {isLoading &&
        Array.from({ length: 5 }).map((_, i) => (
          <ClinicReviewCardSkeleton key={i} />
        ))}

      {allReviews.map((review) => (
        <ClinicReviewCard
          key={review.id}
          id={review.id}
          full_name={user?.full_name}
          images={review.images || []}
          rating={review.rating}
          created_at={review.created_at}
          review={review.review || ""}
        />
      ))}

      {/* Load More Button */}
      {hasNextPage && (
        <div className="flex justify-center my-4">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {isFetchingNextPage ? "불러오는 중..." : "더 보기"}
            {/* 더 보기 = Load More */}
          </button>
        </div>
      )}
    </MobileLayout>
  );
}

export default ViewReviewsPage;
