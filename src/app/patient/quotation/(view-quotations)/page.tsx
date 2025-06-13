"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { EditIcon } from "lucide-react";
import { useUserStore } from "@/providers/user-store-provider";
import BottomNavigation from "../../../../components/bottom-navigation";
import { getPaginatedQuotations } from "@/lib/supabase/services/quotation.services";
import { QuotationListItemSkeleton } from "@/components/loading-skeletons/quotation-skeleton";

export default function ViewQuotationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = useUserStore((selector) => selector.user?.id);

  // Read pagination from searchParams
  const page = Number(searchParams.get("page") || 1);
  const pageSize = Number(searchParams.get("pageSize") || 10);

  const { data: quotations, isLoading } = useQuery({
    queryKey: ["quotations", userId, page, pageSize],
    queryFn: () =>
      getPaginatedQuotations(page, pageSize, { patient_id: userId }),
    enabled: !!userId,
  });

  // Helper to update searchParams for pagination
  const setPagination = (newPage: number, newPageSize: number = pageSize) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    params.set("pageSize", String(newPageSize));
    router.push(`?${params.toString()}`);
  };

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

      {(quotations?.data?.length ?? 0) === 0 && (
        <div className="mt-10 text-center">
          견적이 없습니다. {/* No quotations. */}
        </div>
      )}

      {quotations?.data && (
        <div className="flex flex-col gap-3">
          {quotations.data.map((q: Quotation) => (
            <QuotationListItem
              key={q.id}
              quotation={q}
              onClick={handleQuotationClick}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex justify-center gap-4 mt-6">
        <Button
          variant="outline"
          disabled={page === 1}
          onClick={() => setPagination(Math.max(1, page - 1))}
        >
          이전 {/* Previous */}
        </Button>
        <span className="self-center font-medium">
          {page} 페이지 {/** page*/}
        </span>
        <Button
          variant="outline"
          disabled={(quotations?.data?.length ?? 0) < pageSize}
          onClick={() => setPagination(page + 1)}
        >
          다음 {/* Next */}
        </Button>
      </div>

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
      <BottomNavigation />
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

  return (
    <div
      className="flex text-sm items-center w-full py-1 cursor-pointer"
      style={{ minHeight: 48 }}
      onClick={() => {
        onClick(q.id, detail, q.clinic_id, q.bid?.[0]?.id ?? null);
      }}
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
      <Button
        className={`rounded-md px-4 h-9 font-medium ${
          q.bid.length > 0
            ? "bg-blue-600 text-white"
            : "border border-gray-200 bg-white text-gray-500"
        }`}
        variant={q.bid.length > 0 ? "outline" : "default"}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {q.bid.length > 0 ? "답변완료" : "답변 없음"}
      </Button>
    </div>
  );
}
