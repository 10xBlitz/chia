"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useInfiniteQuery } from "@tanstack/react-query";
import { EditIcon } from "lucide-react";
import { useUserStore } from "@/providers/user-store-provider";
import { getPaginatedQuotations } from "@/lib/supabase/services/quotation.services";
import { QuotationListItemSkeleton } from "@/components/loading-skeletons/quotation-skeleton";

// Constants
const PAGE_SIZE = 10; // Number of quotations per page

export default function ViewQuotationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = useUserStore((selector) => selector.user?.id);
  const pageSize = Number(searchParams.get("pageSize") || PAGE_SIZE);

  // Infinite Query for quotations
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["quotations", userId, pageSize],
      queryFn: async ({ pageParam = 1 }) => {
        if (!userId) return { data: [] };
        return getPaginatedQuotations(pageParam, pageSize, {
          patient_id: userId,
        });
      },
      getNextPageParam: (lastPage, allPages) =>
        lastPage?.data?.length === pageSize ? allPages.length + 1 : undefined,
      enabled: !!userId,
      initialPageParam: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });

  // Flatten all loaded quotations with safety check
  const allQuotations = data?.pages?.flatMap((page) => page?.data || []) || [];

  const handleQuotationClick = (
    quotation_id: string,
    quotation_details: string,
    clinic_id: string | null,
    bid_id: string | null
  ) => {
    if (!clinic_id) {
      //it means it's a public quotation, so redirect to view all bids
      router.push(
        `/patient/quotation/view-bids/${quotation_id}?quotation_details=${quotation_details}`
      );
    } else {
      //it means it's a private quotation (specific to clinic)
      router.push(
        `/patient/quotation/view-bid/${quotation_id}?bid_id=${bid_id}`
      );
    }
  };

  return (
    <>
      <h2 className="font-bold text-xl mb-6">견적 {/* Estimates */}</h2>
      <h2 className="font-bold text-xl mb-4">
        견적 목록 {/* List of Quotes */}
      </h2>
      {isLoading &&
        Array.from({ length: 3 }).map((_, i) => (
          <QuotationListItemSkeleton key={i} />
        ))}

      {allQuotations.length === 0 && !isLoading && (
        <div className="mt-10 text-center">
          견적이 없습니다. {/* No quotations. */}
        </div>
      )}

      {allQuotations.length > 0 && (
        <div className="flex flex-col gap-3">
          {allQuotations.map((q: Quotation, index) => (
            <QuotationListItem
              key={`${q.id}-${index}`}
              quotation={q}
              onClick={handleQuotationClick}
            />
          ))}
        </div>
      )}

      {/* Infinite Pagination Controls */}
      {hasNextPage && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "로딩 중..." : "더 보기"} {/* Load more */}
          </Button>
        </div>
      )}

      {/* Floating Button */}
      <Button
        className="fixed bottom-24 right-6 z-30 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-5 py-2 shadow-lg flex items-center gap-2 transition-all"
        style={{ fontWeight: 500, fontSize: 16 }}
        onClick={() => {
          router.push(`/patient/quotation/create-quotation`);
        }}
      >
        <EditIcon />
        견적서 작성 {/* Create a Quote */}
      </Button>
    </>
  );
}

export interface Quotation {
  id: string;
  created_at: string | Date;
  region: string;
  treatment: {
    treatment_name: string;
  } | null;
  clinic_id: string | null;
  bid: { id: string }[];
}

interface QuotationListItemProps {
  quotation: Quotation;
  onClick: (
    quotation_id: string,
    quotation_details: string,
    clinic_id: string | null,
    bid_id: string | null
  ) => void;
}

function QuotationListItem({ quotation: q, onClick }: QuotationListItemProps) {
  const detail = `${q.region?.split(",")[1]?.trim() || q.region} · ${
    q.treatment?.treatment_name || "선택된 치료 없음"
  } 공개견적`;

  const handleClick = () => {
    onClick(q.id, detail, q.clinic_id, q.bid?.[0]?.id ?? null);
  };

  return (
    <div
      className="flex text-sm items-center w-full py-1 cursor-pointer"
      style={{ minHeight: 48 }}
      onClick={handleClick}
    >
      <span className="font-bold text-black text-left whitespace-nowrap mr-4">
        {new Date(q.created_at).toLocaleDateString("ko-KR", {
          month: "numeric",
          day: "numeric",
        })}
      </span>
      <span className="text-gray-600 truncate flex-1 mr-4 whitespace-nowrap">
        {q.region?.split(",")[1]?.trim() || q.region} ·{" "}
        {q.treatment?.treatment_name || "선택된 치료 없음"}{" "}
        {q.clinic_id ? "치과" : "공개견적"}
      </span>
      <div
        className={`rounded-md flex justify-center items-center px-4 h-9 font-medium  ${
          q.bid.length > 0
            ? "bg-blue-600 text-white"
            : "border border-gray-200 bg-white text-gray-500"
        }`}
        tabIndex={-1}
      >
        {q.bid.length > 0 ? "답변완료" : "답변 없음"}
      </div>
    </div>
  );
}
